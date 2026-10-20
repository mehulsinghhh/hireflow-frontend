'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';
import { applicationsService } from '@/services/applications';
import { Application, ApplicationStatus, ApplicationStatusChange } from '@/types';

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'REJECTED',
  'HIRED',
];

const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatusChange[]> = {
  APPLIED: ['SCREENING', 'REJECTED'],
  SCREENING: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['HIRED', 'REJECTED'],
  REJECTED: [],
  HIRED: [],
};

type ActionFeedback = {
  message: string;
  type: 'success' | 'error';
};

function formatStatus(status: ApplicationStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function statusVariant(status: ApplicationStatus) {
  if (status === 'REJECTED') return 'danger' as const;
  if (status === 'HIRED') return 'success' as const;
  if (status === 'INTERVIEW') return 'warning' as const;
  return 'info' as const;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && typeof error.data === 'object' && error.data !== null) {
    const message = (error.data as { error?: string }).error;
    if (message) return message;
  }

  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, ApplicationStatusChange | ''>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const latestLoadRequest = useRef(0);
  const mutationVersion = useRef(0);
  const latestStatusRequest = useRef(new Map<string, number>());
  const isMounted = useRef(true);
  const adminSessionKey = user?.role === 'ADMIN' ? `${user.id}:${user.role}` : null;
  const activeSession = useRef({ key: null as string | null, generation: 0 });
  const scheduledLoad = useRef<{ key: string; generation: number } | null>(null);

  const isCurrentSession = useCallback((key: string, generation: number) => (
    isMounted.current
    && activeSession.current.key === key
    && activeSession.current.generation === generation
  ), []);

  const loadApplications = useCallback(async (sessionKey: string, sessionGeneration: number) => {
    if (!isCurrentSession(sessionKey, sessionGeneration)) return;

    const requestId = ++latestLoadRequest.current;
    const requestedMutationVersion = mutationVersion.current;
    setIsLoading(true);
    setError(null);

    try {
      const loadedApplications = await applicationsService.getAll();
      if (!isCurrentSession(sessionKey, sessionGeneration) || requestId !== latestLoadRequest.current || requestedMutationVersion !== mutationVersion.current) {
        return;
      }

      setApplications(loadedApplications);
    } catch (loadError) {
      if (!isCurrentSession(sessionKey, sessionGeneration) || requestId !== latestLoadRequest.current || requestedMutationVersion !== mutationVersion.current) {
        return;
      }

      setError(getErrorMessage(loadError, 'Unable to load applications.'));
    } finally {
      if (isCurrentSession(sessionKey, sessionGeneration) && requestId === latestLoadRequest.current) {
        setIsLoading(false);
      }
    }
  }, [isCurrentSession]);

  useLayoutEffect(() => {
    if (activeSession.current.key !== adminSessionKey) {
      activeSession.current = {
        key: adminSessionKey,
        generation: activeSession.current.generation + 1,
      };
      latestLoadRequest.current += 1;
      latestStatusRequest.current = new Map();
      mutationVersion.current += 1;
      scheduledLoad.current = null;
      setUpdatingId(null);
      setActionFeedback(null);
    }

    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, [adminSessionKey]);

  useEffect(() => {
    if (!adminSessionKey) return;

    const sessionGeneration = activeSession.current.generation;
    if (scheduledLoad.current?.key === adminSessionKey && scheduledLoad.current.generation === sessionGeneration) {
      return;
    }

    scheduledLoad.current = { key: adminSessionKey, generation: sessionGeneration };

    queueMicrotask(() => {
      if (scheduledLoad.current?.key === adminSessionKey && scheduledLoad.current.generation === sessionGeneration) {
        scheduledLoad.current = null;
      }

      if (isCurrentSession(adminSessionKey, sessionGeneration)) {
        void loadApplications(adminSessionKey, sessionGeneration);
      }
    });
  }, [adminSessionKey, isCurrentSession, loadApplications]);

  const handleStatusUpdate = async (application: Application) => {
    const nextStatus = selectedStatuses[application.id];
    const sessionKey = activeSession.current.key;
    const sessionGeneration = activeSession.current.generation;
    if (!nextStatus || updatingId || !sessionKey || !isCurrentSession(sessionKey, sessionGeneration)) return;

    const requestId = (latestStatusRequest.current.get(application.id) ?? 0) + 1;
    latestStatusRequest.current.set(application.id, requestId);
    mutationVersion.current += 1;
    setUpdatingId(application.id);
    setActionFeedback(null);

    try {
      const updatedApplication = await applicationsService.updateStatus(application.id, nextStatus);
      if (!isCurrentSession(sessionKey, sessionGeneration) || latestStatusRequest.current.get(application.id) !== requestId) return;

      setApplications((currentApplications) => currentApplications.map((currentApplication) => (
        currentApplication.id === updatedApplication.id ? updatedApplication : currentApplication
      )));
      setSelectedStatuses((currentStatuses) => ({ ...currentStatuses, [application.id]: '' }));
      setActionFeedback({ message: 'Application status updated successfully.', type: 'success' });
    } catch (updateError) {
      if (isCurrentSession(sessionKey, sessionGeneration) && latestStatusRequest.current.get(application.id) === requestId) {
        setActionFeedback({ message: getErrorMessage(updateError, 'Unable to update application status.'), type: 'error' });
      }
    } finally {
      if (isCurrentSession(sessionKey, sessionGeneration) && latestStatusRequest.current.get(application.id) === requestId) {
        setUpdatingId(null);
      }
    }
  };

  const visibleApplications = statusFilter === 'ALL'
    ? applications
    : applications.filter((application) => application.status === statusFilter);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-blue-600">Platform administration</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manage Applications</h1>
            <p className="mt-1 text-sm text-slate-600">Review every application and manage its verified status transitions.</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ApplicationStatus | 'ALL')}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="ALL">All statuses</option>
              {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
            </select>
          </label>
        </div>

        {actionFeedback && (
          <p className={`mb-5 rounded-md border px-4 py-3 text-sm ${actionFeedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700'}`} role={actionFeedback.type === 'error' ? 'alert' : 'status'}>
            {actionFeedback.message}
          </p>
        )}

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500">Loading applications...</div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50 text-center">
            <CardContent className="space-y-4">
              <p className="text-sm text-red-700" role="alert">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionFeedback(null);
                  if (adminSessionKey) void loadApplications(adminSessionKey, activeSession.current.generation);
                }}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : applications.length === 0 ? (
          <Card className="border-dashed text-center">
            <CardContent><p className="text-sm text-slate-600">No applications are available yet.</p></CardContent>
          </Card>
        ) : visibleApplications.length === 0 ? (
          <Card className="border-dashed text-center">
            <CardContent><p className="text-sm text-slate-600">No applications match this status.</p></CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="divide-y divide-slate-200">
              {visibleApplications.map((application) => {
                const nextStatuses = ALLOWED_TRANSITIONS[application.status];
                const selectedStatus = selectedStatuses[application.id] ?? '';

                return (
                  <div key={application.id} className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold text-slate-900">{application.job.title}</h2>
                        <Badge variant={statusVariant(application.status)}>{formatStatus(application.status)}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span>{application.job.company.name}</span>
                        <span>{application.candidate.email}</span>
                        <span>Applied {formatDate(application.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                      {nextStatuses.length > 0 ? (
                        <>
                          <label className="sr-only" htmlFor={`status-${application.id}`}>New status</label>
                          <select
                            id={`status-${application.id}`}
                            value={selectedStatus}
                            onChange={(event) => setSelectedStatuses((currentStatuses) => ({
                              ...currentStatuses,
                              [application.id]: event.target.value as ApplicationStatusChange | '',
                            }))}
                            disabled={updatingId !== null}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                          >
                            <option value="">Change status</option>
                            {nextStatuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
                          </select>
                          <Button size="sm" variant="outline" disabled={!selectedStatus || updatingId !== null} isLoading={updatingId === application.id} onClick={() => void handleStatusUpdate(application)}>
                            Update
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500">No further transitions</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

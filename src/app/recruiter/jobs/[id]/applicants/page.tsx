'use client';

import React, { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';
import { applicationsService } from '@/services/applications';
import { jobsService } from '@/services/jobs';
import { Application, ApplicationStatus, ApplicationStatusChange, Job } from '@/types';

const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatusChange[]> = {
  APPLIED: ['SCREENING', 'REJECTED'],
  SCREENING: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['HIRED', 'REJECTED'],
  REJECTED: [],
  HIRED: [],
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && typeof error.data === 'object' && error.data !== null) {
    const message = (error.data as { error?: string }).error;
    if (message) return message;
  }

  return error instanceof Error ? error.message : fallback;
};

const formatStatus = (status: ApplicationStatus) =>
  status.charAt(0) + status.slice(1).toLowerCase();

const statusVariant = (status: ApplicationStatus) => {
  if (status === 'HIRED') return 'success' as const;
  if (status === 'REJECTED') return 'danger' as const;
  if (status === 'INTERVIEW') return 'warning' as const;
  return 'info' as const;
};

export default function RecruiterApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isJobLoading, setIsJobLoading] = useState(true);
  const [isApplicationsLoading, setIsApplicationsLoading] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({});

  const loadJob = useCallback(async () => {
    setIsJobLoading(true);
    setJobError(null);

    try {
      setJob(await jobsService.getById(id));
    } catch (error) {
      setJobError(getErrorMessage(error, 'Unable to load this job.'));
    } finally {
      setIsJobLoading(false);
    }
  }, [id]);

  const loadApplications = useCallback(async () => {
    setIsApplicationsLoading(true);
    setApplicationsError(null);

    try {
      setApplications(await jobsService.getApplications(id));
    } catch (error) {
      setApplicationsError(getErrorMessage(error, 'Unable to load applicants.'));
    } finally {
      setIsApplicationsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user?.role !== 'RECRUITER') return;

    queueMicrotask(() => {
      void loadJob();
      void loadApplications();
    });
  }, [loadApplications, loadJob, user]);

  const handleStatusChange = async (application: Application, value: string) => {
    if (updatingId || value === application.status || !STATUS_TRANSITIONS[application.status].includes(value as ApplicationStatusChange)) {
      return;
    }

    const nextStatus = value as ApplicationStatusChange;
    setUpdatingId(application.id);
    setStatusErrors((current) => ({ ...current, [application.id]: '' }));

    try {
      const updatedApplication = await applicationsService.updateStatus(application.id, nextStatus);
      setApplications((current) => current.map((item) => item.id === updatedApplication.id ? updatedApplication : item));
    } catch (error) {
      setStatusErrors((current) => ({
        ...current,
        [application.id]: getErrorMessage(error, 'Unable to update this application status.'),
      }));
    } finally {
      setUpdatingId(null);
    }
  };

  const contextJob = job ?? applications[0]?.job;

  return (
    <ProtectedRoute allowedRoles={['RECRUITER']}>
      <div className="max-w-5xl mx-auto py-6">
        <Link href={`/recruiter/jobs/${id}`} className="text-sm font-medium text-slate-500 hover:text-slate-900">
          &larr; Back to Job
        </Link>

        <div className="mt-6 mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Applicants</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {contextJob?.title ?? 'Job applicants'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {contextJob?.company?.name ?? (isJobLoading ? 'Loading company...' : 'Company unavailable')}
          </p>
        </div>

        {jobError && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="flex flex-col gap-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
              <p role="alert">Job details: {jobError}</p>
              <Button variant="outline" size="sm" onClick={() => void loadJob()}>Retry</Button>
            </CardContent>
          </Card>
        )}

        {isApplicationsLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-500">Loading applicants...</div>
        ) : applicationsError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-start gap-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
              <p role="alert">{applicationsError}</p>
              <Button variant="outline" size="sm" onClick={() => void loadApplications()}>Retry</Button>
            </CardContent>
          </Card>
        ) : applications.length === 0 ? (
          <Card className="border-dashed text-center">
            <CardContent>
              <h2 className="text-lg font-semibold text-slate-900">No applicants yet</h2>
              <p className="mt-2 text-sm text-slate-500">No candidates have applied to this job yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const availableStatuses = [application.status, ...STATUS_TRANSITIONS[application.status]];
              const isUpdating = updatingId === application.id;
              const canUpdate = STATUS_TRANSITIONS[application.status].length > 0;

              return (
                <Card key={application.id}>
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="break-all text-base">{application.candidate.email}</CardTitle>
                      <p className="mt-1 break-all text-xs text-slate-500">Candidate ID: {application.candidate.id}</p>
                    </div>
                    <Badge variant={statusVariant(application.status)}>{formatStatus(application.status)}</Badge>
                  </CardHeader>
                  <CardContent className="grid gap-5 text-sm sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="grid gap-2 text-slate-600">
                      <p><span className="font-medium text-slate-900">Applied:</span> {new Date(application.createdAt).toLocaleDateString()}</p>
                      <p className="break-all"><span className="font-medium text-slate-900">Application ID:</span> {application.id}</p>
                    </div>
                    <div className="w-full sm:min-w-48 sm:max-w-56">
                      <label htmlFor={`status-${application.id}`} className="mb-1.5 block text-xs font-medium text-slate-700">
                        Update status
                      </label>
                      <select
                        id={`status-${application.id}`}
                        value={application.status}
                        onChange={(event) => void handleStatusChange(application, event.target.value)}
                        disabled={isUpdating || !canUpdate}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        {availableStatuses.map((status) => (
                          <option key={status} value={status}>{formatStatus(status)}</option>
                        ))}
                      </select>
                      {isUpdating && <p className="mt-1.5 text-xs text-slate-500">Updating...</p>}
                      {statusErrors[application.id] && <p className="mt-1.5 text-xs text-red-700" role="alert">{statusErrors[application.id]}</p>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';
import { applicationsService } from '@/services/applications';
import { Application, ApplicationStatus } from '@/types';

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'REJECTED',
  'HIRED',
];

function statusVariant(status: ApplicationStatus) {
  if (status === 'REJECTED') return 'danger' as const;
  if (status === 'HIRED') return 'success' as const;
  if (status === 'INTERVIEW') return 'warning' as const;
  return 'info' as const;
}

function formatStatus(status: ApplicationStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && typeof error.data === 'object' && error.data !== null) {
    const message = (error.data as { error?: string }).error;
    if (message) return message;
  }

  return error instanceof Error ? error.message : 'Unable to load recruiter applications.';
}

export default function RecruiterDashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [dataKey, setDataKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const isMounted = useRef(true);
  const requestGeneration = useRef(0);
  const previousRecruiterKey = useRef<string | null>(null);
  const requestInFlight = useRef<{
    key: string;
    generation: number;
    promise: Promise<void>;
  } | null>(null);
  const recruiterKey = user?.role === 'RECRUITER' ? `${user.id}:${user.role}` : null;

  const loadApplications = useCallback((key: string, generation: number) => {
    const existingRequest = requestInFlight.current;
    if (existingRequest?.key === key && existingRequest.generation === generation) {
      return existingRequest.promise;
    }

    const request = (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await applicationsService.getMyJobApplications();
        if (isMounted.current && requestGeneration.current === generation) {
          setApplications(data);
          setDataKey(key);
        }
      } catch (requestError) {
        if (isMounted.current && requestGeneration.current === generation) {
          setError(getErrorMessage(requestError));
          setErrorKey(key);
        }
      } finally {
        if (isMounted.current && requestGeneration.current === generation) {
          setIsLoading(false);
        }
      }
    })();

    const requestEntry = { key, generation, promise: request };
    requestInFlight.current = requestEntry;
    void request.finally(() => {
      if (requestInFlight.current === requestEntry) requestInFlight.current = null;
    });
    return request;
  }, []);

  useEffect(() => {
    isMounted.current = true;
    if (previousRecruiterKey.current !== recruiterKey) {
      previousRecruiterKey.current = recruiterKey;
      requestGeneration.current += 1;
    }

    const generation = requestGeneration.current;
    if (!recruiterKey) {
      return () => {
        isMounted.current = false;
      };
    }

    queueMicrotask(() => {
      if (requestGeneration.current === generation) {
        void loadApplications(recruiterKey, generation);
      }
    });

    return () => {
      isMounted.current = false;
    };
  }, [loadApplications, recruiterKey]);

  const retryApplications = () => {
    if (recruiterKey) void loadApplications(recruiterKey, requestGeneration.current);
  };

  const counts = APPLICATION_STATUSES.reduce<Record<ApplicationStatus, number>>(
    (result, status) => {
      result[status] = applications.filter((application) => application.status === status).length;
      return result;
    },
    { APPLIED: 0, SCREENING: 0, INTERVIEW: 0, REJECTED: 0, HIRED: 0 }
  );
  const unexpectedStatusCount = applications.length - Object.values(counts).reduce((total, count) => total + count, 0);
  const hasCurrentError = Boolean(error && errorKey === recruiterKey);
  const showLoading = isLoading || (recruiterKey !== null && !hasCurrentError && dataKey !== recruiterKey);

  return (
    <ProtectedRoute allowedRoles={['RECRUITER']}>
      <div className="mx-auto max-w-5xl py-2">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Recruiter workspace</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Recruiter Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review applications for your job postings and manage your recruiting workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/recruiter/jobs"><Button size="sm">Manage Jobs</Button></Link>
            <Link href="/recruiter/companies"><Button variant="outline" size="sm">Manage Companies</Button></Link>
          </div>
        </div>

        {showLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500">
            Loading your dashboard...
          </div>
        ) : hasCurrentError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="space-y-4 pt-1 text-center">
              <p className="text-sm text-red-700" role="alert">{error}</p>
              <Button variant="outline" size="sm" onClick={retryApplications}>Retry</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <section aria-label="Application summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <p className="text-sm font-medium text-slate-500">Total applications</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{applications.length}</p>
                <p className="mt-1 text-xs text-slate-500">For your job postings</p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-slate-500">In progress</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{counts.APPLIED + counts.SCREENING + counts.INTERVIEW}</p>
                <p className="mt-1 text-xs text-slate-500">Applied, screening, or interview</p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-slate-500">Interviews</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">{counts.INTERVIEW}</p>
                <p className="mt-1 text-xs text-slate-500">Current interview stage</p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-slate-500">Hired</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{counts.HIRED}</p>
                <p className="mt-1 text-xs text-slate-500">Successful applications</p>
              </Card>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Recent applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-600">No applications have been received for your job postings yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {applications.slice(0, 5).map((application) => (
                        <div key={application.id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">{application.job.title}</h3>
                            <p className="mt-1 text-sm text-slate-600">{application.job.company.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {application.candidate.email} | Applied {new Date(application.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={statusVariant(application.status)}>{formatStatus(application.status)}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Application status</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {APPLICATION_STATUSES.map((status) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <Badge variant={statusVariant(status)}>{formatStatus(status)}</Badge>
                      <span className="font-semibold text-slate-900">{counts[status]}</span>
                    </div>
                  ))}
                  {unexpectedStatusCount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Unrecognized status</span>
                      <span className="font-semibold text-slate-900">{unexpectedStatusCount}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

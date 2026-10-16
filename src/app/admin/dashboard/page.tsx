'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';
import { applicationsService } from '@/services/applications';
import { companiesService } from '@/services/companies';
import { jobsService } from '@/services/jobs';
import { Application, ApplicationStatus, Company, JobsResponse } from '@/types';

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'REJECTED',
  'HIRED',
];

function formatStatus(status: ApplicationStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function getStatusColor(status: ApplicationStatus) {
  if (status === 'REJECTED') return 'text-red-600';
  if (status === 'HIRED') return 'text-emerald-600';
  if (status === 'INTERVIEW') return 'text-amber-600';
  return 'text-blue-600';
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && typeof error.data === 'object' && error.data !== null) {
    const message = (error.data as { error?: string }).error;
    if (message) return message;
  }

  return error instanceof Error ? error.message : 'Unable to load the admin dashboard.';
}

interface DashboardData {
  jobs: JobsResponse;
  companies: Company[];
  applications: Application[];
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataKey, setDataKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const isMounted = useRef(true);
  const requestGeneration = useRef(0);
  const previousAdminKey = useRef<string | null>(null);
  const requestInFlight = useRef<{
    key: string;
    generation: number;
    promise: Promise<void>;
  } | null>(null);
  const adminKey = user?.role === 'ADMIN' ? `${user.id}:${user.role}` : null;

  const loadDashboard = useCallback((key: string, generation: number) => {
    const existingRequest = requestInFlight.current;
    if (existingRequest?.key === key && existingRequest.generation === generation) {
      return existingRequest.promise;
    }

    const request = (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [jobs, companies, applications] = await Promise.all([
          jobsService.getAll({ page: 1, limit: 1 }),
          companiesService.getAll(),
          applicationsService.getAll(),
        ]);

        if (isMounted.current && requestGeneration.current === generation) {
          setDashboardData({ jobs, companies, applications });
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
    void request.then(
      () => {
        if (requestInFlight.current === requestEntry) requestInFlight.current = null;
      },
      () => {
        if (requestInFlight.current === requestEntry) requestInFlight.current = null;
      }
    );
    return request;
  }, []);

  useEffect(() => {
    isMounted.current = true;
    if (previousAdminKey.current !== adminKey) {
      previousAdminKey.current = adminKey;
      requestGeneration.current += 1;
    }

    const generation = requestGeneration.current;
    if (!adminKey) {
      return () => {
        isMounted.current = false;
      };
    }

    queueMicrotask(() => {
      if (requestGeneration.current === generation) {
        void loadDashboard(adminKey, generation);
      }
    });

    return () => {
      isMounted.current = false;
    };
  }, [adminKey, loadDashboard]);

  const retryDashboard = () => {
    if (adminKey) void loadDashboard(adminKey, requestGeneration.current);
  };

  const applications = dashboardData?.applications ?? [];
  const counts = APPLICATION_STATUSES.reduce<Record<ApplicationStatus, number>>(
    (result, status) => {
      result[status] = applications.filter((application) => application.status === status).length;
      return result;
    },
    { APPLIED: 0, SCREENING: 0, INTERVIEW: 0, REJECTED: 0, HIRED: 0 }
  );
  const inProgressCount = counts.APPLIED + counts.SCREENING + counts.INTERVIEW;
  const hasCurrentError = Boolean(error && errorKey === adminKey);
  const showLoading = isLoading || (adminKey !== null && !hasCurrentError && dataKey !== adminKey);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="mx-auto max-w-5xl py-2">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Platform administration</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review platform-wide records and move quickly to management areas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/jobs"><Button size="sm">Manage Jobs</Button></Link>
            <Link href="/companies"><Button variant="outline" size="sm">Manage Companies</Button></Link>
          </div>
        </div>

        {showLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500">
            Loading platform overview...
          </div>
        ) : hasCurrentError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="space-y-4 pt-1 text-center">
              <p className="text-sm text-red-700" role="alert">{error}</p>
              <Button variant="outline" size="sm" onClick={retryDashboard}>Retry</Button>
            </CardContent>
          </Card>
        ) : dashboardData ? (
          <div className="space-y-6">
            <section aria-label="Platform overview" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <p className="text-sm font-medium text-slate-500">All job postings</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{dashboardData.jobs.pagination.total}</p>
                <p className="mt-1 text-xs text-slate-500">Platform total</p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-slate-500">All companies</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{dashboardData.companies.length}</p>
                <p className="mt-1 text-xs text-slate-500">Platform total</p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-slate-500">All applications</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{applications.length}</p>
                <p className="mt-1 text-xs text-slate-500">Platform total</p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-blue-600">In progress</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{inProgressCount}</p>
                <p className="mt-1 text-xs text-slate-500">Applied, screening, or interview</p>
              </Card>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Card>
                <CardHeader><CardTitle>Application status</CardTitle></CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-600">No applications are available yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {APPLICATION_STATUSES.map((status) => (
                        <div key={status} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{formatStatus(status)}</span>
                          <span className={`font-semibold ${getStatusColor(status)}`}>{counts[status]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Management areas</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/jobs" className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600">
                    Jobs <span aria-hidden="true">-&gt;</span>
                  </Link>
                  <Link href="/companies" className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600">
                    Companies <span aria-hidden="true">-&gt;</span>
                  </Link>
                  <p className="pt-1 text-xs text-slate-500">Application management is not available as a frontend route yet.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}

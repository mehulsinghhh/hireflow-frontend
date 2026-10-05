'use client';

import React, { useEffect, useState } from 'react';
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

const statusVariant = (status: ApplicationStatus) => {
  if (status === 'REJECTED') return 'danger' as const;
  if (status === 'HIRED') return 'success' as const;
  if (status === 'INTERVIEW') return 'warning' as const;
  return 'info' as const;
};

const formatStatus = (status: ApplicationStatus) =>
  status.charAt(0) + status.slice(1).toLowerCase();

export default function CandidateDashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'CANDIDATE') return;

    let isMounted = true;

    applicationsService
      .getMyApplications()
      .then((data) => {
        if (isMounted) {
          setApplications(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof ApiError || err instanceof Error
              ? err.message
              : 'Failed to load your applications.'
          );
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const counts = APPLICATION_STATUSES.reduce<Record<ApplicationStatus, number>>(
    (result, status) => {
      result[status] = applications.filter((application) => application.status === status).length;
      return result;
    },
    {
      APPLIED: 0,
      SCREENING: 0,
      INTERVIEW: 0,
      REJECTED: 0,
      HIRED: 0,
    }
  );

  return (
    <ProtectedRoute allowedRoles={['CANDIDATE']}>
      <div className="max-w-5xl mx-auto py-2">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Candidate Dashboard</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Welcome, {user?.name || user?.email}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Keep track of your job applications and their latest status.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/jobs">
              <Button size="sm">Browse Jobs</Button>
            </Link>
            <Link href="/candidate/applications">
              <Button variant="outline" size="sm">My Applications</Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500">
            Loading your dashboard...
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-1 text-sm text-red-700">{error}</CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <section aria-label="Application summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <p className="text-sm font-medium text-slate-500">Total applications</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{applications.length}</p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-slate-500">In progress</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {counts.APPLIED + counts.SCREENING + counts.INTERVIEW}
                </p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-slate-500">Interviews</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">{counts.INTERVIEW}</p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-slate-500">Hired</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{counts.HIRED}</p>
              </Card>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Recent applications</CardTitle>
                  {applications.length > 0 && (
                    <Link href="/candidate/applications" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      View all
                    </Link>
                  )}
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-sm text-slate-600">You have not applied to any jobs yet.</p>
                      <Link href="/jobs" className="mt-4 inline-block">
                        <Button size="sm">Browse Jobs</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {applications.slice(0, 5).map((application) => (
                        <div key={application.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">{application.job.title}</h3>
                            <p className="mt-1 text-sm text-slate-600">{application.job.company.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Applied {new Date(application.createdAt).toLocaleDateString()}
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
                <CardHeader>
                  <CardTitle>Application status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {APPLICATION_STATUSES.map((status) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant(status)}>{formatStatus(status)}</Badge>
                      </div>
                      <span className="font-semibold text-slate-900">{counts[status]}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

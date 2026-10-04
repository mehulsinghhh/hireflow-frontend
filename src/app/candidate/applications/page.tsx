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
import { Application } from '@/types';

export default function CandidateApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'CANDIDATE') {
      return;
    }

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

  return (
    <ProtectedRoute allowedRoles={['CANDIDATE']}>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track the status of applications you have submitted.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[30vh] text-sm text-slate-500">
            Loading applications...
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-1 text-sm text-red-700">{error}</CardContent>
          </Card>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="pt-1 text-center">
              <p className="text-sm text-slate-600">You have not applied to any jobs yet.</p>
              <Link href="/jobs" className="inline-block mt-4">
                <Button variant="primary" size="sm">Browse Jobs</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id}>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{application.job.title}</CardTitle>
                    <p className="mt-1 text-sm font-medium text-blue-600">
                      {application.job.company.name}
                    </p>
                  </div>
                  <Badge variant={application.status === 'REJECTED' ? 'danger' : application.status === 'HIRED' ? 'success' : 'info'}>
                    {application.status}
                  </Badge>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p><span className="font-medium text-slate-900">Location:</span> {application.job.location}</p>
                  <p><span className="font-medium text-slate-900">Applied:</span> {new Date(application.createdAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

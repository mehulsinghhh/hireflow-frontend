'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { jobsService } from '@/services/jobs';
import { Job, JobsResponse } from '@/types';
import { ApiError } from '@/lib/api';

export default function RecruiterJobsPage() {
  const [jobsData, setJobsData] = useState<JobsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setJobsData(await jobsService.getAll());
    } catch (err) {
      const message = err instanceof ApiError && typeof err.data === 'object' && err.data !== null
        ? (err.data as { error?: string }).error
        : undefined;
      setError(message || (err instanceof Error ? err.message : 'Unable to load jobs.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadJobs());
  }, [loadJobs]);

  const jobs: Job[] = jobsData?.jobs ?? [];

  return (
    <ProtectedRoute allowedRoles={['RECRUITER']}>
      <div className="max-w-5xl mx-auto py-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Job Postings</h1>
            <p className="text-slate-600 mt-1 text-sm">View available job postings and manage the ones you own.</p>
          </div>
          <Link href="/recruiter/jobs/new"><Button>Create Job</Button></Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-500">Loading jobs...</div>
        ) : error ? (
          <Card className="text-center border-red-200 bg-red-50"><CardContent className="space-y-4"><p className="text-sm text-red-700" role="alert">{error}</p><Button variant="outline" size="sm" onClick={() => void loadJobs()}>Retry</Button></CardContent></Card>
        ) : jobs.length === 0 ? (
          <Card className="text-center border-dashed"><CardContent className="space-y-3"><h2 className="text-lg font-semibold text-slate-900">No jobs yet</h2><p className="text-sm text-slate-500">Create your first job posting to get started.</p><Link href="/recruiter/jobs/new"><Button size="sm">Create Job</Button></Link></CardContent></Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="divide-y divide-slate-200">
              {jobs.map((job) => (
                <div key={job.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <Link href={`/recruiter/jobs/${job.id}`} className="text-lg font-semibold text-slate-900 hover:text-blue-600">{job.title}</Link>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{job.company?.name ?? 'Company unavailable'}</span>
                      <span>{job.location}</span>
                      {job.createdAt && <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <Link href={`/recruiter/jobs/${job.id}`} className="shrink-0"><Button variant="outline" size="sm">View Job</Button></Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

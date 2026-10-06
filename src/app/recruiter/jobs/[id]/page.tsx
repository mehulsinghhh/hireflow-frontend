'use client';

import React, { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { JobForm } from '@/components/recruiter/job-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError } from '@/lib/api';
import { jobsService } from '@/services/jobs';
import { Job } from '@/types';

export default function RecruiterJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setJob(await jobsService.getById(id));
    } catch (err) {
      const message = err instanceof ApiError && typeof err.data === 'object' && err.data !== null
        ? (err.data as { error?: string }).error
        : undefined;
      setError(message || (err instanceof Error ? err.message : 'Unable to load this job.'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => void loadJob());
  }, [loadJob]);

  const handleDelete = async () => {
    if (!job || isDeleting || !window.confirm(`Delete “${job.title}”? This cannot be undone.`)) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await jobsService.delete(job.id);
      router.push('/recruiter/jobs');
    } catch (err) {
      const message = err instanceof ApiError && typeof err.data === 'object' && err.data !== null
        ? (err.data as { error?: string }).error
        : undefined;
      setDeleteError(message || (err instanceof Error ? err.message : 'Unable to delete this job.'));
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['RECRUITER']}>
      <div className="max-w-5xl mx-auto py-6">
        <Link href="/recruiter/jobs" className="text-sm font-medium text-slate-500 hover:text-slate-900">&larr; Back to Jobs</Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-500">Loading job details...</div>
        ) : error || !job ? (
          <Card className="mt-6 text-center border-red-200 bg-red-50"><CardContent className="space-y-4"><p className="text-sm text-red-700" role="alert">{error || 'Job not found.'}</p><Button variant="outline" size="sm" onClick={() => void loadJob()}>Retry</Button></CardContent></Card>
        ) : isEditing ? (
          <div className="mt-6">
            <JobForm
              mode="edit"
              job={job}
              companies={[]}
              onSuccess={(updatedJob) => { setJob(updatedJob); setIsEditing(false); }}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                <p className="text-sm font-medium text-blue-600 mt-1">{job.company?.name ?? 'Company unavailable'}</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                  <span>{job.location}</span>
                  {job.createdAt && <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>}
                  {job.updatedAt && <span>Updated {new Date(job.updatedAt).toLocaleDateString()}</span>}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 mb-2">Description</h2>
                  <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader><CardTitle className="text-base">Manage posting</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => setIsEditing(true)}>Edit Job</Button>
                <Link href={`/recruiter/jobs/${job.id}/applicants`} className="block"><Button variant="outline" className="w-full">View Applicants</Button></Link>
                <Button variant="danger" className="w-full" onClick={() => void handleDelete()} disabled={isDeleting} isLoading={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete Job'}</Button>
                {deleteError && <p className="text-xs text-red-700" role="alert">{deleteError}</p>}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

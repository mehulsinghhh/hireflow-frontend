'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { JobForm } from '@/components/recruiter/job-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ApiError } from '@/lib/api';
import { companiesService } from '@/services/companies';
import { jobsService } from '@/services/jobs';
import { Company, Job, JobsResponse } from '@/types';

type ActionFeedback = {
  message: string;
  type: 'success' | 'error';
};

type JobsLoadResult = 'success' | 'error' | 'stale';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && typeof error.data === 'object' && error.data !== null) {
    const message = (error.data as { error?: string }).error;
    if (message) return message;
  }

  return error instanceof Error ? error.message : fallback;
}

export default function AdminJobsPage() {
  const [jobsData, setJobsData] = useState<JobsResponse | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const latestJobsRequest = useRef(0);
  const jobsMutationVersion = useRef(0);

  const loadJobs = useCallback(async (requestedPage: number): Promise<JobsLoadResult> => {
    const requestId = ++latestJobsRequest.current;
    const mutationVersion = jobsMutationVersion.current;
    setIsLoadingJobs(true);
    setJobsError(null);

    try {
      const response = await jobsService.getAll({ page: requestedPage, limit: 10 });

      if (requestId !== latestJobsRequest.current || mutationVersion !== jobsMutationVersion.current) {
        return 'stale';
      }

      setJobsData(response);
      setPage(response.pagination.page);
      return 'success';
    } catch (error) {
      if (requestId !== latestJobsRequest.current || mutationVersion !== jobsMutationVersion.current) {
        return 'stale';
      }

      setJobsError(getErrorMessage(error, 'Unable to load jobs.'));
      return 'error';
    } finally {
      if (requestId === latestJobsRequest.current) {
        setIsLoadingJobs(false);
      }
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    setIsLoadingCompanies(true);
    setCompaniesError(null);

    try {
      setCompanies(await companiesService.getAll());
    } catch (error) {
      setCompaniesError(getErrorMessage(error, 'Unable to load companies.'));
    } finally {
      setIsLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadJobs(1);
      void loadCompanies();
    });
  }, [loadCompanies, loadJobs]);

  const handlePageChange = (nextPage: number) => {
    setActionFeedback(null);
    void loadJobs(nextPage);
  };

  const handleDelete = async (job: Job) => {
    if (isDeleting || !window.confirm(`Delete “${job.title}”? This cannot be undone.`)) return;

    setIsDeleting(job.id);
    setActionFeedback(null);

    try {
      await jobsService.delete(job.id);
      jobsMutationVersion.current += 1;
      setJobsData((current) => current ? {
        ...current,
        jobs: current.jobs.filter((currentJob) => currentJob.id !== job.id),
        pagination: {
          ...current.pagination,
          total: Math.max(0, current.pagination.total - 1),
          totalPages: Math.ceil(Math.max(0, current.pagination.total - 1) / current.pagination.limit),
        },
      } : current);

      const currentJobs = jobsData?.jobs ?? [];
      const nextPage = currentJobs.length === 1 && page > 1 ? page - 1 : page;
      const refreshResult = await loadJobs(nextPage);
      setActionFeedback(refreshResult === 'success'
        ? { message: 'Job deleted successfully.', type: 'success' }
        : { message: 'Job deleted successfully, but the list could not refresh. Retry to load the latest jobs.', type: 'error' });
    } catch (error) {
      setActionFeedback({ message: getErrorMessage(error, 'Unable to delete this job.'), type: 'error' });
    } finally {
      setIsDeleting(null);
    }
  };

  const jobs = jobsData?.jobs ?? [];
  const pagination = jobsData?.pagination;
  const showList = !isCreating && !editingJob;

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="max-w-6xl mx-auto py-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manage Jobs</h1>
            <p className="mt-1 text-sm text-slate-600">Review and manage every job posting on HireFlow.</p>
          </div>
          {showList && <Button onClick={() => { setActionFeedback(null); setIsCreating(true); }}>Create Job</Button>}
        </div>

        {actionFeedback && (
          <p
            className={`mb-5 rounded-md border px-4 py-3 text-sm ${actionFeedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700'}`}
            role={actionFeedback.type === 'error' ? 'alert' : 'status'}
          >
            {actionFeedback.message}
          </p>
        )}

        {isCreating && (
          <div>
            <div className="mb-4">
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>Back to jobs</Button>
            </div>
            <JobForm
              mode="create"
              companies={companies}
              isLoadingCompanies={isLoadingCompanies}
              companyError={companiesError}
              onRetryCompanies={() => void loadCompanies()}
              onSuccess={async (createdJob) => {
                jobsMutationVersion.current += 1;
                setIsCreating(false);
                setJobsData((current) => {
                  if (!current || current.pagination.page !== 1) return current;

                  const total = current.pagination.total + 1;
                  return {
                    ...current,
                    jobs: [createdJob, ...current.jobs].slice(0, current.pagination.limit),
                    pagination: {
                      ...current.pagination,
                      total,
                      totalPages: Math.ceil(total / current.pagination.limit),
                    },
                  };
                });
                const refreshResult = await loadJobs(1);
                setActionFeedback(refreshResult === 'success'
                  ? { message: 'Job created successfully.', type: 'success' }
                  : { message: 'Job created successfully, but the list could not refresh. Retry to load the latest jobs.', type: 'error' });
              }}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        )}

        {editingJob && (
          <div>
            <div className="mb-4">
              <Button variant="ghost" size="sm" onClick={() => setEditingJob(null)}>Back to jobs</Button>
            </div>
            <JobForm
              mode="edit"
              job={editingJob}
              companies={[]}
              onSuccess={async (updatedJob) => {
                jobsMutationVersion.current += 1;
                setEditingJob(null);
                setJobsData((current) => current ? {
                  ...current,
                  jobs: current.jobs.map((job) => job.id === updatedJob.id ? updatedJob : job),
                } : current);
                const refreshResult = await loadJobs(page);
                setActionFeedback(refreshResult === 'success'
                  ? { message: 'Job updated successfully.', type: 'success' }
                  : { message: 'Job updated successfully, but the list could not refresh. Retry to load the latest jobs.', type: 'error' });
              }}
              onCancel={() => setEditingJob(null)}
            />
          </div>
        )}

        {showList && (
          isLoadingJobs ? (
            <div className="flex items-center justify-center py-20 text-sm text-slate-500">Loading jobs...</div>
          ) : jobsError ? (
            <Card className="border-red-200 bg-red-50 text-center">
              <CardContent className="space-y-4">
                <p className="text-sm text-red-700" role="alert">{jobsError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActionFeedback(null);
                    void loadJobs(page);
                  }}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card className="border-dashed text-center">
              <CardContent className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">No jobs yet</h2>
                <p className="text-sm text-slate-500">Create the first job posting for the platform.</p>
                <Button size="sm" onClick={() => setIsCreating(true)}>Create Job</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="divide-y divide-slate-200">
                  {jobs.map((job) => (
                    <div key={job.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-1">
                        <h2 className="text-lg font-semibold text-slate-900">{job.title}</h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                          <span>{job.company?.name ?? 'Company unavailable'}</span>
                          <span>{job.location}</span>
                          {job.createdAt && <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setActionFeedback(null); setEditingJob(job); }}>Edit</Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => void handleDelete(job)}
                          disabled={isDeleting !== null}
                          isLoading={isDeleting === job.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={pagination.page <= 1 || isLoadingJobs} onClick={() => handlePageChange(pagination.page - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages || isLoadingJobs} onClick={() => handlePageChange(pagination.page + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>
    </ProtectedRoute>
  );
}

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

type SortOption = 'newest' | 'oldest' | 'candidate' | 'job';

function formatStatus(status: ApplicationStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function statusVariant(status: ApplicationStatus) {
  if (status === 'REJECTED') return 'danger' as const;
  if (status === 'HIRED') return 'success' as const;
  if (status === 'INTERVIEW') return 'warning' as const;
  return 'info' as const;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && typeof error.data === 'object' && error.data !== null) {
    const message = (error.data as { error?: string }).error;
    if (message) return message;
  }

  return error instanceof Error ? error.message : 'Unable to load applicants.';
}

export default function ApplicantsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [jobFilter, setJobFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [sort, setSort] = useState<SortOption>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setApplications(await applicationsService.getMyJobApplications());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      await loadApplications();
    };

    void fetchApplications();
  }, [loadApplications]);

  const jobs = [...new Map(applications.map((application) => [application.job.id, application.job])).values()]
    .sort((first, second) => first.title.localeCompare(second.title));
  const companies = [...new Map(applications.map((application) => [application.job.company.id, application.job.company])).values()]
    .sort((first, second) => first.name.localeCompare(second.name));
  const searchTerm = search.trim().toLowerCase();

  const visibleApplications = applications
    .filter((application) => {
      const matchesSearch = !searchTerm || [
        application.candidate.email,
        application.job.title,
        application.job.company.name,
      ].some((value) => value.toLowerCase().includes(searchTerm));
      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      const matchesJob = jobFilter === 'ALL' || application.job.id === jobFilter;
      const matchesCompany = companyFilter === 'ALL' || application.job.company.id === companyFilter;

      return matchesSearch && matchesStatus && matchesJob && matchesCompany;
    })
    .sort((first, second) => {
      if (sort === 'candidate') return first.candidate.email.localeCompare(second.candidate.email);
      if (sort === 'job') return first.job.title.localeCompare(second.job.title);

      const firstDate = new Date(first.createdAt).getTime();
      const secondDate = new Date(second.createdAt).getTime();
      return sort === 'newest' ? secondDate - firstDate : firstDate - secondDate;
    });

  const counts = applications.reduce<Record<ApplicationStatus, number>>(
    (result, application) => {
      result[application.status] += 1;
      return result;
    },
    { APPLIED: 0, SCREENING: 0, INTERVIEW: 0, REJECTED: 0, HIRED: 0 },
  );

  const hasFilters = Boolean(search || statusFilter !== 'ALL' || jobFilter !== 'ALL' || companyFilter !== 'ALL');
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setJobFilter('ALL');
    setCompanyFilter('ALL');
    setSort('newest');
  };

  return (
    <ProtectedRoute allowedRoles={['RECRUITER']}>
      <div className="mx-auto max-w-6xl py-2">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Recruiter workspace</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Applicants</h1>
            <p className="mt-2 text-sm text-slate-600">Review candidates across all of your job postings.</p>
          </div>
          <Link href="/recruiter/jobs">
            <Button variant="outline">View job postings</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500">Loading applicants...</div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-red-700" role="alert">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void loadApplications()}>Retry</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <section aria-label="Application summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card>
                <p className="text-sm font-medium text-slate-500">Total applications</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{applications.length}</p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-slate-500">Applied</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{counts.APPLIED}</p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-slate-500">In progress</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{counts.SCREENING}</p>
                <p className="mt-1 text-xs text-slate-500">Screening</p>
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

            <Card>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
                <Input
                  label="Search applicants"
                  placeholder="Candidate, job, or company"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  Status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as ApplicationStatus | 'ALL')}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All statuses</option>
                    {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  Job
                  <select
                    value={jobFilter}
                    onChange={(event) => setJobFilter(event.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All jobs</option>
                    {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  Company
                  <select
                    value={companyFilter}
                    onChange={(event) => setCompanyFilter(event.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All companies</option>
                    {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  Sort by
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortOption)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest applied</option>
                    <option value="oldest">Oldest applied</option>
                    <option value="candidate">Candidate email</option>
                    <option value="job">Job title</option>
                  </select>
                </label>
                {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>}
              </div>
            </Card>

            {applications.length === 0 ? (
              <Card className="border-dashed text-center">
                <CardContent>
                  <h2 className="text-lg font-semibold text-slate-900">No applications yet</h2>
                  <p className="mt-2 text-sm text-slate-500">Applications for your job postings will appear here.</p>
                </CardContent>
              </Card>
            ) : visibleApplications.length === 0 ? (
              <Card className="border-dashed text-center">
                <CardContent>
                  <h2 className="text-lg font-semibold text-slate-900">No matching applicants</h2>
                  <p className="mt-2 text-sm text-slate-500">Try changing your search or filters.</p>
                  <Button className="mt-4" variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {visibleApplications.map((application) => (
                  <Card key={application.id}>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="break-all text-lg font-semibold text-slate-900">{application.candidate.email}</h2>
                          <Badge variant={statusVariant(application.status)}>{formatStatus(application.status)}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                          <span>{application.job.title}</span>
                          <span>{application.job.company.name}</span>
                          <span>{application.job.location}</span>
                        </div>
                        <p className="text-sm text-slate-500">Applied {formatDate(application.createdAt)}</p>
                      </div>
                      <Link href={`/recruiter/jobs/${application.job.id}`} className="shrink-0">
                        <Button variant="outline" size="sm">View job</Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { jobsService } from '@/services/jobs';
import { Job } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuthenticated, user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    jobsService
      .getById(id)
      .then((data) => {
        if (isMounted) {
          setJob(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (err instanceof ApiError && err.status === 404) {
            setIsNotFound(true);
          } else {
            setError(
              err instanceof Error
                ? err.message
                : 'Failed to load job details. Please try again.'
            );
          }
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 flex flex-col items-center justify-center text-slate-500 min-h-[50vh]">
        <svg
          className="animate-spin h-8 w-8 text-blue-600 mb-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-sm">Loading job details...</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Card className="text-center p-8 border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Job Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 text-sm">
              The job position you are looking for does not exist or may have been removed.
            </p>
            <Link href="/jobs">
              <Button variant="primary" size="sm">
                Back to All Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Card className="p-6 text-center border-red-200 bg-red-50">
          <CardContent className="pt-4 space-y-4">
            <p className="text-red-700 text-sm font-medium">
              {error || 'Failed to load job details.'}
            </p>
            <Link href="/jobs">
              <Button variant="outline" size="sm">
                Return to Job Directory
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Jobs
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      {job.title}
                    </h1>
                    {job.company?.name && (
                      <p className="text-base font-semibold text-blue-600 mt-1">
                        {job.company.name}
                      </p>
                    )}
                  </div>
                  {job.type && <Badge variant="info">{job.type}</Badge>}
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 border-y border-slate-100 py-3 flex-wrap">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {job.location}
                    </span>
                  )}

                  {job.salary && (
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <svg
                        className="w-4 h-4 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {job.salary}
                    </span>
                  )}

                  {job.createdAt && (
                    <span className="text-slate-400">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Job Description
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>
                </div>

                {job.requirements && (
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Requirements & Qualifications
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {job.requirements}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Apply for this position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-normal">
                    You must be signed in as a candidate to submit an application for this position.
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    <Link href="/login" className="w-full">
                      <Button variant="primary" size="md" className="w-full">
                        Sign In to Apply
                      </Button>
                    </Link>
                    <Link href="/register" className="w-full">
                      <Button variant="outline" size="md" className="w-full">
                        Create an Account
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : user?.role === 'CANDIDATE' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Application submission flow is coming soon.
                  </p>
                  <Button variant="primary" size="md" className="w-full" disabled>
                    Apply Now (Coming Soon)
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Signed in as <span className="font-semibold">{user?.role}</span>. Switch to a Candidate account to submit applications.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { jobsService } from '@/services/jobs';
import { JobsResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function JobsPage() {
  const [jobsData, setJobsData] = useState<JobsResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<{
    key: string;
    promise: Promise<JobsResponse>;
  } | null>(null);

  useEffect(() => {
    const requestKey = `${currentPage}:${retryCount}`;
    const existingRequest = requestRef.current;
    const request =
      existingRequest?.key === requestKey
        ? existingRequest.promise
        : jobsService.getAll({ page: currentPage, limit: 10 });

    requestRef.current = { key: requestKey, promise: request };
    let isCurrent = true;
    let shouldRefetch = false;

    request
      .then((data) => {
        if (!isCurrent || requestRef.current?.promise !== request) {
          return;
        }

        const totalPages = data.pagination.totalPages;
        const effectivePage =
          totalPages > 0 ? Math.min(Math.max(data.pagination.page, 1), totalPages) : 1;
        if (effectivePage !== currentPage) {
          shouldRefetch = true;
          setIsLoading(true);
          setError(null);
          setCurrentPage(effectivePage);
          return;
        }
        setJobsData(data);
      })
      .catch((err) => {
        if (isCurrent && requestRef.current?.promise === request) {
          setError(err instanceof Error ? err.message : 'Failed to load jobs. Please try again.');
        }
      })
      .finally(() => {
        if (isCurrent && !shouldRefetch && requestRef.current?.promise === request) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [currentPage, retryCount]);

  const jobs = jobsData?.jobs || [];
  const totalPages = jobsData?.pagination.totalPages || 0;
  const totalJobs = jobsData?.pagination.total || 0;
  const activePage = jobsData?.pagination.page || currentPage;
  const pageLimit = jobsData?.pagination.limit || 10;
  const firstJob = totalJobs === 0 ? 0 : (activePage - 1) * pageLimit + 1;
  const lastJob = Math.min(activePage * pageLimit, totalJobs);
  const changePage = (page: number) => {
    setError(null);
    setIsLoading(true);
    setCurrentPage(page);
  };
  const retry = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount((count) => count + 1);
  };
  const pageNumbers: (number | 'ellipsis')[] =
    totalPages <= 7
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : activePage <= 4
        ? [1, 2, 3, 4, 5, 'ellipsis', totalPages]
        : activePage >= totalPages - 3
          ? [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
          : [1, 'ellipsis', activePage - 1, activePage, activePage + 1, 'ellipsis', totalPages];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Explore Opportunities
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Browse active job openings on the HireFlow platform.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
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
          <p className="text-sm">Loading available job listings...</p>
        </div>
      ) : error ? (
        <Card className="p-6 text-center border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-700 text-sm font-medium mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={retry}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : jobs.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <CardContent>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              No Jobs Available
            </h3>
            <p className="text-slate-500 text-sm">
              There are currently no active job postings. Please check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="hover:border-slate-300 transition-colors cursor-pointer group"
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors"
                      >
                        {job.title}
                      </Link>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 flex-wrap">
                      {job.company?.name && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          {job.company.name}
                        </span>
                      )}

                      {job.location && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
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

                      {job.createdAt && (
                        <span className="text-slate-400">
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-2 mt-2">
                      {job.description}
                    </p>
                  </div>

                  <div className="sm:self-center">
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !error && totalPages > 0 && (
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {firstJob}–{lastJob} of {totalJobs} jobs
          </p>
          {totalPages > 1 && (
            <nav className="flex items-center gap-1" aria-label="Jobs pagination">
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading || activePage === 1}
                onClick={() => changePage(Math.max(1, activePage - 1))}
              >
                Previous
              </Button>
              {pageNumbers.map((page, index) =>
                page === 'ellipsis' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-sm text-slate-500">
                    …
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={page === activePage ? 'primary' : 'ghost'}
                    size="sm"
                    aria-current={page === activePage ? 'page' : undefined}
                    disabled={isLoading}
                    onClick={() => changePage(page)}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading || activePage === totalPages}
                onClick={() => changePage(Math.min(totalPages, activePage + 1))}
              >
                Next
              </Button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}

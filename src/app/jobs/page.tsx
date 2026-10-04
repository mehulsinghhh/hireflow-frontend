'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { jobsService } from '@/services/jobs';
import { JobsResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function JobsPage() {
  const [jobsData, setJobsData] = useState<JobsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await jobsService.getAll();
      setJobsData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load jobs. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    jobsService
      .getAll()
      .then((data) => {
        if (isMounted) {
          setJobsData(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load jobs. Please try again.'
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const jobs = jobsData?.jobs || [];

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
            <Button variant="outline" size="sm" onClick={fetchJobs}>
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
    </div>
  );
}

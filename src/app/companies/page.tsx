'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { companiesService } from '@/services/companies';
import { Company } from '@/types';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setCompanies(await companiesService.getAll());
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Failed to load companies. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    companiesService.getAll().then((data) => {
      if (isMounted) {
        setCompanies(data);
      }
    }).catch((err) => {
      if (isMounted) {
        setError(
          err instanceof ApiError || err instanceof Error
            ? err.message
            : 'Failed to load companies. Please try again.'
        );
      }
    }).finally(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Explore Companies
        </h1>
        <p className="text-slate-600 mt-1 text-sm">
          Discover the companies hiring through HireFlow.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm">Loading companies...</p>
        </div>
      ) : error ? (
        <Card className="p-6 text-center border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-700 text-sm font-medium mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchCompanies()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : companies.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <CardContent>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">No Companies Available</h2>
            <p className="text-slate-500 text-sm">There are currently no companies to display.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {companies.map((company) => (
            <Card key={company.id} className="hover:border-slate-300 transition-colors group">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Link
                    href={`/companies/${company.id}`}
                    className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors"
                  >
                    {company.name}
                  </Link>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {company.description || 'No company description available.'}
                  </p>
                  <Link href={`/companies/${company.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

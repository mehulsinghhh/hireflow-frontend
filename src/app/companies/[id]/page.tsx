'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { companiesService } from '@/services/companies';
import { Company } from '@/types';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    companiesService.getById(id).then((data) => {
      if (isMounted) {
        setCompany(data);
        setIsLoading(false);
      }
    }).catch((err) => {
      if (isMounted) {
        if (err instanceof ApiError && err.status === 404) {
          setIsNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load company details. Please try again.');
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
        <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm">Loading company details...</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Card className="text-center p-8">
          <CardHeader><CardTitle>Company Not Found</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 text-sm">The company you are looking for does not exist or may have been removed.</p>
            <Link href="/companies"><Button variant="primary" size="sm">Back to Companies</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Card className="p-6 text-center border-red-200 bg-red-50">
          <CardContent className="pt-4 space-y-4">
            <p className="text-red-700 text-sm font-medium">{error || 'Failed to load company details.'}</p>
            <Link href="/companies"><Button variant="outline" size="sm">Return to Companies</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        <Link href="/companies" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <span aria-hidden="true">←</span> Back to Companies
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{company.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">About the Company</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {company.description || 'No company description available.'}
            </p>
          </div>
          <div className="border-t border-slate-100 pt-4 text-xs text-slate-500 space-y-1">
            <p>Added {new Date(company.createdAt).toLocaleDateString()}</p>
            <p>Last updated {new Date(company.updatedAt).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

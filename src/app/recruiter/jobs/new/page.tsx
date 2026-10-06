'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { JobForm } from '@/components/recruiter/job-form';
import { companiesService } from '@/services/companies';
import { Company, Job } from '@/types';

export default function NewRecruiterJobPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCompanies(await companiesService.getAll());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load companies.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadCompanies());
  }, [loadCompanies]);

  return (
    <ProtectedRoute allowedRoles={['RECRUITER']}>
      <div className="py-6">
        <div className="max-w-3xl mx-auto mb-6">
          <Link href="/recruiter/jobs" className="text-sm font-medium text-slate-500 hover:text-slate-900">&larr; Back to Jobs</Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-4">Create Job</h1>
          <p className="text-sm text-slate-600 mt-1">Add a clear, accurate posting for candidates.</p>
        </div>
        <JobForm
          mode="create"
          companies={companies}
          isLoadingCompanies={isLoading}
          companyError={error}
          onRetryCompanies={() => void loadCompanies()}
          onSuccess={(job: Job) => router.push(`/recruiter/jobs/${job.id}`)}
          onCancel={() => router.push('/recruiter/jobs')}
        />
      </div>
    </ProtectedRoute>
  );
}

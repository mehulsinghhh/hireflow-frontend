'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { companiesService } from '@/services/companies';
import { ApiError } from '@/lib/api';
import { Company } from '@/types';
import { CompanyForm } from '@/components/recruiter/company-form';

type FormState =
  | { mode: 'create' }
  | { mode: 'edit'; company: Company }
  | null;

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && typeof error.data === 'object' && error.data !== null) {
    const message = (error.data as { error?: string }).error;
    if (message) return message;
  }

  return error instanceof Error ? error.message : 'Unable to load companies.';
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function RecruiterCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(null);

  const loadCompanies = async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      setCompanies(await companiesService.getAll());
    } catch (error) {
      setFetchError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void loadCompanies());
  }, []);

  const handleSaved = (savedCompany: Company) => {
    setCompanies((currentCompanies) => {
      if (formState?.mode === 'edit') {
        return currentCompanies.map((company) => (
          company.id === savedCompany.id ? savedCompany : company
        ));
      }

      return [savedCompany, ...currentCompanies];
    });
    setFormState(null);
  };

  return (
    <ProtectedRoute allowedRoles={['RECRUITER']}>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-blue-600 mb-2">Recruiter workspace</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Companies</h1>
            <p className="text-slate-600 mt-1 text-sm">Manage companies available for job postings.</p>
          </div>
          <Button onClick={() => setFormState({ mode: 'create' })}>Create Company</Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm">Loading companies...</p>
          </div>
        ) : fetchError ? (
          <Card className="p-6 text-center border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <p className="text-red-700 text-sm font-medium mb-4" role="alert">{fetchError}</p>
              <Button variant="outline" size="sm" onClick={() => void loadCompanies()}>Try Again</Button>
            </CardContent>
          </Card>
        ) : companies.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <CardContent>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">No Companies Yet</h2>
              <p className="text-slate-500 text-sm mb-5">Create a company to make it available for job postings.</p>
              <Button size="sm" onClick={() => setFormState({ mode: 'create' })}>Create Company</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {companies.map((company) => (
              <Card key={company.id} className="flex flex-col justify-between">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={`/companies/${company.id}`} className="text-xl font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                        {company.name}
                      </Link>
                      <p className="text-sm text-slate-600 mt-3 whitespace-pre-line line-clamp-4">
                        {company.description || 'No company description available.'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setFormState({ mode: 'edit', company })}>
                      Edit
                    </Button>
                  </div>
                  <div className="border-t border-slate-100 mt-6 pt-4 text-xs text-slate-500 space-y-1">
                    <p>Added {formatDate(company.createdAt)}</p>
                    <p>Updated {formatDate(company.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Modal
          isOpen={formState !== null}
          onClose={() => setFormState(null)}
          title={formState?.mode === 'edit' ? 'Edit Company' : 'Create Company'}
        >
          {formState && (
            <CompanyForm
              mode={formState.mode}
              company={formState.mode === 'edit' ? formState.company : undefined}
              onSuccess={handleSaved}
              onCancel={() => setFormState(null)}
            />
          )}
        </Modal>
      </div>
    </ProtectedRoute>
  );
}

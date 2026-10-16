'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { CompanyForm } from '@/components/recruiter/company-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ApiError } from '@/lib/api';
import { companiesService } from '@/services/companies';
import { Company } from '@/types';

type FormState =
  | { mode: 'create' }
  | { mode: 'edit'; company: Company }
  | null;

type ActionFeedback = {
  message: string;
  type: 'success' | 'error';
};

type LoadResult = 'success' | 'error' | 'stale';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && typeof error.data === 'object' && error.data !== null) {
    const message = (error.data as { error?: string }).error;
    if (message) return message;
  }

  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const latestRequest = useRef(0);
  const mutationVersion = useRef(0);

  const loadCompanies = useCallback(async (): Promise<LoadResult> => {
    const requestId = ++latestRequest.current;
    const requestedMutationVersion = mutationVersion.current;
    setIsLoading(true);
    setFetchError(null);

    try {
      const loadedCompanies = await companiesService.getAll();

      if (requestId !== latestRequest.current || requestedMutationVersion !== mutationVersion.current) {
        return 'stale';
      }

      setCompanies(loadedCompanies);
      return 'success';
    } catch (error) {
      if (requestId !== latestRequest.current || requestedMutationVersion !== mutationVersion.current) {
        return 'stale';
      }

      setFetchError(getErrorMessage(error, 'Unable to load companies.'));
      return 'error';
    } finally {
      if (requestId === latestRequest.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadCompanies());
  }, [loadCompanies]);

  const handleSaved = async (savedCompany: Company) => {
    mutationVersion.current += 1;
    const editingCompany = formState?.mode === 'edit';

    setCompanies((currentCompanies) => editingCompany
      ? currentCompanies.map((company) => company.id === savedCompany.id ? savedCompany : company)
      : [savedCompany, ...currentCompanies]);
    setFormState(null);

    const refreshResult = await loadCompanies();
    if (refreshResult === 'stale') return;

    if (refreshResult === 'success') {
      setActionFeedback({ message: `Company ${editingCompany ? 'updated' : 'created'} successfully.`, type: 'success' });
    } else {
      setActionFeedback({ message: `Company ${editingCompany ? 'updated' : 'created'} successfully, but the list could not refresh. Retry to load the latest companies.`, type: 'error' });
    }
  };

  const handleDelete = async (company: Company) => {
    if (isDeleting || !window.confirm(`Delete “${company.name}”? This cannot be undone.`)) return;

    setIsDeleting(company.id);
    setActionFeedback(null);

    try {
      await companiesService.delete(company.id);
      mutationVersion.current += 1;
      setCompanies((currentCompanies) => currentCompanies.filter((currentCompany) => currentCompany.id !== company.id));

      const refreshResult = await loadCompanies();
      if (refreshResult === 'stale') return;

      if (refreshResult === 'success') {
        setActionFeedback({ message: 'Company deleted successfully.', type: 'success' });
      } else {
        setActionFeedback({ message: 'Company deleted successfully, but the list could not refresh. Retry to load the latest companies.', type: 'error' });
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to delete this company.');
      setActionFeedback({
        message: error instanceof ApiError && error.status === 400
          ? `${message} Companies with jobs cannot be deleted.`
          : message,
        type: 'error',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-blue-600">Platform administration</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manage Companies</h1>
            <p className="mt-1 text-sm text-slate-600">Create, update, and remove companies across HireFlow.</p>
          </div>
          <Button onClick={() => { setActionFeedback(null); setFormState({ mode: 'create' }); }}>Create Company</Button>
        </div>

        {actionFeedback && (
          <p
            className={`mb-5 rounded-md border px-4 py-3 text-sm ${actionFeedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700'}`}
            role={actionFeedback.type === 'error' ? 'alert' : 'status'}
          >
            {actionFeedback.message}
          </p>
        )}

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500">Loading companies...</div>
        ) : fetchError ? (
          <Card className="border-red-200 bg-red-50 text-center">
            <CardContent className="space-y-4">
              <p className="text-sm text-red-700" role="alert">{fetchError}</p>
              <Button variant="outline" size="sm" onClick={() => { setActionFeedback(null); void loadCompanies(); }}>Retry</Button>
            </CardContent>
          </Card>
        ) : companies.length === 0 ? (
          <Card className="border-dashed text-center">
            <CardContent className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">No companies yet</h2>
              <p className="text-sm text-slate-500">Create the first company for the platform.</p>
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
                      <Link href={`/companies/${company.id}`} className="text-xl font-semibold text-slate-900 transition-colors hover:text-blue-600">
                        {company.name}
                      </Link>
                      <p className="mt-3 whitespace-pre-line text-sm text-slate-600">
                        {company.description || 'No company description available.'}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setActionFeedback(null); setFormState({ mode: 'edit', company }); }}>Edit</Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void handleDelete(company)}
                        disabled={isDeleting !== null}
                        isLoading={isDeleting === company.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">Added {formatDate(company.createdAt)}</p>
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

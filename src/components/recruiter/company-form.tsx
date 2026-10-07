'use client';

import React, { FormEvent, useState } from 'react';
import { ApiError } from '@/lib/api';
import { companiesService } from '@/services/companies';
import { Company } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CompanyFormProps {
  mode: 'create' | 'edit';
  company?: Company;
  onSuccess: (company: Company) => void;
  onCancel: () => void;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && typeof error.data === 'object' && error.data !== null) {
    const message = (error.data as { error?: string }).error;
    if (message) return message;
  }

  return error instanceof Error ? error.message : fallback;
}

export function CompanyForm({ mode, company, onSuccess, onCancel }: CompanyFormProps) {
  const [name, setName] = useState(company?.name ?? '');
  const [description, setDescription] = useState(company?.description ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);
    setSubmitError(null);

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setValidationError('Name is required.');
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setValidationError('Name must be between 2 and 100 characters.');
      return;
    }

    if (trimmedDescription.length > 1000) {
      setValidationError('Description must be at most 1,000 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const savedCompany = mode === 'create'
        ? await companiesService.create({
            name: trimmedName,
            ...(trimmedDescription ? { description: trimmedDescription } : {}),
          })
        : await companiesService.update(company!.id, {
            name: trimmedName,
            description: trimmedDescription,
          });

      setName('');
      setDescription('');
      onSuccess(savedCompany);
    } catch (error) {
      setSubmitError(getErrorMessage(error, `Unable to ${mode === 'create' ? 'create' : 'update'} this company.`));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="e.g. Northstar Labs"
        maxLength={100}
        required
        disabled={isSubmitting}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="company-description" className="text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          id="company-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe the company"
          maxLength={1000}
          rows={6}
          disabled={isSubmitting}
          className="px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
        />
        <p className="text-xs text-slate-500">{description.length}/1,000 characters</p>
      </div>

      {(validationError || submitError) && (
        <p className="text-sm text-red-700" role="alert">
          {validationError || submitError}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === 'create' ? 'Create Company' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

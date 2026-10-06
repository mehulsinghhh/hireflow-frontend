'use client';

import React, { FormEvent, useState } from 'react';
import { Company, Job } from '@/types';
import { CreateJobInput, jobsService } from '@/services/jobs';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface JobFormProps {
  mode: 'create' | 'edit';
  job?: Job;
  companies: Company[];
  isLoadingCompanies?: boolean;
  companyError?: string | null;
  onRetryCompanies?: () => void;
  onSuccess: (job: Job) => void;
  onCancel: () => void;
}

export function JobForm({
  mode,
  job,
  companies,
  isLoadingCompanies = false,
  companyError,
  onRetryCompanies,
  onSuccess,
  onCancel,
}: JobFormProps) {
  const [title, setTitle] = useState(job?.title ?? '');
  const [description, setDescription] = useState(job?.description ?? '');
  const [location, setLocation] = useState(job?.location ?? '');
  const [companyId, setCompanyId] = useState(job?.companyId ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof ApiError && typeof error.data === 'object' && error.data !== null) {
      const message = (error.data as { error?: string }).error;
      if (message) return message;
    }
    return error instanceof Error ? error.message : fallback;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);
    setSubmitError(null);

    if (!title.trim() || !description.trim() || !location.trim()) {
      setValidationError('Title, description, and location are required.');
      return;
    }

    if (mode === 'create' && !companyId) {
      setValidationError('Select a company for this job.');
      return;
    }

    setIsSubmitting(true);
    try {
      const savedJob = mode === 'create'
        ? await jobsService.create({
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            companyId,
          } satisfies CreateJobInput)
        : await jobsService.update(job!.id, {
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
          });
      onSuccess(savedJob);
    } catch (error) {
      setSubmitError(getErrorMessage(error, `Unable to ${mode === 'create' ? 'create' : 'update'} this job.`));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Job details' : 'Edit job details'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Senior Product Designer"
            required
            disabled={isSubmitting}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="job-description" className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              id="job-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the role and its responsibilities"
              rows={7}
              required
              disabled={isSubmitting}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
            />
          </div>

          <Input
            label="Location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="e.g. Austin, TX or Remote"
            required
            disabled={isSubmitting}
          />

          {mode === 'create' ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="job-company" className="text-sm font-medium text-slate-700">Company</label>
              {isLoadingCompanies ? (
                <p className="text-sm text-slate-500">Loading companies...</p>
              ) : companyError ? (
                <div className="flex items-center gap-3 text-sm">
                  <p className="text-red-700" role="alert">{companyError}</p>
                  {onRetryCompanies && <Button type="button" variant="outline" size="sm" onClick={onRetryCompanies}>Retry</Button>}
                </div>
              ) : (
                <select
                  id="job-company"
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
                  required
                  disabled={isSubmitting || companies.length === 0}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              )}
              {!isLoadingCompanies && !companyError && companies.length === 0 && (
                <p className="text-xs text-amber-700">Create a company before posting a job.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Company</span>
              <p className="px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-600">
                {job?.company?.name ?? 'Company unavailable'}
              </p>
              <p className="text-xs text-slate-500">Company changes are not supported by the job update API.</p>
            </div>
          )}

          {(validationError || submitError) && (
            <p className="text-sm text-red-700" role="alert">{validationError || submitError}</p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} disabled={mode === 'create' && (isLoadingCompanies || companies.length === 0)}>
              {mode === 'create' ? 'Create Job' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

import { api } from '@/lib/api';
import { Application, Job } from '@/types';

export interface CreateJobInput {
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  salary?: string;
  type?: string;
  companyId: string;
}

export type UpdateJobInput = Partial<CreateJobInput>;

export const jobsService = {
  getAll: (params?: Record<string, string | number | boolean>): Promise<Job[]> => {
    return api.get<Job[]>('/api/jobs', { params });
  },

  getById: (id: string): Promise<Job> => {
    return api.get<Job>(`/api/jobs/${id}`);
  },

  create: (data: CreateJobInput): Promise<Job> => {
    return api.post<Job>('/api/jobs', data);
  },

  update: (id: string, data: UpdateJobInput): Promise<Job> => {
    return api.patch<Job>(`/api/jobs/${id}`, data);
  },

  delete: (id: string): Promise<void> => {
    return api.delete<void>(`/api/jobs/${id}`);
  },

  getApplications: (jobId: string): Promise<Application[]> => {
    return api.get<Application[]>(`/api/jobs/${jobId}/applications`);
  },
};

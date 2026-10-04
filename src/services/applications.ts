import { api } from '@/lib/api';
import { Application, ApplicationStatus } from '@/types';

export interface CreateApplicationInput {
  jobId: string;
}

export const applicationsService = {
  create: (data: CreateApplicationInput): Promise<Application> => {
    return api.post<Application>('/api/applications', data);
  },

  getMyApplications: (): Promise<Application[]> => {
    return api.get<Application[]>('/api/applications/me');
  },

  getMyJobApplications: (): Promise<Application[]> => {
    return api.get<Application[]>('/api/applications/my-jobs');
  },

  getAll: (): Promise<Application[]> => {
    return api.get<Application[]>('/api/applications');
  },

  getById: (id: string): Promise<Application> => {
    return api.get<Application>(`/api/applications/${id}`);
  },

  updateStatus: (
    id: string,
    status: ApplicationStatus
  ): Promise<Application> => {
    return api.patch<Application>(`/api/applications/${id}/status`, { status });
  },
};

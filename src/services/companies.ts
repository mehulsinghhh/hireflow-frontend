import { api } from '@/lib/api';
import { Company } from '@/types';

export interface CreateCompanyInput {
  name: string;
  description?: string;
}

export type UpdateCompanyInput = Partial<CreateCompanyInput>;

export const companiesService = {
  getAll: (): Promise<Company[]> => {
    return api.get<Company[]>('/api/companies');
  },

  getById: (id: string): Promise<Company> => {
    return api.get<Company>(`/api/companies/${id}`);
  },

  create: (data: CreateCompanyInput): Promise<Company> => {
    return api.post<Company>('/api/companies', data);
  },

  update: (id: string, data: UpdateCompanyInput): Promise<Company> => {
    return api.patch<Company>(`/api/companies/${id}`, data);
  },

  delete: (id: string): Promise<void> => {
    return api.delete<void>(`/api/companies/${id}`);
  },
};

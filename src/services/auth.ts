import { api } from '@/lib/api';
import {
  LoginCredentials,
  LoginResponse,
  MeResponse,
  RegisterCredentials,
  RegisterResponse,
} from '@/types';

export const authService = {
  register: (data: RegisterCredentials): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>('/api/auth/register', data);
  },

  login: (credentials: LoginCredentials): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/api/auth/login', credentials);
  },

  getMe: (): Promise<MeResponse> => {
    return api.get<MeResponse>('/api/me');
  },
};

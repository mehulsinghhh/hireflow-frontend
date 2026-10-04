import { api } from '@/lib/api';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types';

export const authService = {
  register: (data: RegisterCredentials): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/api/auth/register', data);
  },

  login: (credentials: LoginCredentials): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/api/auth/login', credentials);
  },

  getMe: (): Promise<User> => {
    return api.get<User>('/api/me');
  },
};

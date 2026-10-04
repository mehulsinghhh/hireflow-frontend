export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'REJECTED'
  | 'HIRED';

export type NotificationType =
  | 'APPLICATION_CREATED'
  | 'APPLICATION_STATUS_CHANGED';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  website?: string;
  location?: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  salary?: string;
  type?: string;
  companyId: string;
  company?: Company;
  createdAt?: string;
  updatedAt?: string;
}

export interface Application {
  id: string;
  jobId: string;
  job?: Job;
  candidateId: string;
  candidate?: User;
  status: ApplicationStatus;
  resumeUrl?: string;
  coverLetter?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  token: string;
}

export interface MeResponse {
  message: string;
  user: {
    userId: string;
    role: UserRole;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

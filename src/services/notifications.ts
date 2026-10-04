import { api } from '@/lib/api';
import { Notification } from '@/types';

export interface UnreadCountResponse {
  count: number;
}

export const notificationsService = {
  getAll: (): Promise<Notification[]> => {
    return api.get<Notification[]>('/api/notifications');
  },

  getUnreadCount: (): Promise<UnreadCountResponse> => {
    return api.get<UnreadCountResponse>('/api/notifications/unread-count');
  },

  markAsRead: (id: string): Promise<Notification> => {
    return api.patch<Notification>(`/api/notifications/${id}/read`);
  },
};

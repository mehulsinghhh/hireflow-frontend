import { api } from '@/lib/api';
import { Notification, NotificationsResponse } from '@/types';

export interface UnreadCountResponse {
  count: number;
}

export const notificationsService = {
  getAll: (page = 1, limit = 20): Promise<NotificationsResponse> => {
    return api.get<NotificationsResponse>('/api/notifications', {
      params: { page, limit },
    });
  },

  getUnreadCount: (): Promise<UnreadCountResponse> => {
    return api.get<UnreadCountResponse>('/api/notifications/unread-count');
  },

  markAsRead: (id: string): Promise<Notification> => {
    return api.patch<Notification>(`/api/notifications/${id}/read`);
  },
};

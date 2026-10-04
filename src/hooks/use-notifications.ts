'use client';

import { useState, useEffect, useCallback } from 'react';
import { notificationsService } from '@/services/notifications';
import { Notification } from '@/types';
import { useAuth } from './use-auth';

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [list, countRes] = await Promise.all([
        notificationsService.getAll(),
        notificationsService.getUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(countRes.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      notificationsService
        .getAll()
        .then((list) => setNotifications(list))
        .catch((err) =>
          setError(err instanceof Error ? err.message : 'Failed to load notifications')
        );

      notificationsService
        .getUnreadCount()
        .then((res) => setUnreadCount(res.count))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const markAsRead = async (id: string) => {
    try {
      const updated = await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? updated : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      throw err;
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
  };
}

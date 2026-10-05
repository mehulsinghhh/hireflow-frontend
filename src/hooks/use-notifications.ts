'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsService } from '@/services/notifications';
import { Notification } from '@/types';
import { useAuth } from './use-auth';

interface UseNotificationsOptions {
  fetchNotifications?: boolean;
  fetchUnreadCount?: boolean;
}

export function useNotifications({
  fetchNotifications: shouldFetchNotifications = true,
  fetchUnreadCount: shouldFetchUnreadCount = true,
}: UseNotificationsOptions = {}) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);
  const isMounted = useRef(false);

  const fetchNotifications = useCallback(async () => {
    const sequence = ++requestSequence.current;

    if (!isAuthenticated || user?.role !== 'CANDIDATE') {
      if (isMounted.current && sequence === requestSequence.current) {
        setNotifications([]);
        setUnreadCount(0);
      }
      return;
    }

    if (isMounted.current && sequence === requestSequence.current) {
      setIsLoading(shouldFetchNotifications);
      setError(null);
    }

    try {
      const [list, countRes] = await Promise.all([
        shouldFetchNotifications ? notificationsService.getAll() : null,
        shouldFetchUnreadCount ? notificationsService.getUnreadCount() : null,
      ]);

      if (!isMounted.current || sequence !== requestSequence.current) return;
      if (list) setNotifications(list.notifications);
      if (countRes) setUnreadCount(countRes.count);
    } catch (err) {
      if (isMounted.current && sequence === requestSequence.current) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      }
    } finally {
      if (isMounted.current && sequence === requestSequence.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, shouldFetchNotifications, shouldFetchUnreadCount, user?.role]);

  useEffect(() => {
    isMounted.current = true;
    void Promise.resolve().then(() => fetchNotifications());

    return () => {
      isMounted.current = false;
      requestSequence.current += 1;
    };
  }, [fetchNotifications, user?.id]);

  const markAsRead = async (id: string) => {
    const sequence = ++requestSequence.current;

    try {
      const updated = await notificationsService.markAsRead(id);

      if (!isMounted.current || sequence !== requestSequence.current) return;
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));

      if (shouldFetchUnreadCount) {
        const countRes = await notificationsService.getUnreadCount();
        if (!isMounted.current || sequence !== requestSequence.current) return;
        setUnreadCount(countRes.count);
      }
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

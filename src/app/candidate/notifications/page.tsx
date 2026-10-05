'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationType } from '@/types';

const notificationTypeLabel: Record<NotificationType, string> = {
  APPLICATION_CREATED: 'Application submitted',
  APPLICATION_STATUS_CHANGED: 'Application status changed',
};

export default function CandidateNotificationsPage() {
  const { notifications, isLoading, error, refresh, markAsRead } = useNotifications({
    fetchNotifications: true,
    fetchUnreadCount: true,
  });
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleMarkAsRead = async (id: string) => {
    setMarkingId(id);
    setActionError(null);
    try {
      await markAsRead(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to mark notification as read.');
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['CANDIDATE']}>
      <div className="mx-auto max-w-5xl py-2">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Candidate notifications</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
            <p className="mt-2 text-sm text-slate-600">
              Stay up to date with your applications.
            </p>
          </div>
          {!isLoading && !error && notifications.length > 0 && (
            <p className="text-sm text-slate-500">
              {notifications.length} notification{notifications.length === 1 ? '' : 's'}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500">
            Loading notifications...
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-start gap-4 pt-1 text-sm text-red-700">
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={refresh}>Try again</Button>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-1 text-center">
              <p className="text-sm text-slate-600">You have no notifications yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {actionError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-1 text-sm text-red-700">{actionError}</CardContent>
              </Card>
            )}
            {notifications.map((notification) => {
              const isUnread = notification.readAt === null;
              return (
                <Card
                  key={notification.id}
                  className={isUnread ? 'border-blue-200 bg-blue-50/30' : ''}
                >
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{notificationTypeLabel[notification.type]}</CardTitle>
                        <Badge variant={isUnread ? 'info' : 'default'}>
                          {isUnread ? 'Unread' : 'Read'}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {isUnread && (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={markingId === notification.id}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-slate-700">{notification.message}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

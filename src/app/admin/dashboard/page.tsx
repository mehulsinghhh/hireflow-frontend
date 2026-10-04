'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="max-w-4xl mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Welcome to your admin dashboard. Manage system jobs, companies, and applications.
            </p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

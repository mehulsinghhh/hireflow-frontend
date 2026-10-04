'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CandidateDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['CANDIDATE']}>
      <div className="max-w-4xl mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Candidate Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Welcome to your candidate dashboard. Here you will track job applications and notifications.
            </p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

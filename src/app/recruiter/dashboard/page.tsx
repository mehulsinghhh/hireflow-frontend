'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RecruiterDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['RECRUITER']}>
      <div className="max-w-4xl mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Recruiter Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Welcome to your recruiter dashboard. Manage job postings, company profiles, and applicant pipelines.
            </p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

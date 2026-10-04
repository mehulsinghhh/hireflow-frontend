'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const registered = searchParams.get('registered') === 'true';

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'CANDIDATE') router.replace('/candidate/dashboard');
      else if (user.role === 'RECRUITER') router.replace('/recruiter/dashboard');
      else if (user.role === 'ADMIN') router.replace('/admin/dashboard');
      else router.replace('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const authenticatedUser = await login({ email, password });
      if (authenticatedUser.role === 'CANDIDATE') {
        router.push('/candidate/dashboard');
      } else if (authenticatedUser.role === 'RECRUITER') {
        router.push('/recruiter/dashboard');
      } else if (authenticatedUser.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setError('Email and password are required.');
        } else if (err.status === 401) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(err.message || 'An error occurred during login.');
        }
      } else {
        setError('Unable to connect to the server. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-slate-500 text-sm">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign In to HireFlow</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Enter your credentials to access your account
          </p>
        </CardHeader>
        <CardContent>
          {registered && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md">
              Registration successful! Please sign in with your email and password.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-12">
          <div className="text-slate-500 text-sm">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

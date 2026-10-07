'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
}

const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: 'Jobs', href: '/jobs' },
  { label: 'Companies', href: '/companies' },
];

const ROLE_NAV_ITEMS: Record<UserRole, NavItem[]> = {
  CANDIDATE: [
    { label: 'Dashboard', href: '/candidate/dashboard' },
    { label: 'Jobs', href: '/jobs' },
    { label: 'Applications', href: '/candidate/applications' },
    { label: 'Notifications', href: '/candidate/notifications' },
  ],
  RECRUITER: [
    { label: 'Dashboard', href: '/recruiter/dashboard' },
    { label: 'Jobs', href: '/recruiter/jobs' },
    { label: 'Applicants', href: '/applicants' },
    { label: 'Companies', href: '/recruiter/companies' },
    { label: 'Notifications', href: '/notifications' },
  ],
  ADMIN: [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Jobs', href: '/jobs' },
    { label: 'Companies', href: '/companies' },
    { label: 'Applications', href: '/applications' },
    { label: 'Notifications', href: '/notifications' },
  ],
};

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications({
    fetchNotifications: false,
    fetchUnreadCount: true,
  });

  const navItems = isAuthenticated && user?.role ? ROLE_NAV_ITEMS[user.role] : PUBLIC_NAV_ITEMS;

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-slate-900 tracking-tight">
              Hire<span className="text-blue-600">Flow</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const isNotifications = item.href === '/candidate/notifications';

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-blue-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                    {isNotifications && unreadCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{user?.name || user?.email}</p>
                  <p className="text-xs text-slate-500">{user?.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

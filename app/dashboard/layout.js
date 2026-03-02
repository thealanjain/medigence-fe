'use client';

import Navbar from '@/components/layout/Navbar';
import { useRequireAuth } from '@/hooks/useAuth';

export default function DashboardLayout({ children }) {
  const { loading } = useRequireAuth('DOCTOR');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="medical-gradient rounded-2xl p-4 animate-pulse">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-background to-blue-50/30">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10">{children}</main>
    </div>
  );
}

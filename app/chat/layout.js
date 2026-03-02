'use client';

import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import useIsOnboardingCompleted from '@/hooks/isOnboardingCompleted';
import { useRequireAuth } from '@/hooks/useAuth';

export default function ChatLayout({ children }) {
  const { loading } = useRequireAuth();
  const { role } = useAuth();
  const { isBordingCompleted } = useIsOnboardingCompleted();

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

  if (!isBordingCompleted && role === 'PATIENT') {
    return (
      <div className="min-h-screen from-blue-50/50 via-background to-teal-50/30">
      <Navbar />
      <div className="min-h-screen flex items-center justify-center">
        <div className="medical-gradient rounded-2xl p-4 animate-pulse">
          Complete your onboarding to connect with doctors
        </div>
      </div>
    </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
    </div>
  );
}

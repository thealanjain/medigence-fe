'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redirect authenticated users based on role.
 * Use in login/signup pages to avoid re-entering.
 */
export function useRedirectIfAuthenticated() {
  const { isAuthenticated, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      if (role === 'PATIENT') router.replace('/onboarding');
      else if (role === 'DOCTOR') router.replace('/dashboard');
    }
  }, [isAuthenticated, role, loading, router]);
}

/**
 * Guard a page to require auth. Optionally restrict by role.
 */
export function useRequireAuth(allowedRole) {
  const { isAuthenticated, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (allowedRole && role !== allowedRole) {
      // Wrong role, redirect to their home
      if (role === 'PATIENT') router.replace('/onboarding');
      else if (role === 'DOCTOR') router.replace('/dashboard');
    }
  }, [isAuthenticated, role, loading, allowedRole, router]);

  return { loading, isAuthenticated, role };
}

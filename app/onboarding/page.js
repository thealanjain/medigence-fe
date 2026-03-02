'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onboardingAPI } from '@/services/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkDraft() {
      try {
        const res = await onboardingAPI.getDraft();
        const { next_step, is_complete } = res.data.data;

        if (is_complete) {
          router.replace('/doctors');
        } else if (next_step === 4) {
          router.replace('/onboarding/step-4');
        } else if (next_step === 2) {
          router.replace('/onboarding/step-2');
        } else if (next_step === 3) {
          router.replace('/onboarding/step-3');
        } else {
          router.replace('/onboarding/step-1');
        }
      } catch {
        router.replace('/onboarding/step-1');
      } finally {
        setChecking(false);
      }
    }
    checkDraft();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Checking your progress…</span>
      </div>
    </div>
  );
}

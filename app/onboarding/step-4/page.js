'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onboardingAPI } from '@/services/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/helpers';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, ArrowLeft, Send, User, Heart, Shield } from 'lucide-react';

function SummaryRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-medium text-foreground sm:text-right mt-0.5 sm:mt-0 max-w-xs">{value}</span>
    </div>
  );
}

export default function Step4Page() {
  const router = useRouter();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    onboardingAPI.getDraft().then((res) => {
      setDraft(res.data.data);
    }).catch(() => {
      toast.error('Could not load your progress');
    }).finally(() => setLoading(false));
  }, []);

  const getStepData = (stepNumber) => {
    const draft_item = draft?.drafts?.find((d) => d.step_number === stepNumber);
    if (!draft_item?.data) return null;
    return typeof draft_item.data === 'string' ? JSON.parse(draft_item.data) : draft_item.data;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onboardingAPI.submit();
      toast.success('Onboarding complete! Now choose your doctor.');
      router.push('/doctors');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const step1 = getStepData(1);
  const step2 = getStepData(2);
  const step3 = getStepData(3);

  const completedCount = [step1, step2, step3].filter(Boolean).length;

  if (completedCount < 3) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <OnboardingProgress currentStep={4} completedSteps={[1, 2, 3].slice(0, completedCount)} />
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="text-4xl">⚠️</div>
            <p className="text-lg font-semibold">Incomplete Onboarding</p>
            <p className="text-muted-foreground">
              Please complete all 3 steps before reviewing your summary.
            </p>
            <Button onClick={() => router.push(`/onboarding/step-${completedCount + 1}`)}>
              Continue from Step {completedCount + 1}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <OnboardingProgress currentStep={4} completedSteps={[1, 2, 3]} />

      {/* Header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Review Your Information</h2>
        <p className="text-muted-foreground mt-1">Please review before submitting. You can go back to edit.</p>
      </div>

      <div className="grid gap-4">
        {/* Step 1: Personal */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 rounded-lg p-1.5">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle className="text-base">Personal Information</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/onboarding/step-1')} className="text-primary h-7">
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SummaryRow label="Full Name" value={step1?.full_name} />
            <SummaryRow label="Age" value={step1?.age} />
            <SummaryRow label="Gender" value={step1?.gender} />
            <SummaryRow label="Phone" value={step1?.phone} />
            <SummaryRow label="City" value={step1?.city} />
            <SummaryRow label="Country" value={step1?.country} />
            <SummaryRow label="Address" value={step1?.address} />
          </CardContent>
        </Card>

        {/* Step 2: Medical */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 rounded-lg p-1.5">
                  <Heart className="h-4 w-4 text-red-600" />
                </div>
                <CardTitle className="text-base">Medical Information</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/onboarding/step-2')} className="text-primary h-7">
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SummaryRow label="Blood Type" value={step2?.blood_type} />
            <SummaryRow label="Current Medications" value={step2?.current_medications} />
            <SummaryRow label="Emergency Contact" value={step2?.emergency_contact} />
            <SummaryRow label="Emergency Phone" value={step2?.emergency_phone} />
            {step2?.allergies?.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Allergies</span>
                <div className="flex flex-wrap gap-1 mt-1 sm:mt-0 sm:justify-end">
                  {step2.allergies.map((a) => (
                    <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                  ))}
                </div>
              </div>
            )}
            {step2?.chronic_conditions?.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground font-medium">Chronic Conditions</span>
                <div className="flex flex-wrap gap-1 mt-1 sm:mt-0 sm:justify-end">
                  {step2.chronic_conditions.map((c) => (
                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
            <SummaryRow label="Additional Notes" value={step2?.additional_notes} />
          </CardContent>
        </Card>

        {/* Step 3: Insurance */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 rounded-lg p-1.5">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <CardTitle className="text-base">Insurance Information</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/onboarding/step-3')} className="text-primary h-7">
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SummaryRow label="Insurance Provider" value={step3?.insurance_provider} />
            <SummaryRow label="Policy Number" value={step3?.policy_number} />
            <SummaryRow label="Preferred Time" value={step3?.preferred_time_slot} />
            <SummaryRow label="Referral Source" value={step3?.referral_source} />
            <SummaryRow label="Notes" value={step3?.additional_notes} />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pb-6">
        <Button variant="outline" onClick={() => router.push('/onboarding/step-3')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          className="medical-gradient border-0 text-white hover:opacity-90 gap-2 px-8"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit & Choose Doctor
        </Button>
      </div>
    </div>
  );
}

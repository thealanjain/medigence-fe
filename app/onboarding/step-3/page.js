'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { onboardingAPI } from '@/services/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/helpers';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRight, ArrowLeft, Shield } from 'lucide-react';

const step3Schema = z.object({
  insurance_provider: z.string().trim().max(255).optional(),
  policy_number: z.string().trim().max(100).optional(),
  preferred_time_slot: z.enum(['Morning', 'Afternoon', 'Evening', 'Night']).optional(),
  referral_source: z.string().trim().max(255).optional(),
  additional_notes: z.string().trim().max(2000).optional(),
});

const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'];

export default function Step3Page() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(step3Schema) });

  const timeSlot = watch('preferred_time_slot');

  useEffect(() => {
    onboardingAPI.getDraft().then((res) => {
      const draft = res.data.data.drafts?.find((d) => d.step_number === 3);
      if (draft?.data) {
        const d = typeof draft.data === 'string' ? JSON.parse(draft.data) : draft.data;
        reset(d);
      }
    }).catch(() => {});
  }, [reset]);

  const onSubmit = async (data) => {
    try {
      await onboardingAPI.saveStep3(data);
      toast.success('Step 3 saved!');
      router.push('/onboarding/step-4');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <OnboardingProgress currentStep={3} completedSteps={[1, 2]} />

      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="medical-gradient rounded-xl p-2.5">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Insurance Information</CardTitle>
              <CardDescription>Your coverage and preferences</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="insurance_provider">Insurance Provider</Label>
                <Input
                  id="insurance_provider"
                  placeholder="e.g. Star Health, HDFC Ergo"
                  {...register('insurance_provider')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="policy_number">Insurance ID / Policy Number</Label>
                <Input
                  id="policy_number"
                  placeholder="e.g. POL-123456789"
                  {...register('policy_number')}
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Time Slot</Label>
                <Select
                  onValueChange={(v) => setValue('preferred_time_slot', v, { shouldValidate: true })}
                  value={timeSlot}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral_source">Referral Source</Label>
                <Input
                  id="referral_source"
                  placeholder="e.g. Doctor referral, online search"
                  {...register('referral_source')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_notes">Additional Notes</Label>
              <Textarea
                id="additional_notes"
                placeholder="Any additional information or special requests…"
                rows={4}
                {...register('additional_notes')}
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/onboarding/step-2')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                type="submit"
                className="medical-gradient border-0 text-white hover:opacity-90 gap-2 px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Review Summary
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

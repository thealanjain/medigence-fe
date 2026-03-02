'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, ArrowLeft, Heart, X } from 'lucide-react';

const step2Schema = z.object({
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.array(z.string().trim()).default([]),
  chronic_conditions: z.array(z.string().trim()).default([]),
  current_medications: z.string().trim().max(1000).optional(),
  emergency_contact: z.string().trim().max(255).optional(),
  emergency_phone: z.string().trim().optional(),
  additional_notes: z.string().trim().max(2000).optional(),
});

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMMON_CONDITIONS = [
  'Diabetes', 'Hypertension', 'Asthma', 'Heart Disease',
  'Arthritis', 'Depression', 'Anxiety', 'Thyroid Disorder',
];
const COMMON_ALLERGIES = [
  'Penicillin', 'Aspirin', 'Pollen', 'Shellfish',
  'Peanuts', 'Latex', 'Sulfa drugs', 'Dairy',
];

export default function Step2Page() {
  const router = useRouter();
  const [allergyInput, setAllergyInput] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(step2Schema), defaultValues: { allergies: [], chronic_conditions: [] } });

  const bloodType = watch('blood_type');
  const allergies = watch('allergies') || [];
  const conditions = watch('chronic_conditions') || [];

  useEffect(() => {
    onboardingAPI.getDraft().then((res) => {
      const draft = res.data.data.drafts?.find((d) => d.step_number === 2);
      if (draft?.data) {
        const d = typeof draft.data === 'string' ? JSON.parse(draft.data) : draft.data;
        reset(d);
      }
    }).catch(() => {});
  }, [reset]);

  const addAllergy = (allergy) => {
    const trimmed = allergy.trim();
    if (!trimmed || allergies.includes(trimmed)) return;
    setValue('allergies', [...allergies, trimmed], { shouldValidate: true });
    setAllergyInput('');
  };

  const removeAllergy = (a) => {
    setValue('allergies', allergies.filter((x) => x !== a), { shouldValidate: true });
  };

  const toggleCondition = (condition) => {
    if (conditions.includes(condition)) {
      setValue('chronic_conditions', conditions.filter((c) => c !== condition), { shouldValidate: true });
    } else {
      setValue('chronic_conditions', [...conditions, condition], { shouldValidate: true });
    }
  };

  const onSubmit = async (data) => {
    try {
      await onboardingAPI.saveStep2(data);
      toast.success('Step 2 saved!');
      router.push('/onboarding/step-3');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <OnboardingProgress currentStep={2} completedSteps={[1]} />

      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="medical-gradient rounded-xl p-2.5">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Medical Information</CardTitle>
              <CardDescription>Help us understand your health background</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Blood Type */}
            <div className="space-y-2">
              <Label>Blood Type</Label>
              <Select
                onValueChange={(v) => setValue('blood_type', v, { shouldValidate: true })}
                value={bloodType}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map((bt) => (
                    <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Allergies */}
            <div className="space-y-3">
              <Label>Known Allergies</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {COMMON_ALLERGIES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => addAllergy(a)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      allergies.includes(a)
                        ? 'bg-primary text-white border-primary'
                        : 'border-border hover:border-primary/50 text-muted-foreground'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type custom allergy and press Enter"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addAllergy(allergyInput); }
                  }}
                />
                <Button type="button" variant="outline" onClick={() => addAllergy(allergyInput)}>Add</Button>
              </div>
              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {allergies.map((a) => (
                    <Badge key={a} variant="secondary" className="gap-1">
                      {a}
                      <button type="button" onClick={() => removeAllergy(a)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Chronic Conditions */}
            <div className="space-y-3">
              <Label>Chronic Conditions</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {COMMON_CONDITIONS.map((condition) => (
                  <div key={condition} className="flex items-center gap-2">
                    <Checkbox
                      id={condition}
                      checked={conditions.includes(condition)}
                      onCheckedChange={() => toggleCondition(condition)}
                    />
                    <Label htmlFor={condition} className="text-sm font-normal cursor-pointer">{condition}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Medications */}
            <div className="space-y-2">
              <Label htmlFor="current_medications">Current Medications</Label>
              <Textarea
                id="current_medications"
                placeholder="List your current medications, dosage, frequency…"
                rows={3}
                {...register('current_medications')}
              />
            </div>

            {/* Emergency Contact */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Emergency Contact Name</Label>
                <Input id="emergency_contact" placeholder="Jane Doe" {...register('emergency_contact')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
                <Input id="emergency_phone" type="tel" placeholder="+91 98765 43210" {...register('emergency_phone')} />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="additional_notes">Additional Notes</Label>
              <Textarea
                id="additional_notes"
                placeholder="Any other medical information you'd like to share…"
                rows={3}
                {...register('additional_notes')}
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => router.push('/onboarding/step-1')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                type="submit"
                className="medical-gradient border-0 text-white hover:opacity-90 gap-2 px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

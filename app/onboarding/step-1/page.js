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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRight, User } from 'lucide-react';

const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{3,6}[-\s.]?[0-9]{3,6}$/;

const step1Schema = z.object({
  full_name: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .refine((v) => v.trim().split(/\s+/).length >= 2, 'Full name must contain at least 2 words'),
  age: z
    .string({ required_error: 'Age is required' })
    .transform(Number)
    .pipe(z.number().int().min(18, 'You must be at least 18 years old')),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(phoneRegex, 'Please enter a valid phone number'),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).default('India'),
});

export default function Step1Page() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(step1Schema) });

  const gender = watch('gender');

  // Pre-fill from draft
  useEffect(() => {
    onboardingAPI.getDraft().then((res) => {
      const draft = res.data.data.drafts?.find((d) => d.step_number === 1);
      if (draft?.data) {
        const d = typeof draft.data === 'string' ? JSON.parse(draft.data) : draft.data;
        reset({ ...d, age: d.age?.toString() });
      }
    }).catch(() => {});
  }, [reset]);

  const onSubmit = async (data) => {
    try {
      await onboardingAPI.saveStep1(data);
      toast.success('Step 1 saved!');
      router.push('/onboarding/step-2');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <OnboardingProgress currentStep={1} completedSteps={[]} />

      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="medical-gradient rounded-xl p-2.5">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Personal Information</CardTitle>
              <CardDescription>Tell us about yourself to get started</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="John Michael Doe"
                  {...register('full_name')}
                  className={errors.full_name ? 'border-destructive' : ''}
                />
                {errors.full_name && <p className="text-destructive text-sm">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min={18}
                  max={120}
                  placeholder="25"
                  {...register('age')}
                  className={errors.age ? 'border-destructive' : ''}
                />
                {errors.age && <p className="text-destructive text-sm">{errors.age.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  onValueChange={(v) => setValue('gender', v, { shouldValidate: true })}
                  value={gender}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genders.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...register('phone')}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-destructive text-sm">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Mumbai" {...register('city')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" placeholder="India" {...register('country')} defaultValue="India" />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Main St, Apartment 4B" {...register('address')} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="medical-gradient border-0 text-white hover:opacity-90 gap-2 px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

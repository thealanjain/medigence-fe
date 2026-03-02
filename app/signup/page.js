'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useRedirectIfAuthenticated } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/helpers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Activity, Eye, EyeOff, Loader2, Stethoscope, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['PATIENT', 'DOCTOR'], { required_error: 'Please select a role' }),
});

export default function SignupPage() {
  useRedirectIfAuthenticated();
  const { signup } = useAuth();
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'PATIENT' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    try {
      const user = await signup(data);
      toast.success('Account created! Welcome to Medigence.');
      if (user.role === 'PATIENT') router.replace('/onboarding');
      else router.replace('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const roles = [
    { value: 'PATIENT', label: 'Patient', icon: User, desc: 'I need medical care' },
    { value: 'DOCTOR', label: 'Doctor', icon: Stethoscope, desc: 'I provide medical care' },
  ];
  
  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 medical-gradient items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border-2 border-white"
              style={{
                width: `${(i + 1) * 120}px`,
                height: `${(i + 1) * 120}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-white text-center max-w-md">
          <div className="flex justify-center mb-8">
            <div className="bg-white/20 rounded-2xl p-5">
              <Activity className="h-14 w-14 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Join Medigence</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Connect patients with doctors for seamless, real-time healthcare experiences.
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="medical-gradient rounded-lg p-1.5">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">
              Medi<span className="text-primary">gence</span>
            </span>
          </div>

          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">Create account</CardTitle>
              <CardDescription>Join Medigence in seconds</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Role selection */}
                <div className="space-y-2">
                  <Label>I am a…</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map(({ value, label, icon: Icon, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue('role', value, { shouldValidate: true })}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer',
                          selectedRole === value
                            ? 'bg-gray-200 text-primary'
                            : 'border-border hover:border-primary/50 text-muted-foreground'
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        <div className="text-sm font-semibold">{label}</div>
                        <div className="text-xs text-center opacity-70">{desc}</div>
                      </button>
                    ))}
                  </div>
                  {errors.role && (
                    <p className="text-destructive text-sm">{errors.role.message}</p>
                  )}
                  <input type="hidden" {...register('role')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      {...register('password')}
                      className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPwd(!showPwd)}
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-sm">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 medical-gradient border-0 text-white hover:opacity-90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account…</>
                  ) : (
                    'Create account'
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

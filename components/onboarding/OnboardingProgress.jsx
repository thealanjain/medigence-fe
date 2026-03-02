'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const steps = [
  { number: 1, label: 'Personal Info' },
  { number: 2, label: 'Medical Info' },
  { number: 3, label: 'Insurance' },
  { number: 4, label: 'Review' },
];

export default function OnboardingProgress({ currentStep, completedSteps = [] }) {
  const progressValue = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full">
      {/* Progress bar */}
      <Progress value={progressValue} className="h-2 mb-6" />

      {/* Step indicators */}
      <div className="flex justify-between relative">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.number) || currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div key={step.number} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center border-2 text-sm font-semibold transition-all duration-300',
                  isCompleted
                    ? 'bg-blue-200 border-blue-700 text-primary-foreground'
                    : isCurrent
                    ? 'bg-background border-primary text-primary'
                    : 'bg-background border-border text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.number}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

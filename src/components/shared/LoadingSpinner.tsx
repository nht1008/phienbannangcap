
"use client";

import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <LoaderCircle
      className={cn('animate-spin text-primary', className)}
      size={size}
      strokeWidth={2.5}
    />
  );
}

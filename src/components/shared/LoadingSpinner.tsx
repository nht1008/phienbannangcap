
"use client";

import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <LoaderCircle
      style={{ width: size, height: size }}
      className={cn('animate-spin text-primary', className)}
    />
  );
}

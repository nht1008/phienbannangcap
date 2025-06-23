
"use client";

<<<<<<< HEAD
import React from 'react';
=======
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <LoaderCircle
<<<<<<< HEAD
      style={{ width: size, height: size }}
      className={cn('animate-spin text-primary', className)}
=======
      className={cn('animate-spin text-primary', className)}
      size={size}
      strokeWidth={2.5}
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740
    />
  );
}

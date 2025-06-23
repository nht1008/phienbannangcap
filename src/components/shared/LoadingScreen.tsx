
"use client";

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Đang tải..." }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <LoadingSpinner size={48} className="mb-4" />
      <p className="text-lg text-foreground">{message}</p>
    </div>
  );
}

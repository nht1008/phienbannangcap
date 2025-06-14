
"use client";

import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Đang tải..." }: LoadingScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <p className="text-lg text-foreground">{message}</p>
      {/* Optional: Add a spinner or loading animation here */}
    </div>
  );
}

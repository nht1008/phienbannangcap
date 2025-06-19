
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { HomeIcon } from '@/components/icons/HomeIcon';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { ref, onValue } from "firebase/database";
import type { ShopInfo } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, currentUser, loading: authLoading, error, setError } = useAuth();
  const router = useRouter();
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [isLoadingShopInfo, setIsLoadingShopInfo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const shopInfoRef = ref(db, 'shopInfo');
    const unsubscribe = onValue(shopInfoRef, (snapshot) => {
      if (snapshot.exists()) {
        setShopInfo(snapshot.val());
      } else {
        setShopInfo(null);
      }
      setIsLoadingShopInfo(false);
    }, (error) => {
      console.error("Error fetching shop info for login page:", error);
      setIsLoadingShopInfo(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && !authLoading) {
      router.push('/');
    }
  }, [currentUser, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
        setError({ code: "auth/missing-fields", message: "Vui lòng nhập email và mật khẩu." } as any);
        return;
    }
    setIsSubmitting(true);
    const user = await signIn(email, password);
    if (user) {
      router.push('/');
    }
    setIsSubmitting(false);
  };


  if (authLoading && !currentUser) { // Show loading screen only if not yet authenticated
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <LoadingSpinner size={48} className="mb-4" />
            <p className="text-lg text-foreground">Đang tải ứng dụng...</p>
        </div>
    );
  }

  if (currentUser) { // If user is already logged in, redirect
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Đang chuyển hướng...</p>
        </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 h-[200px] w-[200px] text-primary flex items-center justify-center rounded-full bg-primary/10">
            {isLoadingShopInfo ? (
              <Skeleton className="h-[200px] w-[200px] rounded-full" />
            ) : shopInfo?.logoUrl ? (
              <Image
                src={shopInfo.logoUrl}
                alt="Shop Logo"
                width={200}
                height={200}
                className="h-[200px] w-[200px] rounded-full object-contain"
                data-ai-hint="shop logo"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://placehold.co/200x200.png';
                  target.alt = 'Default Shop Logo';
                }}
              />
            ) : (
              <div className="h-[200px] w-[200px] flex items-center justify-center rounded-full bg-primary/10 text-primary">
                 <HomeIcon className="h-24 w-24" /> {/* Adjusted size */}
              </div>
            )}
          </div>
          <CardDescription className="text-2xl font-semibold text-primary">Đăng nhập</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ban@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive-foreground bg-destructive/80 p-3 rounded-md border border-destructive/50">
                {error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
                  ? 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.'
                  : error.message === 'Firebase: Error (auth/network-request-failed).'
                  ? 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.'
                  : error.message}
              </p>
            )}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-3" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size={20} className="mr-2 text-primary-foreground" />
                  Đang đăng nhập...
                </>
              ) : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

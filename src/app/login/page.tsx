
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { ref, onValue } from "firebase/database";
import type { ShopInfo } from '@/types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, currentUser, loading: authLoading, error, setError } = useAuth();
  const router = useRouter();

  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [isLoadingShopInfo, setIsLoadingShopInfo] = useState(true);

  useEffect(() => {
    const shopInfoRef = ref(db, 'shopInfo');
    const unsubscribeShopInfo = onValue(shopInfoRef, (snapshot) => {
      if (snapshot.exists()) {
        setShopInfo(snapshot.val() as ShopInfo);
      } else {
        // Fallback if shopInfo doesn't exist in DB
        setShopInfo({ 
            name: 'Fleur Manager', 
            address: '', 
            phone: '', 
            logoUrl: '', 
            bankAccountName: '', 
            bankAccountNumber: '', 
            bankName: '',
            showShopLogoOnInvoice: true,
            showShopAddressOnInvoice: true,
            showShopPhoneOnInvoice: true,
            showShopBankDetailsOnInvoice: true,
            showEmployeeNameOnInvoice: true,
            invoiceThankYouMessage: "Cảm ơn quý khách đã mua hàng!",
        });
      }
      setIsLoadingShopInfo(false);
    }, (error) => {
      console.error("Error fetching shop info for login page:", error);
      setIsLoadingShopInfo(false);
      // Fallback in case of error
       setShopInfo({ 
            name: 'Fleur Manager', 
            address: '', 
            phone: '', 
            logoUrl: '', 
            bankAccountName: '', 
            bankAccountNumber: '', 
            bankName: '',
            showShopLogoOnInvoice: true,
            showShopAddressOnInvoice: true,
            showShopPhoneOnInvoice: true,
            showShopBankDetailsOnInvoice: true,
            showEmployeeNameOnInvoice: true,
            invoiceThankYouMessage: "Cảm ơn quý khách đã mua hàng!",
        });
    });
    return () => unsubscribeShopInfo();
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
    const user = await signIn(email, password);
    if (user) {
      router.push('/'); 
    }
  };
  
  if (currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Đang chuyển hướng...</p>
        </div>
    );
  }
  
  if ((authLoading && !error) || (!currentUser && authLoading) || (isLoadingShopInfo && !shopInfo)) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <LoadingSpinner size={32} />
            <p className="mt-4 text-lg">Đang tải...</p>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 h-[200px] w-[200px] flex items-center justify-center">
            {isLoadingShopInfo ? (
              <div className="h-full w-full bg-muted/50 rounded-md animate-pulse" />
            ) : (
              <Image
                src={shopInfo?.logoUrl || 'https://placehold.co/200x200.png'}
                alt={shopInfo?.name || "Fleur Manager"}
                width={200}
                height={200}
                className="object-contain rounded-md"
                data-ai-hint="shop logo"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('placehold.co')) {
                      target.src = 'https://placehold.co/200x200.png';
                  }
                  target.alt = 'Placeholder Shop Logo';
                }}
              />
            )}
          </div>
          <CardDescription className="text-2xl font-semibold">Đăng nhập</CardDescription>
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
                  : error.code === 'auth/network-request-failed' 
                  ? 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.'
                  : error.code === 'auth/account-not-approved'
                  ? 'Tài khoản của bạn đang chờ phê duyệt hoặc chưa được kích hoạt.'
                  : error.message}
              </p>
            )}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-3" disabled={authLoading}>
              {authLoading && !error ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

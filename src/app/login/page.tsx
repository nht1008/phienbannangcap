
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
<<<<<<< HEAD
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { ref, onValue } from "firebase/database";
import type { ShopInfo, UserAccessRequest } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { RegistrationRequestDialog } from '@/components/auth/RegistrationRequestDialog'; 
=======
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { HomeIcon } from '@/components/icons/HomeIcon';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { ref, onValue } from "firebase/database";
import type { ShopInfo } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
<<<<<<< HEAD
  const { signIn, currentUser, loading: authLoading, error, setError, sendPasswordResetEmail, signUpAndRequestAccess } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [isLoadingShopInfo, setIsLoadingShopInfo] = useState(true);

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);


  useEffect(() => {
    const shopInfoRef = ref(db, 'shopInfo');
    const unsubscribeShopInfo = onValue(shopInfoRef, (snapshot) => {
      if (snapshot.exists()) {
        setShopInfo(snapshot.val() as ShopInfo);
      } else {
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
=======
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
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740
      }
      setIsLoadingShopInfo(false);
    }, (error) => {
      console.error("Error fetching shop info for login page:", error);
      setIsLoadingShopInfo(false);
<<<<<<< HEAD
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
=======
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && !authLoading) {
      router.push('/');
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740
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
<<<<<<< HEAD
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({ title: "Lỗi", description: "Vui lòng nhập địa chỉ email của bạn.", variant: "destructive" });
      return;
    }
    setIsSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(forgotPasswordEmail);
      toast({ 
        title: "Yêu cầu đã được gửi", 
        description: "Nếu tài khoản của bạn tồn tại, một email đặt lại mật khẩu sẽ được gửi đến. Vui lòng kiểm tra hộp thư (và cả mục Spam).",
        duration: 7000
      });
      setIsForgotPasswordOpen(false);
      setForgotPasswordEmail('');
    } catch (err: any) {
      console.error("Forgot password error:", err); // Added for better debugging
      let errorMessage = "Không thể gửi email đặt lại mật khẩu.";
      if (err.code === 'auth/invalid-email') {
          errorMessage = "Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.";
      } else if (err.code === 'auth/network-request-failed') {
          errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.";
      } else if (err.message) {
          // Keep firebase's message if it's more specific but not one we handle
          errorMessage = err.message;
      }
      toast({ 
          title: "Lỗi gửi email", 
          description: errorMessage, 
          variant: "destructive" 
      });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const handleRegistrationSubmit = async (details: Omit<UserAccessRequest, 'id' | 'status' | 'requestDate' | 'reviewedBy' | 'reviewDate' | 'rejectionReason'> & { password: string }) => {
    try {
      await signUpAndRequestAccess(details);
      toast({
        title: "Yêu cầu đã được gửi",
        description: "Yêu cầu đăng ký khách hàng của bạn đã được gửi. Vui lòng chờ quản trị viên phê duyệt.",
        variant: "default",
      });
      setIsRegistrationDialogOpen(false);
      return true; // Indicate success
    } catch (err: any) {
      let errorMessage = "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.";
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = "Địa chỉ email này đã được sử dụng. Vui lòng sử dụng email khác hoặc thử đăng nhập.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn (ít nhất 6 ký tự).";
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast({
        title: "Lỗi đăng ký",
        description: errorMessage,
        variant: "destructive",
      });
      return false; // Indicate failure
    }
  };
  
  if (currentUser) {
=======
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
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Đang chuyển hướng...</p>
        </div>
    );
  }
<<<<<<< HEAD
  
  if ((authLoading && !error) || (!currentUser && authLoading) || (isLoadingShopInfo && !shopInfo)) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <LoadingSpinner size={32} />
            <p className="mt-4 text-lg">Đang tải...</p>
        </div>
    );
  }
=======
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740

  return (
<<<<<<< HEAD
    <>
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl animate-fadeInUp">
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
                  className="object-contain rounded-md animate-popIn"
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
            <CardTitle className="text-2xl font-semibold">Đăng nhập</CardTitle>
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
                <p className="text-sm text-destructive-foreground bg-destructive/80 p-3 rounded-md border border-destructive/50 animate-shake">
                  {error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
                    ? 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.'
                    : error.code === 'auth/network-request-failed' 
                    ? 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.'
                    : error.code === 'auth/account-not-approved'
                    ? 'Tài khoản của bạn đang chờ phê duyệt hoặc chưa được kích hoạt.'
                     : error.code === 'auth/account-rejected'
                    ? error.message 
                    : error.code === 'auth/no-access-rights'
                    ? error.message
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
            <div className="mt-6 flex flex-col items-center space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
              <Button
                variant="link"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
              >
                Quên mật khẩu?
              </Button>
              <Button
                variant="link"
                onClick={() => setIsRegistrationDialogOpen(true)}
                className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
              >
                Chưa có tài khoản? Đăng ký
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quên mật khẩu</DialogTitle>
            <DialogDescription>
              Nhập địa chỉ email của bạn để nhận hướng dẫn đặt lại mật khẩu.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 py-4">
=======
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
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="ban@email.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                className="text-base"
              />
            </div>
<<<<<<< HEAD
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setIsForgotPasswordOpen(false)} disabled={isSendingResetEmail}>
                Hủy
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSendingResetEmail}>
                {isSendingResetEmail ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi email đặt lại'
                )}
              </Button>
            </DialogFooter>
=======
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
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740
          </form>
        </DialogContent>
      </Dialog>

      <RegistrationRequestDialog
        isOpen={isRegistrationDialogOpen}
        onClose={() => setIsRegistrationDialogOpen(false)}
        onSubmitRegistration={handleRegistrationSubmit}
      />
    </>
  );
}

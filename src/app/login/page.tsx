
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      }
      setIsLoadingShopInfo(false);
    }, (error) => {
      console.error("Error fetching shop info for login page:", error);
      setIsLoadingShopInfo(false);
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

  const handleForgotPasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({ title: "Lỗi", description: "Vui lòng nhập địa chỉ email của bạn.", variant: "destructive" });
      return;
    }
    setIsSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(forgotPasswordEmail);
      toast({ title: "Thành công", description: "Email đặt lại mật khẩu đã được gửi (nếu tài khoản tồn tại). Vui lòng kiểm tra hộp thư của bạn." });
      setIsForgotPasswordOpen(false);
      setForgotPasswordEmail('');
    } catch (err: any) {
      toast({ title: "Lỗi gửi email", description: err.message || "Không thể gửi email đặt lại mật khẩu.", variant: "destructive" });
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

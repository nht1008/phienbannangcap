
"use client";

import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LockKeyhole } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface LockScreenProps {
  isOpen: boolean;
  onUnlock: () => void;
  currentUserEmail: string | null;
  signIn: (email: string, pass: string) => Promise<User | null>;
  currentUserName?: string | null;
}

export function LockScreen({ isOpen, onUnlock, currentUserEmail, signIn, currentUserName }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUserEmail) {
      setError("Không thể xác thực người dùng. Vui lòng thử đăng nhập lại toàn bộ ứng dụng.");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu của bạn.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await signIn(currentUserEmail, password);
      if (user) {
        onUnlock();
        setPassword('');
      } else {
        setError("Mật khẩu không đúng. Vui lòng thử lại.");
      }
    } catch (authError: any) {
      if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        setError("Mật khẩu không đúng. Vui lòng thử lại.");
      } else if (authError.code === 'auth/user-not-found') {
         setError("Tài khoản không tìm thấy. Có thể bạn cần đăng nhập lại toàn bộ ứng dụng.");
      } else if (authError.code === 'auth/network-request-failed') {
        setError("Lỗi kết nối mạng. Vui lòng kiểm tra đường truyền.");
      }
       else {
        setError("Đã xảy ra lỗi không xác định khi mở khóa. Vui lòng thử lại.");
      }
      console.error("Lock screen sign-in error:", authError);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 text-primary flex items-center justify-center rounded-full bg-primary/10">
            <LockKeyhole className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl">Màn hình bị khóa</CardTitle>
          {currentUserName && <CardDescription>Chào {currentUserName}, vui lòng nhập mật khẩu để mở khóa.</CardDescription>}
          {!currentUserName && <CardDescription>Vui lòng nhập mật khẩu để mở khóa.</CardDescription>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="lock-password">Mật khẩu</Label>
              <Input
                id="lock-password"
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
                {error}
              </p>
            )}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-3" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size={20} className="mr-2 text-primary-foreground" />
                  Đang mở khóa...
                </>
              ) : 'Mở khóa'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

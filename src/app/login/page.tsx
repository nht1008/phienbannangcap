
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { HomeIcon } from '@/components/icons/HomeIcon'; // Sử dụng HomeIcon cho logo

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, currentUser, loading, error, setError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser && !loading) {
      router.push('/'); // Chuyển hướng nếu đã đăng nhập
    }
  }, [currentUser, loading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // Xóa lỗi trước đó
    if (!email || !password) {
        setError({ code: "auth/missing-fields", message: "Vui lòng nhập email và mật khẩu." } as any);
        return;
    }
    const user = await signIn(email, password);
    if (user) {
      router.push('/'); // Chuyển hướng sau khi đăng nhập thành công
    }
    // Lỗi sẽ được hiển thị qua state `error`
  };

  // Ngăn việc render form nếu người dùng đã đăng nhập (effect hook sẽ chuyển hướng)
  if (currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Đang chuyển hướng...</p>
        </div>
    );
  }
  
  // Hiển thị loading toàn trang trong khi kiểm tra auth ban đầu
  if (loading && !error) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Đang tải...</p>
        </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 h-20 w-20 text-primary flex items-center justify-center rounded-full bg-primary/10">
            <HomeIcon className="h-10 w-10" />
          </div>
          <CardDescription className="text-lg">Đăng nhập để quản lý cửa hàng</CardDescription>
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
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-3" disabled={loading}>
              {loading && !error ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground mt-4">
          <p>Quên mật khẩu? Liên hệ quản trị viên.</p>
        </CardFooter>
      </Card>
    </div>
  );
}

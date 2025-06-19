
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image'; // Assuming you might want a logo here too eventually
import { ChevronLeft } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 flex items-center justify-center">
             <Image
                src={'https://placehold.co/200x200.png'}
                alt={"Fleur Manager"}
                width={200}
                height={200}
                className="object-contain rounded-md"
                data-ai-hint="shop logo"
                priority
              />
          </div>
          <CardTitle className="text-2xl font-semibold">Đăng ký tài khoản</CardTitle>
          <CardDescription>
            Tính năng đăng ký tài khoản hiện đang được phát triển.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Vui lòng liên hệ quản trị viên để được hỗ trợ tạo tài khoản hoặc quay lại trang đăng nhập.
          </p>
          <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-3">
            <Link href="/login">
              <ChevronLeft className="mr-2 h-5 w-5" />
              Quay lại Đăng nhập
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

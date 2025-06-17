
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store } from 'lucide-react';

export function StorefrontTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center">
          <Store className="mr-2 h-6 w-6 text-primary" />
          Gian hàng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Chức năng quản lý gian hàng (hiển thị sản phẩm cho khách xem) đang được phát triển.
        </p>
        {/* Placeholder content for Storefront Tab */}
      </CardContent>
    </Card>
  );
}

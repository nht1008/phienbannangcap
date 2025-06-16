
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function OrdersTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Quản lý Đơn hàng</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Chức năng quản lý đơn hàng đang được phát triển. Vui lòng quay lại sau!
        </p>
        {/* Placeholder content for Orders Tab */}
      </CardContent>
    </Card>
  );
}

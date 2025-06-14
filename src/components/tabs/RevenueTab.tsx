"use client";

import React, { useMemo } from 'react';
import type { Invoice } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RevenueTabProps {
  invoices: Invoice[];
}

const chartConfig = {
  doanhthu: {
    label: "Doanh thu",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function RevenueTab({ invoices }: RevenueTabProps) {
  const revenueData = useMemo(() => {
    const dataByDay = invoices.reduce((acc, invoice) => {
      const date = new Date(invoice.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += invoice.total;
      return acc;
    }, {} as Record<string, number>);

    // Sort by date for chronological chart, assuming dates are within a reasonable range for string sort
    // For robust sorting, convert keys to Date objects
    return Object.entries(dataByDay)
      .map(([date, doanhthu]) => ({ name: date, doanhthu }))
      .sort((a, b) => {
        const [dayA, monthA] = a.name.split('/').map(Number);
        const [dayB, monthB] = b.name.split('/').map(Number);
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
      });
  }, [invoices]);

  const totalRevenue = useMemo(() => invoices.reduce((sum, inv) => sum + inv.total, 0), [invoices]);
  const totalInvoices = invoices.length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-blue-500/10 border-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-800">Tổng doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{totalRevenue.toLocaleString('vi-VN')} VNĐ</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500">
          <CardHeader>
            <CardTitle className="text-green-800">Tổng số hóa đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">{totalInvoices}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ doanh thu theo ngày</CardTitle>
          <CardDescription>Hiển thị doanh thu hàng ngày của cửa hàng.</CardDescription>
        </CardHeader>
        <CardContent>
          {revenueData.length === 0 ? (
             <p className="text-muted-foreground text-center py-10">Chưa có dữ liệu doanh thu để hiển thị.</p>
          ) : (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <BarChart data={revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('vi-VN').format(value)} tickLine={false} tickMargin={10} axisLine={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent formatter={(value) => `${Number(value).toLocaleString('vi-VN')} VNĐ`} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="doanhthu" fill="var(--color-doanhthu)" radius={4} />
            </BarChart>
          </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import React, { useMemo } from 'react';
import type { Invoice } from '@/types';
import type { DateFilter } from '@/app/page';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";

interface RevenueTabProps {
  invoices: Invoice[];
  filter: DateFilter;
  onFilterChange: (newFilter: DateFilter) => void;
  availableYears: string[];
}

const chartConfig = {
  doanhthu: {
    label: "Doanh thu",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function RevenueTab({ invoices, filter, onFilterChange, availableYears }: RevenueTabProps) {
  const revenueData = useMemo(() => {
    const dataByDay = invoices.reduce((acc, invoice) => {
      const date = new Date(invoice.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += invoice.total;
      return acc;
    }, {} as Record<string, number>);

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
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6 p-4 bg-muted/30 rounded-lg items-end">
        <div>
          <Label htmlFor="revenue-filter-day" className="text-sm">Ngày</Label>
          <Select
            value={filter.day}
            onValueChange={(value) => onFilterChange({ ...filter, day: value })}
          >
            <SelectTrigger id="revenue-filter-day" className="w-full sm:w-28 bg-card h-9">
              <SelectValue placeholder="Ngày" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Array.from({ length: 31 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="revenue-filter-month" className="text-sm">Tháng</Label>
          <Select
            value={filter.month}
            onValueChange={(value) => onFilterChange({ ...filter, month: value })}
          >
            <SelectTrigger id="revenue-filter-month" className="w-full sm:w-32 bg-card h-9">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  Tháng {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="revenue-filter-year" className="text-sm">Năm</Label>
          <Select
            value={filter.year}
            onValueChange={(value) => onFilterChange({ ...filter, year: value })}
          >
            <SelectTrigger id="revenue-filter-year" className="w-full sm:w-32 bg-card h-9">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
            onClick={() => onFilterChange({ day: 'all', month: 'all', year: 'all' })} 
            variant="outline"
            className="h-9"
        >
            Xóa bộ lọc
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-blue-500/10 border-blue-500">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-blue-800">Tổng doanh thu</CardTitle>
            <CardDescription>(Theo bộ lọc)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{totalRevenue.toLocaleString('vi-VN')} VNĐ</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-green-800">Tổng số hóa đơn</CardTitle>
            <CardDescription>(Theo bộ lọc)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">{totalInvoices}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-4xl font-bold">Biểu đồ doanh thu theo ngày</CardTitle>
          <CardDescription>Hiển thị doanh thu hàng ngày của cửa hàng (theo bộ lọc).</CardDescription>
        </CardHeader>
        <CardContent>
          {revenueData.length === 0 ? (
             <p className="text-muted-foreground text-center py-10">Chưa có dữ liệu doanh thu để hiển thị theo bộ lọc đã chọn.</p>
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


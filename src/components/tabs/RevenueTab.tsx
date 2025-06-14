
"use client";

import React, { useMemo, useState } from 'react';
import type { Invoice, CartItem } from '@/types';
import type { DateFilter } from '@/app/page';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';


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
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<Invoice | null>(null);

  const { chartData, chartTitle, chartDescription } = useMemo(() => {
    let newChartTitle = "Biểu đồ doanh thu";
    let newChartDescription = "Hiển thị doanh thu của cửa hàng.";
    let aggregatedData: Record<string, number> = {};
    let finalChartData: { name: string; doanhthu: number }[] = [];

    if (filter.month !== 'all' && filter.year !== 'all') {
        // Specific Month & Specific Year: Daily for that month/year
        newChartTitle = `Doanh thu ngày (Tháng ${filter.month}/${filter.year})`;
        newChartDescription = `Doanh thu hàng ngày cho Tháng ${filter.month}, Năm ${filter.year}.`;
        invoices.forEach(invoice => {
            const dateObj = new Date(invoice.date);
            const dayKey = dateObj.toLocaleDateString('vi-VN', { day: '2-digit' }); 
            aggregatedData[dayKey] = (aggregatedData[dayKey] || 0) + invoice.total;
        });
        finalChartData = Object.entries(aggregatedData)
            .map(([name, doanhthu]) => ({ name: `${name}/${filter.month}`, doanhthu })) 
            .sort((a, b) => parseInt(a.name.split('/')[0]) - parseInt(b.name.split('/')[0]));

    } else if (filter.month === 'all' && filter.year !== 'all') {
        // All Months & Specific Year: Daily for that entire year
        newChartTitle = `Doanh thu ngày (Năm ${filter.year})`;
        newChartDescription = `Doanh thu hàng ngày trong Năm ${filter.year}.`;
        invoices.forEach(invoice => {
            const dateObj = new Date(invoice.date);
            const dayMonthKey = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }); 
            aggregatedData[dayMonthKey] = (aggregatedData[dayMonthKey] || 0) + invoice.total;
        });
        finalChartData = Object.entries(aggregatedData)
            .map(([name, doanhthu]) => ({ name, doanhthu }))
            .sort((a,b) => {
                const [dayA, monthA] = a.name.split('/').map(Number);
                const [dayB, monthB] = b.name.split('/').map(Number);
                if (monthA !== monthB) return monthA - monthB;
                return dayA - dayB;
            });

    } else if (filter.month !== 'all' && filter.year === 'all') {
        // Specific Month & All Years: Daily for that month, aggregated across years
        newChartTitle = `Doanh thu ngày (Tháng ${filter.month}, tổng hợp các năm)`;
        newChartDescription = `Doanh thu hàng ngày cho Tháng ${filter.month}, tổng hợp qua tất cả các năm.`;
        invoices.forEach(invoice => {
            const dateObj = new Date(invoice.date);
            const dayKey = dateObj.toLocaleDateString('vi-VN', { day: '2-digit' }); 
            aggregatedData[dayKey] = (aggregatedData[dayKey] || 0) + invoice.total;
        });
        finalChartData = Object.entries(aggregatedData)
            .map(([name, doanhthu]) => ({ name: `${name}/${filter.month}`, doanhthu })) 
            .sort((a, b) => parseInt(a.name.split('/')[0]) - parseInt(b.name.split('/')[0]));
            
    } else { // All Months & All Years (filter.month === 'all' && filter.year === 'all')
        // Total per year
        newChartTitle = "Doanh thu theo năm";
        newChartDescription = "Tổng doanh thu mỗi năm.";
        invoices.forEach(invoice => {
            const yearKey = new Date(invoice.date).getFullYear().toString();
            aggregatedData[yearKey] = (aggregatedData[yearKey] || 0) + invoice.total;
        });
        finalChartData = Object.entries(aggregatedData)
            .map(([name, doanhthu]) => ({ name, doanhthu }))
            .sort((a,b) => parseInt(a.name) - parseInt(b.name));
    }
    return { chartData: finalChartData, chartTitle: newChartTitle, chartDescription: newChartDescription };
  }, [invoices, filter.month, filter.year]);


  const totalRevenue = useMemo(() => invoices.reduce((sum, inv) => sum + inv.total, 0), [invoices]);
  const totalInvoicesCount = invoices.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6 p-4 bg-muted/30 rounded-lg items-end">
        <div>
          <Label htmlFor="revenue-filter-month" className="text-sm">Tháng</Label>
          <Select
            value={filter.month}
            onValueChange={(value) => onFilterChange({ ...filter, day: 'all', month: value })}
          >
            <SelectTrigger id="revenue-filter-month" className="w-full sm:w-32 bg-card h-9">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tháng</SelectItem>
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
            onValueChange={(value) => onFilterChange({ ...filter, day: 'all', year: value })}
          >
            <SelectTrigger id="revenue-filter-year" className="w-full sm:w-32 bg-card h-9">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả các năm</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
            onClick={() => {
                const now = new Date();
                onFilterChange({ 
                    day: 'all', 
                    month: (now.getMonth() + 1).toString(), 
                    year: now.getFullYear().toString() 
                });
            }}
            variant="outline"
            className="h-9"
        >
            Mặc định (Tháng/Năm hiện tại)
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
            <p className="text-3xl font-bold text-green-900">{totalInvoicesCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-4xl font-bold">{chartTitle}</CardTitle>
          <CardDescription>{chartDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
             <p className="text-muted-foreground text-center py-10">Chưa có dữ liệu doanh thu để hiển thị theo bộ lọc đã chọn.</p>
          ) : (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Chi tiết hóa đơn</CardTitle>
          <CardDescription>(Theo bộ lọc)</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Không có hóa đơn nào để hiển thị theo bộ lọc đã chọn.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.id.substring(0,6)}...</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleString('vi-VN')}</TableCell>
                      <TableCell>{invoice.total.toLocaleString('vi-VN')} VNĐ</TableCell>
                      <TableCell>
                        <Button variant="link" className="p-0 h-auto text-blue-500 hover:text-blue-700" onClick={() => setSelectedInvoiceDetails(invoice)}>Xem</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedInvoiceDetails && (
        <Dialog open={!!selectedInvoiceDetails} onOpenChange={(open) => !open && setSelectedInvoiceDetails(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">Chi tiết hóa đơn #{selectedInvoiceDetails.id.substring(0,6)}...</DialogTitle>
              <DialogDescription>
                <strong>Khách hàng:</strong> {selectedInvoiceDetails.customerName} <br />
                <strong>Ngày:</strong> {new Date(selectedInvoiceDetails.date).toLocaleString('vi-VN')}
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            <ScrollArea className="max-h-60">
              <h4 className="font-semibold mb-2 text-foreground">Sản phẩm đã mua:</h4>
              <ul className="space-y-1 pr-3">
                {selectedInvoiceDetails.items.map((item: CartItem, index: number) => (
                  <li key={`${item.id}-${index}`} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} ({item.color}, {item.size}) x {item.quantityInCart} {item.unit}</span>
                    <span className="text-foreground">{(item.price * item.quantityInCart).toLocaleString('vi-VN')} VNĐ</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            <Separator className="my-4" />
            {selectedInvoiceDetails.discount !== undefined && selectedInvoiceDetails.discount > 0 && (
                <>
                    <div className="flex justify-between text-sm">
                        <span>Giảm giá:</span>
                        <span>-{selectedInvoiceDetails.discount.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <Separator className="my-2" />
                </>
            )}
            <div className="flex justify-between font-bold text-xl text-foreground">
              <span>Tổng cộng:</span>
              <span>{selectedInvoiceDetails.total.toLocaleString('vi-VN')} VNĐ</span>
            </div>
             {selectedInvoiceDetails.amountPaid !== undefined && (
                 <>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-sm">
                        <span>Đã thanh toán ({selectedInvoiceDetails.paymentMethod}):</span>
                        <span>{selectedInvoiceDetails.amountPaid.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    {(selectedInvoiceDetails.amountPaid - selectedInvoiceDetails.total) > 0 && (
                         <div className="flex justify-between text-sm text-green-600">
                            <span>Tiền thừa:</span>
                            <span>{(selectedInvoiceDetails.amountPaid - selectedInvoiceDetails.total).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    )}
                    {selectedInvoiceDetails.debtAmount && selectedInvoiceDetails.debtAmount > 0 && (
                         <div className="flex justify-between text-sm text-red-600">
                            <span>Số tiền nợ:</span>
                            <span>{selectedInvoiceDetails.debtAmount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    )}
                 </>
            )}
            <DialogFooter className="mt-4">
              <Button onClick={() => setSelectedInvoiceDetails(null)} variant="outline" className="w-full">Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


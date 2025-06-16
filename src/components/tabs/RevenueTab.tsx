
"use client";

import React, { useMemo, useState } from 'react';
import type { Invoice, InvoiceCartItem, Product, DisposalLogEntry } from '@/types';
import type { DateFilter } from '@/app/page';
import Image from 'next/image';
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
import { cn } from '@/lib/utils';
import type { NumericDisplaySize } from '@/components/settings/SettingsDialog';
import { Eye } from 'lucide-react';


interface RevenueTabProps {
  invoices: Invoice[];
  inventory: Product[]; 
  disposalLogEntries: DisposalLogEntry[];
  filter: DateFilter;
  onFilterChange: (newFilter: DateFilter) => void;
  availableYears: string[];
  numericDisplaySize: NumericDisplaySize;
}

const chartConfig = {
  doanhthu: {
    label: "Doanh thu",
    color: "hsl(330, 85%, 60%)", 
  },
  giagoc: {
    label: "Giá gốc",
    color: "hsl(270, 70%, 75%)", 
  },
  loinhuan: {
    label: "Lợi nhuận",
    color: "hsl(130, 60%, 55%)", 
  },
} satisfies ChartConfig;

interface AggregatedRevenueData {
  doanhthu: number;
  giagoc: number;
}

const getDaysInMonth = (month: number, year: number): number => { 
    return new Date(year, month, 0).getDate();
};

interface ProductPerformance {
  id: string; 
  key: string; 
  name: string;
  color: string;
  quality?: string;
  size: string;
  unit: string;
  image: string;
  currentStock: number;
  soldInPeriod: number;
  revenueInPeriod: number;
}


export function RevenueTab({ invoices, inventory, disposalLogEntries, filter: filterProp, onFilterChange, availableYears, numericDisplaySize }: RevenueTabProps) {
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<Invoice | null>(null);
  const { month: filterMonth, year: filterYear, day: filterDay } = filterProp;

  const { chartData, chartTitle, chartDescription } = useMemo(() => {
    let newChartTitle = "Biểu đồ doanh thu";
    let newChartDescription = "Hiển thị doanh thu, giá gốc và lợi nhuận của cửa hàng. (Tính tất cả hóa đơn)";
    let aggregatedData: Record<string, AggregatedRevenueData> = {};
    let finalChartData: { name: string; doanhthu: number; giagoc: number; loinhuan: number }[] = [];

    const calculateInvoiceCost = (invoice: Invoice): number => {
        return invoice.items.reduce((sum, item) => sum + (item.costPrice ?? 0) * item.quantityInCart, 0);
    };

    const invoicesForChart = invoices; 

    if (filterMonth !== 'all' && filterYear !== 'all') {
        newChartTitle = `Phân tích ngày (Tháng ${filterMonth}/${filterYear})`;
        newChartDescription = `Doanh thu, giá gốc, lợi nhuận hàng ngày cho Tháng ${filterMonth}, Năm ${filterYear}. Trục X hiển thị ngày. (Tính tất cả hóa đơn)`;

        const yearNum = parseInt(filterYear);
        const monthNum = parseInt(filterMonth);
        const daysInSelectedMonth = getDaysInMonth(monthNum, yearNum);

        for (let day = 1; day <= daysInSelectedMonth; day++) {
            const dayStr = day.toString();
            aggregatedData[dayStr] = { doanhthu: 0, giagoc: 0 };
        }

        invoicesForChart.forEach(invoice => {
            const dateObj = new Date(invoice.date);
            if (dateObj.getFullYear() === yearNum && (dateObj.getMonth() + 1) === monthNum) {
                const dayStr = dateObj.getDate().toString();
                if (aggregatedData[dayStr]) {
                     aggregatedData[dayStr].doanhthu += invoice.total;
                     aggregatedData[dayStr].giagoc += calculateInvoiceCost(invoice);
                }
            }
        });

        finalChartData = Object.entries(aggregatedData)
            .map(([name, data]) => ({
                name: name.padStart(2, '0'),
                doanhthu: data.doanhthu,
                giagoc: data.giagoc,
                loinhuan: data.doanhthu - data.giagoc
            }))
            .sort((a, b) => parseInt(a.name) - parseInt(b.name));

    } else if (filterMonth !== 'all' ) {
        newChartTitle = `Phân tích ngày (Tháng ${filterMonth}, các năm)`;
        newChartDescription = `Tổng hợp doanh thu, giá gốc, lợi nhuận hàng ngày cho Tháng ${filterMonth} qua các năm. (Tính tất cả hóa đơn)`;

        invoicesForChart.forEach(invoice => {
            const dateObj = new Date(invoice.date);
             if ((dateObj.getMonth() + 1) === parseInt(filterMonth)) {
                const dayOfMonth = dateObj.getDate().toString().padStart(2, '0');
                const yearSuffix = filterYear === 'all' ? `/${dateObj.getFullYear().toString().slice(-2)}` : '';
                const nameKey = `${dayOfMonth}${yearSuffix}`;

                if (!aggregatedData[nameKey]) {
                    aggregatedData[nameKey] = { doanhthu: 0, giagoc: 0 };
                }
                aggregatedData[nameKey].doanhthu += invoice.total;
                aggregatedData[nameKey].giagoc += calculateInvoiceCost(invoice);
            }
        });
        finalChartData = Object.entries(aggregatedData)
            .map(([name, data]) => ({
                name,
                doanhthu: data.doanhthu,
                giagoc: data.giagoc,
                loinhuan: data.doanhthu - data.giagoc
            }))
            .sort((a, b) => {
                const [dayA, yearA] = a.name.split('/').map(Number);
                const [dayB, yearB] = b.name.split('/').map(Number);
                if (dayA !== dayB) return dayA - dayB;
                return (yearA || 0) - (yearB || 0);
            });

    } else if (filterMonth === 'all' && filterYear !== 'all') {
        newChartTitle = `Phân tích theo tháng (Năm ${filterYear})`;
        newChartDescription = `Doanh thu, giá gốc, lợi nhuận hàng tháng trong Năm ${filterYear}. (Tính tất cả hóa đơn)`;
        const yearNum = parseInt(filterYear);
        for (let m = 1; m <= 12; m++) {
            const monthKey = m.toString().padStart(2, '0');
            aggregatedData[monthKey] = { doanhthu: 0, giagoc: 0 };
        }

        invoicesForChart.forEach(invoice => {
            const dateObj = new Date(invoice.date);
            if (dateObj.getFullYear() === yearNum) {
                const monthKey = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                if (aggregatedData[monthKey]) {
                    aggregatedData[monthKey].doanhthu += invoice.total;
                    aggregatedData[monthKey].giagoc += calculateInvoiceCost(invoice);
                }
            }
        });
        finalChartData = Object.entries(aggregatedData)
            .map(([name, data]) => ({
                name: `T${name}`,
                doanhthu: data.doanhthu,
                giagoc: data.giagoc,
                loinhuan: data.doanhthu - data.giagoc
            }))
            .sort((a,b) => parseInt(a.name.substring(1)) - parseInt(b.name.substring(1)));

    } else { 
        newChartTitle = "Phân tích theo năm";
        newChartDescription = "Tổng doanh thu, giá gốc và lợi nhuận mỗi năm. (Tính tất cả hóa đơn)";
        invoicesForChart.forEach(invoice => {
            const yearKey = new Date(invoice.date).getFullYear().toString();
            if (!aggregatedData[yearKey]) {
                aggregatedData[yearKey] = { doanhthu: 0, giagoc: 0 };
            }
            aggregatedData[yearKey].doanhthu += invoice.total;
            aggregatedData[yearKey].giagoc += calculateInvoiceCost(invoice);
        });
        finalChartData = Object.entries(aggregatedData)
            .map(([name, data]) => ({ name, doanhthu: data.doanhthu, giagoc: data.giagoc, loinhuan: data.doanhthu - data.giagoc }))
            .sort((a,b) => parseInt(a.name) - parseInt(b.name));
    }
    return { chartData: finalChartData, chartTitle: newChartTitle, chartDescription: newChartDescription };
  }, [invoices, filterMonth, filterYear]);


  const totalRevenue = useMemo(() =>
    invoices.reduce((sum, inv) => sum + inv.total, 0),
    [invoices]
  );

  const totalCostPriceForPeriod = useMemo(() =>
    invoices.reduce((totalCost, invoice) => {
      const invoiceCost = invoice.items.reduce((itemSum, item) => itemSum + (item.costPrice ?? 0) * item.quantityInCart, 0);
      return totalCost + invoiceCost;
    }, 0),
    [invoices]
  );

  const totalProfitForPeriod = useMemo(() => totalRevenue - totalCostPriceForPeriod, [totalRevenue, totalCostPriceForPeriod]);
  
  const totalDiscountForPeriod = useMemo(() =>
    invoices.reduce((totalDiscount, invoice) => {
      const overallDiscount = invoice.discount || 0; // This is now always 0
      const itemDiscounts = invoice.items.reduce((sum, item) => sum + (item.itemDiscount || 0), 0);
      return totalDiscount + overallDiscount + itemDiscounts;
    }, 0),
  [invoices]);

  const totalInvoicesCount = invoices.length;

  const productSalesPerformanceInPeriod = useMemo((): ProductPerformance[] => {
    const salesMap: Record<string, { sold: number; revenue: number; image: string; name: string; color: string; quality?: string; size: string; unit: string; }> = {};

    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const key = `${item.name}-${item.color}-${item.quality || 'N/A'}-${item.size}-${item.unit}`;
        if (!salesMap[key]) {
          salesMap[key] = { sold: 0, revenue: 0, image: item.image, name: item.name, color: item.color, quality: item.quality, size: item.size, unit: item.unit };
        }
        salesMap[key].sold += item.quantityInCart;
        salesMap[key].revenue += (item.price * item.quantityInCart) - (item.itemDiscount || 0);
      });
    });

    return inventory.map(invProduct => {
      const key = `${invProduct.name}-${invProduct.color}-${invProduct.quality || 'N/A'}-${invProduct.size}-${invProduct.unit}`;
      const salesInfo = salesMap[key] || { sold: 0, revenue: 0, image: invProduct.image };
      return {
        id: invProduct.id,
        key,
        name: invProduct.name,
        color: invProduct.color,
        quality: invProduct.quality,
        size: invProduct.size,
        unit: invProduct.unit,
        image: salesInfo.image,
        currentStock: invProduct.quantity,
        soldInPeriod: salesInfo.sold,
        revenueInPeriod: salesInfo.revenue,
      };
    });
  }, [invoices, inventory]);

  const topSellingProducts = useMemo(() => {
    return [...productSalesPerformanceInPeriod]
      .filter(p => p.soldInPeriod > 0)
      .sort((a, b) => b.soldInPeriod - a.soldInPeriod)
      .slice(0, 10);
  }, [productSalesPerformanceInPeriod]);

  const filteredDisposedProducts = useMemo(() => {
    const { day, month, year } = filterProp;
    return disposalLogEntries.filter(entry => {
        const entryDate = new Date(entry.disposalDate);
        const entryDay = entryDate.getDate().toString();
        const entryMonth = (entryDate.getMonth() + 1).toString();
        const entryYear = entryDate.getFullYear().toString();

        const dayMatch = day === 'all' || day === entryDay;
        const monthMatch = month === 'all' || month === entryMonth;
        const yearMatch = year === 'all' || year === entryYear;
        return dayMatch && monthMatch && yearMatch;
    });
  }, [disposalLogEntries, filterProp]);


  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 p-3 bg-muted/30 rounded-lg items-end">
        <div>
          <Label htmlFor="revenue-filter-day" className="text-sm">Ngày</Label>
          <Select
            value={filterDay}
            onValueChange={(value) => onFilterChange({ day: value, month: filterMonth, year: filterYear })}
          >
            <SelectTrigger id="revenue-filter-day" className="w-full sm:w-28 bg-card h-9">
              <SelectValue placeholder="Ngày" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả ngày</SelectItem>
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
            value={filterMonth}
            onValueChange={(value) => onFilterChange({ day: filterDay, month: value, year: filterYear })}
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
            value={filterYear}
            onValueChange={(value) => onFilterChange({ day: filterDay, month: filterMonth, year: value })}
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
                    day: now.getDate().toString(),
                    month: (now.getMonth() + 1).toString(),
                    year: now.getFullYear().toString()
                });
            }}
            variant="outline"
            className="h-9"
        >
            Hôm nay
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-primary/10 border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-primary">Tổng doanh thu</CardTitle>
            <CardDescription className="text-xs">(Tổng giá trị hóa đơn, theo bộ lọc)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={cn("font-bold text-primary", numericDisplaySize)}>{totalRevenue.toLocaleString('vi-VN')} VNĐ</p>
          </CardContent>
        </Card>
        <Card className="bg-chart-2/10 border-[hsl(var(--chart-2))]">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-[hsl(var(--chart-2))]">Tổng giá gốc</CardTitle>
             <CardDescription className="text-xs">(Giá gốc hàng đã bán, theo bộ lọc)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={cn("font-bold text-[hsl(var(--chart-2))]", numericDisplaySize)}>{totalCostPriceForPeriod.toLocaleString('vi-VN')} VNĐ</p>
          </CardContent>
        </Card>
        <Card className="bg-success/10 border-[hsl(var(--success))]">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-[hsl(var(--success))]">Tổng lợi nhuận</CardTitle>
             <CardDescription className="text-xs">(Dựa trên tổng hóa đơn, theo bộ lọc)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={cn("font-bold text-[hsl(var(--success))]", numericDisplaySize)}>{totalProfitForPeriod.toLocaleString('vi-VN')} VNĐ</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-destructive">Tổng giảm giá</CardTitle>
            <CardDescription className="text-xs">(Trên tất cả hóa đơn, theo bộ lọc)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={cn("font-bold text-destructive", numericDisplaySize)}>{totalDiscountForPeriod.toLocaleString('vi-VN')} VNĐ</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/10 border-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-accent">Tổng số hóa đơn</CardTitle>
            <CardDescription className="text-xs">(Theo bộ lọc)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={cn("font-bold text-accent", numericDisplaySize)}>{totalInvoicesCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{chartTitle}</CardTitle>
          <CardDescription>{chartDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
             <p className="text-muted-foreground text-center py-10">Chưa có dữ liệu để hiển thị theo bộ lọc đã chọn.</p>
          ) : (
          <ChartContainer config={chartConfig} className="h-[450px] w-full">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('vi-VN').format(value)} tickLine={false} tickMargin={10} axisLine={false} width={80}/>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent formatter={(value, name) => `${(name === 'doanhthu' ? 'Doanh thu: ' : name === 'giagoc' ? 'Giá gốc: ' : 'Lợi nhuận: ') + Number(value).toLocaleString('vi-VN')} VNĐ`} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="doanhthu" fill="var(--color-doanhthu)" radius={[4, 4, 0, 0]} barSize={25} />
              <Bar dataKey="giagoc" fill="var(--color-giagoc)" radius={[4, 4, 0, 0]} barSize={25} />
              <Bar dataKey="loinhuan" fill="var(--color-loinhuan)" radius={[4, 4, 0, 0]} barSize={25} />
            </BarChart>
          </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Chi tiết hóa đơn</CardTitle>
          <CardDescription>(Tất cả hóa đơn theo bộ lọc)</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Không có hóa đơn nào để hiển thị theo bộ lọc đã chọn.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">STT</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Giờ</TableHead>
                    <TableHead className="text-right">Tổng tiền HĐ</TableHead>
                    <TableHead className="text-right">Tổng giá gốc HĐ</TableHead>
                    <TableHead className="text-right">Lợi nhuận HĐ</TableHead>
                    <TableHead className="text-right text-[hsl(var(--destructive))]">Tiền nợ</TableHead>
                    <TableHead className="text-center">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice, index) => {
                    const hasDebt = invoice.debtAmount && invoice.debtAmount > 0;
                    const actualInvoiceCost = invoice.items.reduce((sum, item) => sum + (item.costPrice ?? 0) * item.quantityInCart, 0);
                    const tableDisplayTotal = invoice.total;
                    const tableDisplayCost = actualInvoiceCost;
                    const tableDisplayProfit = tableDisplayTotal - tableDisplayCost;
                    const invoiceDate = new Date(invoice.date);

                    return (
                      <TableRow key={invoice.id} className={ hasDebt ? 'bg-destructive/5 hover:bg-destructive/10' : ''}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{invoice.id.substring(0,6)}...</TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{invoiceDate.toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell>{invoiceDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</TableCell>
                        <TableCell className="text-right">{tableDisplayTotal.toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell className="text-right">{tableDisplayCost.toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell className="text-right">{tableDisplayProfit.toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell className="text-right text-[hsl(var(--destructive))]">{(invoice.debtAmount ?? 0).toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80" onClick={() => setSelectedInvoiceDetails(invoice)}>
                             <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
              <DialogDescription asChild>
                <div>
                  <div><strong>Khách hàng:</strong> {selectedInvoiceDetails.customerName}</div>
                  <div><strong>Ngày tạo:</strong> {new Date(selectedInvoiceDetails.date).toLocaleDateString('vi-VN')}</div>
                  <div><strong>Giờ tạo:</strong> {new Date(selectedInvoiceDetails.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-3" />
            <ScrollArea className="max-h-60">
              <h4 className="font-semibold mb-2 text-foreground">Sản phẩm đã mua:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Tên Sản phẩm</TableHead>
                    <TableHead>Màu</TableHead>
                    <TableHead>Chất lượng</TableHead>
                    <TableHead>K.Thước</TableHead>
                    <TableHead>ĐV</TableHead>
                    <TableHead className="text-right">SL</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoiceDetails.items.map((item: InvoiceCartItem, idx: number) => (
                    <TableRow key={`${item.id}-${idx}`}>
                      <TableCell className="font-medium text-xs">{item.name}</TableCell>
                      <TableCell className="text-xs">{item.color || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{item.quality || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{item.size || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{item.unit || 'N/A'}</TableCell>
                      <TableCell className="text-right text-xs">{item.quantityInCart}</TableCell>
                      <TableCell className="text-right text-xs">{item.price.toLocaleString('vi-VN')}</TableCell>
                      <TableCell className="text-right font-semibold text-primary text-xs">
                        {(item.price * item.quantityInCart - (item.itemDiscount || 0)).toLocaleString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <Separator className="my-3" />
            {selectedInvoiceDetails.items.reduce((sum, item) => sum + (item.itemDiscount || 0), 0) > 0 && (
                <>
                    <div className="flex justify-between text-sm text-[hsl(var(--destructive))]">
                        <span>Tổng giảm giá SP:</span>
                        <span>-{selectedInvoiceDetails.items.reduce((sum, item) => sum + (item.itemDiscount || 0), 0).toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                </>
            )}
            <div className="flex justify-between font-bold text-lg text-foreground">
              <span>Tổng thanh toán HĐ:</span>
              <span>{selectedInvoiceDetails.total.toLocaleString('vi-VN')} VNĐ</span>
            </div>
             <div className="flex justify-between text-sm">
                <span>Tổng giá gốc hóa đơn:</span>
                <span>
                    {selectedInvoiceDetails.items.reduce((sum, item) => sum + (item.costPrice ?? 0) * item.quantityInCart, 0).toLocaleString('vi-VN')} VNĐ
                </span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-[hsl(var(--success))]">
                <span>Lợi nhuận hóa đơn:</span>
                <span>
                    {(selectedInvoiceDetails.total - selectedInvoiceDetails.items.reduce((sum, item) => sum + (item.costPrice ?? 0) * item.quantityInCart, 0)).toLocaleString('vi-VN')} VNĐ
                </span>
            </div>

             {selectedInvoiceDetails.amountPaid !== undefined && (
                 <>
                    <Separator className="my-3" />
                     <div className={cn(
                          "flex justify-between text-sm",
                           selectedInvoiceDetails.paymentMethod === 'Tiền mặt' &&
                           ((!selectedInvoiceDetails.debtAmount || selectedInvoiceDetails.debtAmount === 0) ? selectedInvoiceDetails.total : (selectedInvoiceDetails.amountPaid ?? 0)) > 0
                           ? 'text-[hsl(var(--success))]' : 'text-foreground'
                        )}>
                        <span>Đã thanh toán ({selectedInvoiceDetails.paymentMethod}):</span>
                        <span>
                            {((!selectedInvoiceDetails.debtAmount || selectedInvoiceDetails.debtAmount === 0)
                              ? selectedInvoiceDetails.total
                              : (selectedInvoiceDetails.amountPaid ?? 0)
                            ).toLocaleString('vi-VN')} VNĐ
                        </span>
                    </div>
                    {((!selectedInvoiceDetails.debtAmount || selectedInvoiceDetails.debtAmount === 0) ? selectedInvoiceDetails.total : (selectedInvoiceDetails.amountPaid ?? 0)) - selectedInvoiceDetails.total > 0 && (
                         <div className="flex justify-between text-sm text-[hsl(var(--success))]">
                            <span>Tiền thừa:</span>
                            <span>{((( !selectedInvoiceDetails.debtAmount || selectedInvoiceDetails.debtAmount === 0) ? selectedInvoiceDetails.total : (selectedInvoiceDetails.amountPaid ?? 0)) - selectedInvoiceDetails.total).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    )}
                    {selectedInvoiceDetails.debtAmount && selectedInvoiceDetails.debtAmount > 0 && (
                         <div className="flex justify-between text-sm text-[hsl(var(--destructive))]">
                            <span>Số tiền nợ của HĐ này:</span>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Top Sản Phẩm Bán Chạy Nhất</CardTitle>
          <CardDescription>Theo số lượng bán trong khoảng thời gian đã lọc. (Tối đa 10 sản phẩm)</CardDescription>
        </CardHeader>
        <CardContent>
          {topSellingProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Không có dữ liệu sản phẩm bán chạy cho khoảng thời gian này.</p>
          ) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">STT</TableHead>
                    <TableHead className="w-20">Ảnh</TableHead>
                    <TableHead>Tên Sản Phẩm</TableHead>
                    <TableHead>Màu</TableHead>
                    <TableHead>Chất lượng</TableHead>
                    <TableHead>K.Thước</TableHead>
                    <TableHead>ĐV</TableHead>
                    <TableHead className="text-right">SL Bán</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSellingProducts.map((product, index) => (
                    <TableRow key={product.key}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Image 
                            src={product.image || `https://placehold.co/40x40.png`} 
                            alt={product.name} 
                            width={40} 
                            height={40} 
                            className="w-10 h-10 rounded-md object-cover aspect-square" 
                            data-ai-hint={`${product.name.split(' ')[0]} flower`}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40.png'; }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.color}</TableCell>
                      <TableCell>{product.quality || 'N/A'}</TableCell>
                      <TableCell>{product.size}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell className="text-right">{product.soldInPeriod}</TableCell>
                      <TableCell className="text-right">{product.revenueInPeriod.toLocaleString('vi-VN')} VNĐ</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Nhật Ký Loại Bỏ Sản Phẩm (Trong Kỳ)</CardTitle>
          <CardDescription>Các sản phẩm đã được loại bỏ khỏi kho trong khoảng thời gian đã lọc, sắp xếp theo ngày loại bỏ mới nhất.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDisposedProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Không có sản phẩm nào được loại bỏ trong kỳ này.</p>
          ) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">STT</TableHead>
                    <TableHead className="w-20">Ảnh</TableHead>
                    <TableHead>Tên Sản Phẩm</TableHead>
                    <TableHead>Chi Tiết SP</TableHead>
                    <TableHead className="text-right">SL Loại Bỏ</TableHead>
                    <TableHead>Lý Do</TableHead>
                    <TableHead>Ngày Loại Bỏ</TableHead>
                    <TableHead>Nhân Viên</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisposedProducts.map((entry, index) => (
                    <TableRow key={entry.id}>
                      <TableCell>{index + 1}</TableCell>
                       <TableCell>
                        <Image 
                            src={entry.image || `https://placehold.co/40x40.png`} 
                            alt={entry.productName} 
                            width={40} 
                            height={40} 
                            className="w-10 h-10 rounded-md object-cover aspect-square" 
                            data-ai-hint={`${entry.productName.split(' ')[0]} flower`}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40.png'; }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{entry.productName}</TableCell>
                      <TableCell className="text-xs">{`${entry.color}, ${entry.quality || 'N/A'}, ${entry.size}, ${entry.unit}`}</TableCell>
                      <TableCell className="text-right">{entry.quantityDisposed}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate" title={entry.reason}>{entry.reason || "Không có"}</TableCell>
                      <TableCell>{new Date(entry.disposalDate).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>{entry.employeeName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    

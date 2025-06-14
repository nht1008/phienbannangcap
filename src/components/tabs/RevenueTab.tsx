
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
import { cn } from '@/lib/utils';


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
  giagoc: {
    label: "Giá gốc",
    color: "hsl(var(--chart-2))",
  },
  loinhuan: {
    label: "Lợi nhuận",
    color: "hsl(var(--success))", // Changed to success for profit
  },
} satisfies ChartConfig;

interface AggregatedRevenueData {
  doanhthu: number;
  giagoc: number;
}

const getDaysInMonth = (month: number, year: number): number => { // month is 1-indexed
    return new Date(year, month, 0).getDate();
};

export function RevenueTab({ invoices, filter: filterProp, onFilterChange, availableYears }: RevenueTabProps) {
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<Invoice | null>(null);
  const { month: filterMonth, year: filterYear } = filterProp;

  const invoicesWithoutDebt = useMemo(() => {
    return invoices.filter(inv => !inv.debtAmount || inv.debtAmount === 0);
  }, [invoices]);

  const { chartData, chartTitle, chartDescription } = useMemo(() => {
    let newChartTitle = "Biểu đồ doanh thu";
    let newChartDescription = "Hiển thị doanh thu, giá gốc và lợi nhuận của cửa hàng.";
    let aggregatedData: Record<string, AggregatedRevenueData> = {};
    let finalChartData: { name: string; doanhthu: number; giagoc: number; loinhuan: number }[] = [];

    const calculateInvoiceCost = (invoice: Invoice): number => {
        return invoice.items.reduce((sum, item) => sum + (item.costPrice ?? 0) * item.quantityInCart, 0);
    };

    if (filterMonth !== 'all' && filterYear !== 'all') { 
        newChartTitle = `Phân tích ngày (Tháng ${filterMonth}/${filterYear})`;
        newChartDescription = `Doanh thu, giá gốc, lợi nhuận hàng ngày cho Tháng ${filterMonth}, Năm ${filterYear}. Trục X hiển thị ngày. (Chỉ tính hóa đơn không có nợ)`;
        
        const yearNum = parseInt(filterYear);
        const monthNum = parseInt(filterMonth); 
        const daysInSelectedMonth = getDaysInMonth(monthNum, yearNum);

        for (let day = 1; day <= daysInSelectedMonth; day++) {
            const dayStr = day.toString(); // Use only day for name "1", "2", etc. for sorting
            aggregatedData[dayStr] = { doanhthu: 0, giagoc: 0 };
        }

        invoices.forEach(invoice => { 
            const dateObj = new Date(invoice.date);
            if (dateObj.getFullYear() === yearNum && (dateObj.getMonth() + 1) === monthNum) {
                const dayStr = dateObj.getDate().toString();
                
                if (aggregatedData[dayStr] && (!invoice.debtAmount || invoice.debtAmount === 0)) { 
                     aggregatedData[dayStr].doanhthu += invoice.total;
                     aggregatedData[dayStr].giagoc += calculateInvoiceCost(invoice);
                }
            }
        });
        
        finalChartData = Object.entries(aggregatedData)
            .map(([name, data]) => ({ 
                name: name.padStart(2, '0'), // Pad day with zero for display "01", "02"
                doanhthu: data.doanhthu, 
                giagoc: data.giagoc, 
                loinhuan: data.doanhthu - data.giagoc 
            }))
            .sort((a, b) => parseInt(a.name) - parseInt(b.name)); 

    } else if (filterMonth !== 'all' /* && filterYear === 'all' - This case is no longer distinct */) { 
        newChartTitle = `Phân tích ngày (Tháng ${filterMonth}, các năm)`;
        newChartDescription = `Tổng hợp doanh thu, giá gốc, lợi nhuận hàng ngày cho Tháng ${filterMonth} qua các năm. (Chỉ tính hóa đơn không có nợ)`;
        
        invoices.forEach(invoice => { 
            const dateObj = new Date(invoice.date);
             if ((dateObj.getMonth() + 1) === parseInt(filterMonth)) { 
                const dayOfMonth = dateObj.getDate().toString().padStart(2, '0'); 
                const yearSuffix = filterYear === 'all' ? `/${dateObj.getFullYear().toString().slice(-2)}` : '';
                const nameKey = `${dayOfMonth}${yearSuffix}`;


                if (!aggregatedData[nameKey]) {
                    aggregatedData[nameKey] = { doanhthu: 0, giagoc: 0 };
                }
                if(!invoice.debtAmount || invoice.debtAmount === 0) {
                    aggregatedData[nameKey].doanhthu += invoice.total;
                    aggregatedData[nameKey].giagoc += calculateInvoiceCost(invoice);
                }
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
        newChartDescription = `Doanh thu, giá gốc, lợi nhuận hàng tháng trong Năm ${filterYear}. (Chỉ tính hóa đơn không có nợ)`;
        const yearNum = parseInt(filterYear);
        for (let m = 1; m <= 12; m++) {
            const monthKey = m.toString().padStart(2, '0');
            aggregatedData[monthKey] = { doanhthu: 0, giagoc: 0 };
        }

        invoices.forEach(invoice => {
            const dateObj = new Date(invoice.date);
            if (dateObj.getFullYear() === yearNum) {
                const monthKey = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                if (aggregatedData[monthKey] && (!invoice.debtAmount || invoice.debtAmount === 0)) {
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
        newChartDescription = "Tổng doanh thu, giá gốc và lợi nhuận mỗi năm. (Chỉ tính hóa đơn không có nợ)";
        invoices.forEach(invoice => {
            const yearKey = new Date(invoice.date).getFullYear().toString();
            if (!aggregatedData[yearKey]) {
                aggregatedData[yearKey] = { doanhthu: 0, giagoc: 0 };
            }
            if(!invoice.debtAmount || invoice.debtAmount === 0) {
                aggregatedData[yearKey].doanhthu += invoice.total;
                aggregatedData[yearKey].giagoc += calculateInvoiceCost(invoice);
            }
        });
        finalChartData = Object.entries(aggregatedData)
            .map(([name, data]) => ({ name, doanhthu: data.doanhthu, giagoc: data.giagoc, loinhuan: data.doanhthu - data.giagoc }))
            .sort((a,b) => parseInt(a.name) - parseInt(b.name));
    }
    return { chartData: finalChartData, chartTitle: newChartTitle, chartDescription: newChartDescription };
  }, [invoices, filterMonth, filterYear]);


  const totalRevenue = useMemo(() => 
    invoicesWithoutDebt.reduce((sum, inv) => sum + inv.total, 0), 
    [invoicesWithoutDebt]
  );

  const totalCostPriceForPeriod = useMemo(() =>
    invoicesWithoutDebt.reduce((totalCost, invoice) => {
      const invoiceCost = invoice.items.reduce((itemSum, item) => itemSum + (item.costPrice ?? 0) * item.quantityInCart, 0);
      return totalCost + invoiceCost;
    }, 0),
    [invoicesWithoutDebt]
  );

  const totalProfitForPeriod = useMemo(() => totalRevenue - totalCostPriceForPeriod, [totalRevenue, totalCostPriceForPeriod]);
  const totalInvoicesCount = invoices.length; 

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 p-3 bg-muted/30 rounded-lg items-end">
        <div>
          <Label htmlFor="revenue-filter-month" className="text-sm">Tháng</Label>
          <Select
            value={filterMonth}
            onValueChange={(value) => onFilterChange({ day: 'all', month: value, year: filterYear })}
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
            onValueChange={(value) => onFilterChange({ day: 'all', month: filterMonth, year: value })}
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
            Tháng này
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/10 border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-primary">Tổng doanh thu</CardTitle>
            <CardDescription className="text-xs">(Đã thu, theo bộ lọc)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{totalRevenue.toLocaleString('vi-VN')} VNĐ</p>
          </CardContent>
        </Card>
        <Card className="bg-chart-2/10 border-[hsl(var(--chart-2))]">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-[hsl(var(--chart-2))]">Tổng giá gốc</CardTitle>
             <CardDescription className="text-xs">(Hàng đã bán, đã thu, theo bộ lọc)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--chart-2))]">{totalCostPriceForPeriod.toLocaleString('vi-VN')} VNĐ</p>
          </CardContent>
        </Card>
        <Card className="bg-success/10 border-[hsl(var(--success))]">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-[hsl(var(--success))]">Tổng lợi nhuận</CardTitle>
             <CardDescription className="text-xs">(Từ doanh thu đã thu, theo bộ lọc)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--success))]">{totalProfitForPeriod.toLocaleString('vi-VN')} VNĐ</p>
          </CardContent>
        </Card>
        <Card className="bg-success/10 border-[hsl(var(--success))]">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-[hsl(var(--success))]">Tổng số hóa đơn</CardTitle>
            <CardDescription className="text-xs">(Theo bộ lọc)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--success))]">{totalInvoicesCount}</p>
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
              <Bar dataKey="doanhthu" fill="var(--color-doanhthu)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="giagoc" fill="var(--color-giagoc)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="loinhuan" fill="var(--color-loinhuan)" radius={[4, 4, 0, 0]} />
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
                    <TableHead>ID</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Tổng tiền HĐ</TableHead>
                    <TableHead className="text-right">Tổng giá gốc HĐ</TableHead>
                    <TableHead className="text-right">Lợi nhuận HĐ</TableHead>
                    <TableHead className="text-right text-[hsl(var(--destructive))]">Tiền nợ</TableHead>
                    <TableHead className="text-center">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(invoice => {
                    const hasDebt = invoice.debtAmount && invoice.debtAmount > 0;
                    const actualInvoiceCost = invoice.items.reduce((sum, item) => sum + (item.costPrice ?? 0) * item.quantityInCart, 0);
                    
                    let displayTotalForTable: number;
                    let displayInvoiceCostForTable: number;
                    let displayInvoiceProfitForTable: number;

                    if (hasDebt) {
                        displayTotalForTable = invoice.amountPaid || 0; 
                        displayInvoiceCostForTable = actualInvoiceCost; 
                        displayInvoiceProfitForTable = (invoice.amountPaid || 0) - actualInvoiceCost;

                    } else { 
                        displayTotalForTable = invoice.total;
                        displayInvoiceCostForTable = actualInvoiceCost;
                        displayInvoiceProfitForTable = invoice.total - actualInvoiceCost;
                    }

                    return (
                      <TableRow key={invoice.id} className={ hasDebt ? 'bg-destructive/5 hover:bg-destructive/10' : ''}>
                        <TableCell>{invoice.id.substring(0,6)}...</TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleString('vi-VN')}</TableCell>
                        <TableCell className="text-right">{displayTotalForTable.toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell className="text-right">{displayInvoiceCostForTable.toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell className="text-right">{displayInvoiceProfitForTable.toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell className="text-right text-[hsl(var(--destructive))]">{(invoice.debtAmount ?? 0).toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell className="text-center">
                          <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80" onClick={() => setSelectedInvoiceDetails(invoice)}>Xem</Button>
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
              <DialogDescription>
                <strong>Khách hàng:</strong> {selectedInvoiceDetails.customerName} <br />
                <strong>Ngày:</strong> {new Date(selectedInvoiceDetails.date).toLocaleString('vi-VN')}
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-3" />
            <ScrollArea className="max-h-60">
              <h4 className="font-semibold mb-2 text-foreground">Sản phẩm đã mua:</h4>
              <ul className="space-y-1 pr-3">
                {selectedInvoiceDetails.items.map((item: CartItem, index: number) => (
                  <li key={`${item.id}-${index}`} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{item.name} ({item.color}, {item.size}) x {item.quantityInCart} {item.unit}</span>
                      <span className="text-foreground">{(item.price * item.quantityInCart).toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground/80 pl-2">Giá gốc đơn vị: {(item.costPrice ?? 0).toLocaleString('vi-VN')} VNĐ</span>
                        <span className="text-muted-foreground/80">Lãi: {((item.price - (item.costPrice ?? 0)) * item.quantityInCart).toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            <Separator className="my-3" />
            {selectedInvoiceDetails.discount !== undefined && selectedInvoiceDetails.discount > 0 && (
                <>
                    <div className="flex justify-between text-sm text-[hsl(var(--destructive))]">
                        <span>Giảm giá:</span>
                        <span>-{selectedInvoiceDetails.discount.toLocaleString('vi-VN')} VNĐ</span>
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
    </div>
  );
}

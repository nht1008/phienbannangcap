
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, Invoice, Debt } from '@/types';
import type { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPhoneNumber, cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { NumericDisplaySize } from '@/components/settings/SettingsDialog';


interface ActivityDateTimeFilter {
  startDate: Date | null;
  endDate: Date | null;
  startHour: string; 
  startMinute: string;
  endHour: string;   
  endMinute: string; 
}

const getCombinedDateTime = (dateInput: Date | null, hourStr: string, minuteStr: string): Date | null => {
    if (!dateInput) return null;
    const newDate = new Date(dateInput);
    const hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const seconds = (minuteStr === '59') ? 59 : 0;
      const milliseconds = (minuteStr === '59') ? 999 : 0;
      newDate.setHours(hours, minutes, seconds, milliseconds);
    }
    return newDate;
};


const filterActivityByDateTimeRange = <T extends { date: string }>(
  data: T[],
  filter: ActivityDateTimeFilter
): T[] => {
  if (!data) return [];
  
  const { startDate, endDate, startHour, startMinute, endHour, endMinute } = filter;

  if (!startDate || !endDate) {
    return data; 
  }
  
  const effectiveStartDate = getCombinedDateTime(startDate, startHour, startMinute);
  const effectiveEndDate = getCombinedDateTime(endDate, endHour, endMinute);

  if (!effectiveStartDate || !effectiveEndDate) return data;

  let finalEffectiveEndDate = effectiveEndDate;
  if (effectiveEndDate < effectiveStartDate && startDate.toDateString() === endDate.toDateString()) {
     const tempEnd = new Date(endDate);
     tempEnd.setHours(23, 59, 59, 999);
     finalEffectiveEndDate = tempEnd;
  }


  return data.filter(item => {
    const itemDateTime = new Date(item.date);
    return itemDateTime >= effectiveStartDate && itemDateTime <= finalEffectiveEndDate;
  });
};


interface EmployeeTabProps {
  employees: Employee[];
  currentUser: User | null;
  invoices: Invoice[];
  debts: Debt[];
  numericDisplaySize: NumericDisplaySize;
  onDeleteDebt: (debtId: string) => void;
}

const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minuteOptionsStart = ['00', '15', '30', '45'];
const minuteOptionsEnd = ['00', '15', '30', '45', '59'];


export function EmployeeTab({ employees, currentUser, invoices, debts, numericDisplaySize, onDeleteDebt }: EmployeeTabProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activityFilter, setActivityFilter] = useState<ActivityDateTimeFilter>(() => {
    const today = new Date();
    return {
      startDate: startOfDay(today),
      endDate: endOfDay(today),
      startHour: '00',
      startMinute: '00',
      endHour: '23',
      endMinute: '59',
    };
  });

  const isAdmin = currentUser?.email === 'nthe1008@gmail.com';

  const displayEmployees = useMemo(() => {
    if (isAdmin) return employees;
    const adminEmployee = employees.find(emp => emp.email === 'nthe1008@gmail.com');
    const selfEmployee = employees.find(emp => emp.id === currentUser?.uid);
    const result = [];
    if (adminEmployee) result.push(adminEmployee);
    if (selfEmployee && selfEmployee.id !== adminEmployee?.id) result.push(selfEmployee);
    return result;
  }, [employees, currentUser, isAdmin]);

  const employeeBaseInvoices = useMemo(() => {
    if (!selectedEmployee) return [];
    return invoices.filter(inv => inv.employeeId === selectedEmployee.id);
  }, [invoices, selectedEmployee]);

  const employeeBaseDebts = useMemo(() => {
    if (!selectedEmployee) return [];
    return debts.filter(debt => 
                        debt.createdEmployeeId === selectedEmployee.id || 
                        debt.lastUpdatedEmployeeId === selectedEmployee.id
                      );
  }, [debts, selectedEmployee]);

  const filteredEmployeeInvoices = useMemo(() => {
    return filterActivityByDateTimeRange(employeeBaseInvoices, activityFilter);
  }, [employeeBaseInvoices, activityFilter]);

  const filteredEmployeeDebts = useMemo(() => {
    return filterActivityByDateTimeRange(employeeBaseDebts, activityFilter);
  }, [employeeBaseDebts, activityFilter]);
  
  const totalSalesByEmployee = useMemo(() => {
    return filteredEmployeeInvoices.reduce((sum, inv) => sum + inv.total, 0);
  }, [filteredEmployeeInvoices]);

  const totalDebtCollectedByEmployee = useMemo(() => {
    if (!selectedEmployee) return 0;
    return filteredEmployeeDebts.reduce((sum, debt) => {
      if (debt.status === 'Đã thanh toán' && debt.lastUpdatedEmployeeId === selectedEmployee.id) {
        return sum + debt.amount;
      }
      return sum;
    }, 0);
  }, [filteredEmployeeDebts, selectedEmployee]);

  const totalDiscountsByEmployee = useMemo(() => {
    return filteredEmployeeInvoices.reduce((sum, inv) => {
      const overallDiscount = inv.discount || 0;
      const itemDiscountsTotal = inv.items.reduce((itemSum, currentItem) => itemSum + (currentItem.itemDiscount || 0), 0);
      return sum + overallDiscount + itemDiscountsTotal;
    }, 0);
  }, [filteredEmployeeInvoices]);

  const totalTransactions = useMemo(() => {
    return totalSalesByEmployee + totalDebtCollectedByEmployee;
  }, [totalSalesByEmployee, totalDebtCollectedByEmployee]);

  const handleSelectEmployee = (employee: Employee) => {
    if (isAdmin || employee.id === currentUser?.uid) {
        setSelectedEmployee(employee);
        const today = new Date();
        setActivityFilter({
          startDate: startOfDay(today),
          endDate: endOfDay(today),
          startHour: '00',
          startMinute: '00',
          endHour: '23',
          endMinute: '59',
        }); 
    } else {
        setSelectedEmployee(null); 
    }
  };

  const handleSetTodayFilter = () => {
    const today = new Date();
    setActivityFilter({
      startDate: startOfDay(today),
      endDate: endOfDay(today),
      startHour: '00',
      startMinute: '00',
      endHour: '23',
      endMinute: '59',
    });
  };

  return (
    <Card> 
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Danh sách Nhân sự</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-6">
        <div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                      Chưa có nhân viên nào trong danh sách.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayEmployees.map(emp => (
                    <TableRow 
                      key={emp.id} 
                      onClick={() => handleSelectEmployee(emp)}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedEmployee?.id === emp.id ? 'bg-primary/10' : ''}`}
                    >
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>{emp.position}</TableCell>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell>{formatPhoneNumber(emp.phone) || 'Chưa cập nhật'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {selectedEmployee && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Nhật ký hoạt động của: {selectedEmployee.name}</CardTitle>
              <CardDescription>Tổng hợp các hóa đơn và công nợ liên quan đến nhân viên này.</CardDescription>
            
              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-2 items-end">
                  <div className="space-y-1">
                    <Label htmlFor="startDate">Từ ngày</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="startDate"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-card h-9",
                            !activityFilter.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {activityFilter.startDate ? format(activityFilter.startDate, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={activityFilter.startDate ?? undefined}
                          onSelect={(date) => setActivityFilter(prev => ({ ...prev, startDate: date ? startOfDay(date) : null }))}
                          initialFocus
                          locale={vi}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="startHour">Giờ bắt đầu</Label>
                    <Select value={activityFilter.startHour} onValueChange={(value) => setActivityFilter(prev => ({...prev, startHour: value}))}>
                      <SelectTrigger id="startHour" className="bg-card h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {hourOptions.map(hour => <SelectItem key={`start-hr-${hour}`} value={hour}>{hour}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="startMinute">Phút bắt đầu</Label>
                    <Select value={activityFilter.startMinute} onValueChange={(value) => setActivityFilter(prev => ({...prev, startMinute: value}))}>
                      <SelectTrigger id="startMinute" className="bg-card h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {minuteOptionsStart.map(min => <SelectItem key={`start-min-${min}`} value={min}>{min}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-2 items-end">
                  <div className="space-y-1">
                    <Label htmlFor="endDate">Đến ngày</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="endDate"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-card h-9",
                            !activityFilter.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {activityFilter.endDate ? format(activityFilter.endDate, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={activityFilter.endDate ?? undefined}
                          onSelect={(date) => setActivityFilter(prev => ({ ...prev, endDate: date ? endOfDay(date) : null }))}
                          disabled={(date) => activityFilter.startDate ? date < activityFilter.startDate : false}
                          initialFocus
                          locale={vi}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endHour">Giờ kết thúc</Label>
                    <Select value={activityFilter.endHour} onValueChange={(value) => setActivityFilter(prev => ({...prev, endHour: value}))}>
                      <SelectTrigger id="endHour" className="bg-card h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {hourOptions.map(hour => <SelectItem key={`end-hr-${hour}`} value={hour}>{hour}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endMinute">Phút kết thúc</Label>
                    <Select value={activityFilter.endMinute} onValueChange={(value) => setActivityFilter(prev => ({...prev, endMinute: value}))}>
                      <SelectTrigger id="endMinute" className="bg-card h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {minuteOptionsEnd.map(min => <SelectItem key={`end-min-${min}`} value={min}>{min}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                    <Button
                    onClick={handleSetTodayFilter}
                    variant="outline"
                    className="h-9 w-full sm:w-auto"
                    >
                    Hôm nay
                    </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="bg-success/10 border-[hsl(var(--success))]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-[hsl(var(--success))]">Tổng tiền bán hàng</CardTitle>
                      <CardDescription className="text-xs">(Tổng giá trị các HĐ do NV này tạo, theo bộ lọc)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className={cn("font-bold text-[hsl(var(--success))]", numericDisplaySize)}>{totalSalesByEmployee.toLocaleString('vi-VN')} VNĐ</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-success/10 border-[hsl(var(--success))]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-[hsl(var(--success))]">Tổng thu nợ</CardTitle>
                      <CardDescription className="text-xs">(Nợ được NV này xử lý "Đã TT", theo bộ lọc ngày tạo nợ)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className={cn("font-bold text-[hsl(var(--success))]", numericDisplaySize)}>{totalDebtCollectedByEmployee.toLocaleString('vi-VN')} VNĐ</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-destructive/10 border-destructive">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-[hsl(var(--destructive))]">Tổng giảm giá</CardTitle>
                      <CardDescription className="text-xs">(Tổng GG chung & GG sản phẩm trên các HĐ do NV này tạo, theo bộ lọc)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className={cn("font-bold text-[hsl(var(--destructive))]", numericDisplaySize)}>{totalDiscountsByEmployee.toLocaleString('vi-VN')} VNĐ</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="col-span-1 sm:col-span-2 md:col-span-3">
                  <Card className="bg-chart-3/10 border-[hsl(var(--chart-3))]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-[hsl(var(--chart-3))]">Tổng giao dịch</CardTitle>
                      <CardDescription className="text-xs">Đây là tổng số tiền mà nhân viên đang cầm (không tính số tiền gốc đã đưa cho)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className={cn("font-bold text-[hsl(var(--chart-3))]", numericDisplaySize)}>{totalTransactions.toLocaleString('vi-VN')} VNĐ</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg text-primary">Hóa đơn đã tạo ({filteredEmployeeInvoices.length})</h3>
                {filteredEmployeeInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có hóa đơn nào phù hợp với bộ lọc.</p>
                ) : (
                <ScrollArea className="h-60 border rounded-md p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">STT</TableHead>
                        <TableHead>ID HĐ</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Giờ</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                        <TableHead className="text-right">Giảm giá</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployeeInvoices.map((invoice, index) => {
                        const invoiceDate = new Date(invoice.date);
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{invoice.id.substring(0, 8)}...</TableCell>
                            <TableCell>{invoice.customerName}</TableCell>
                            <TableCell>{invoiceDate.toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>{invoiceDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                            <TableCell className="text-right">{invoice.total.toLocaleString('vi-VN')} VNĐ</TableCell>
                            <TableCell className="text-right">{(invoice.discount ?? 0).toLocaleString('vi-VN')} VNĐ</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2 text-lg text-primary">Công nợ đã xử lý ({filteredEmployeeDebts.length})</h3>
                 {filteredEmployeeDebts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Không có công nợ nào phù hợp với bộ lọc.</p>
                ) : (
                <ScrollArea className="h-60 border rounded-md p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">STT</TableHead>
                        <TableHead>ID HĐ</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Giờ</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-center">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployeeDebts.map((debt, index) => {
                        const debtDate = new Date(debt.date);
                        return (
                          <TableRow key={debt.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{debt.invoiceId ? `${debt.invoiceId.substring(0, 8)}...` : 'N/A'}</TableCell>
                            <TableCell>{debt.supplier}</TableCell>
                            <TableCell>{debtDate.toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>{debtDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                            <TableCell className="text-right">{debt.amount.toLocaleString('vi-VN')} VNĐ</TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full inline-block text-xs font-medium',
                                  debt.status === 'Chưa thanh toán'
                                    ? 'bg-destructive text-destructive-foreground'
                                    : 'bg-success text-success-foreground'
                                )}
                              >
                                {debt.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-destructive hover:text-destructive/80"
                                  onClick={() => onDeleteDebt(debt.id)}
                                  title="Xóa công nợ"
                              >
                                  <Trash2 className="h-4 w-4"/>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}


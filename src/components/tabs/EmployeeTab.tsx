
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
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { NumericDisplaySize } from '@/components/settings/SettingsDialog';


interface ActivityDateTimeFilter {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

const filterActivityByDateTimeRange = <T extends { date: string }>(
  data: T[],
  filter: ActivityDateTimeFilter
): T[] => {
  if (!data) return [];
  
  const { startDate, endDate, startTime, endTime } = filter;

  if (!startDate || !endDate) {
    return data; 
  }

  const getCombinedDateTime = (dateInput: Date, timeStr: string): Date => {
    const newDate = new Date(dateInput); 
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      newDate.setHours(hours, minutes, timeStr.endsWith(':59') ? 59 : 0, timeStr.endsWith(':59:999') ? 999 : 0);
    }
    return newDate;
  };

  let effectiveStartDate = getCombinedDateTime(startDate, startTime);
  let effectiveEndDate = getCombinedDateTime(endDate, endTime);
  
  if (effectiveEndDate < effectiveStartDate && startDate.toDateString() === endDate.toDateString()) {
     effectiveEndDate = endOfDay(endDate);
  }


  return data.filter(item => {
    const itemDateTime = new Date(item.date);
    return itemDateTime >= effectiveStartDate && itemDateTime <= effectiveEndDate;
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

export function EmployeeTab({ employees, currentUser, invoices, debts, numericDisplaySize, onDeleteDebt }: EmployeeTabProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activityFilter, setActivityFilter] = useState<ActivityDateTimeFilter>(() => {
    const today = new Date();
    return {
      startDate: startOfDay(today),
      endDate: endOfDay(today),
      startTime: '00:00',
      endTime: '23:59',
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

  const handleSelectEmployee = (employee: Employee) => {
    if (isAdmin || employee.id === currentUser?.uid) {
        setSelectedEmployee(employee);
        const today = new Date();
        setActivityFilter({
          startDate: startOfDay(today),
          endDate: endOfDay(today),
          startTime: '00:00',
          endTime: '23:59',
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
      startTime: '00:00',
      endTime: '23:59',
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
            
              <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-1">
                  <Label htmlFor="startDate">Từ ngày</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="startDate"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-card",
                          !activityFilter.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {activityFilter.startDate ? format(activityFilter.startDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
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
                  <Label htmlFor="startTime">Từ giờ</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={activityFilter.startTime}
                    onChange={(e) => setActivityFilter(prev => ({ ...prev, startTime: e.target.value }))}
                    className="bg-card h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDate">Đến ngày</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="endDate"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-card",
                          !activityFilter.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {activityFilter.endDate ? format(activityFilter.endDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
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
                  <Label htmlFor="endTime">Đến giờ</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={activityFilter.endTime}
                    onChange={(e) => setActivityFilter(prev => ({ ...prev, endTime: e.target.value }))}
                    className="bg-card h-9"
                  />
                </div>
                <Button
                  onClick={handleSetTodayFilter}
                  variant="outline"
                  className="h-9 w-full lg:w-auto"
                >
                  Hôm nay
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

              <div>
                <h3 className="font-semibold mb-2 text-lg text-primary">Hóa đơn đã tạo ({filteredEmployeeInvoices.length})</h3>
                {filteredEmployeeInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có hóa đơn nào phù hợp với bộ lọc.</p>
                ) : (
                <ScrollArea className="h-60 border rounded-md p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID HĐ</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Giờ</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                        <TableHead className="text-right">Giảm giá</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployeeInvoices.map(invoice => {
                        const invoiceDate = new Date(invoice.date);
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell>{invoice.id.substring(0, 8)}...</TableCell>
                            <TableCell>{invoice.customerName}</TableCell>
                            <TableCell>{invoiceDate.toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>{invoiceDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</TableCell>
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
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Giờ</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Thực hiện</TableHead>
                        <TableHead className="text-center">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployeeDebts.map(debt => {
                        const debtDate = new Date(debt.date);
                        return (
                          <TableRow key={debt.id}>
                            <TableCell>{debt.supplier}</TableCell>
                            <TableCell>{debtDate.toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>{debtDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</TableCell>
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
                            <TableCell>
                                <div className="flex flex-col text-xs">
                                    {debt.createdEmployeeId === selectedEmployee?.id && debt.lastUpdatedEmployeeId !== selectedEmployee?.id && (
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block">Tạo bởi {debt.createdEmployeeName || 'N/A'}</span>
                                    )}
                                    {debt.lastUpdatedEmployeeId === selectedEmployee?.id && debt.createdEmployeeId !== selectedEmployee?.id && (
                                        <span className="text-xs bg-success/10 text-[hsl(var(--success))] px-2 py-0.5 rounded-full inline-block">Cập nhật bởi {debt.lastUpdatedEmployeeName || 'N/A'}</span>
                                    )}
                                    {debt.lastUpdatedEmployeeId === selectedEmployee?.id && debt.createdEmployeeId === selectedEmployee?.id && (
                                        <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full inline-block">Tạo & Cập nhật</span>
                                    )}
                                    {debt.createdEmployeeId === selectedEmployee?.id && !debt.lastUpdatedEmployeeId && (
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block">Tạo bởi {debt.createdEmployeeName || 'N/A'}</span>
                                    )}
                                </div>
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


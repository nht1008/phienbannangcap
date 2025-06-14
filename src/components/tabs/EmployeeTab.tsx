
"use client";

import React, { useState, useMemo } from 'react';
import type { Employee, Invoice, Debt } from '@/types';
import type { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPhoneNumber } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Định nghĩa DateFilter và các hàm tiện ích liên quan trực tiếp ở đây hoặc import nếu đã chuyển ra utils
interface DateFilter {
  day: string;
  month: string;
  year: string;
}

const getCurrentDateFilter = (includeDay: boolean = true): DateFilter => {
  const now = new Date();
  return {
    day: includeDay ? now.getDate().toString() : 'all',
    month: (now.getMonth() + 1).toString(),
    year: now.getFullYear().toString(),
  };
};

const initialAllDateFilter: DateFilter = { day: 'all', month: 'all', year: 'all' };

const filterDataByDateRange = <T extends { date: string }>(
  data: T[],
  filter: DateFilter
): T[] => {
  if (!data) return [];
  const {day, month, year} = filter;
  return data.filter(item => {
    const itemDate = new Date(item.date);
    const itemDay = itemDate.getDate().toString();
    const itemMonth = (itemDate.getMonth() + 1).toString();
    const itemYear = itemDate.getFullYear().toString();

    const dayMatch = day === 'all' || day === itemDay;
    const monthMatch = month === 'all' || month === itemMonth;
    const yearMatch = year === 'all' || year === itemYear;

    return dayMatch && monthMatch && yearMatch;
  });
};


interface EmployeeTabProps {
  employees: Employee[];
  currentUser: User | null;
  invoices: Invoice[];
  debts: Debt[];
}

export function EmployeeTab({ employees, currentUser, invoices, debts }: EmployeeTabProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activityFilter, setActivityFilter] = useState<DateFilter>(() => getCurrentDateFilter(false)); 

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
    // Debts created OR last updated by the employee
    return debts.filter(debt => 
                        debt.createdEmployeeId === selectedEmployee.id || 
                        debt.lastUpdatedEmployeeId === selectedEmployee.id
                      );
  }, [debts, selectedEmployee]);

  const filteredEmployeeInvoices = useMemo(() => {
    return filterDataByDateRange(employeeBaseInvoices, activityFilter);
  }, [employeeBaseInvoices, activityFilter]);

  const filteredEmployeeDebts = useMemo(() => {
    return filterDataByDateRange(employeeBaseDebts, activityFilter);
  }, [employeeBaseDebts, activityFilter]);
  
  const availableActivityYears = useMemo(() => {
    if (!selectedEmployee) return [new Date().getFullYear().toString()];
    const invoiceYears = new Set(employeeBaseInvoices.map(inv => new Date(inv.date).getFullYear().toString()));
    const debtYears = new Set(employeeBaseDebts.map(debt => new Date(debt.date).getFullYear().toString()));
    const allYears = Array.from(new Set([...invoiceYears, ...debtYears])).sort((a, b) => parseInt(b) - parseInt(a));
    return allYears.length > 0 ? allYears : [new Date().getFullYear().toString()];
  }, [employeeBaseInvoices, employeeBaseDebts, selectedEmployee]);

  const totalSalesByEmployee = useMemo(() => {
    return filteredEmployeeInvoices.reduce((sum, inv) => {
        // Only count sales from invoices that are fully paid (no debtAmount or debtAmount is 0)
        if (!inv.debtAmount || inv.debtAmount === 0) {
            return sum + inv.total;
        }
        return sum;
    }, 0);
  }, [filteredEmployeeInvoices]);

  const totalDebtCollectedByEmployee = useMemo(() => {
    if (!selectedEmployee) return 0;
    return filteredEmployeeDebts.reduce((sum, debt) => {
      if (debt.status === 'Đã thanh toán' && debt.lastUpdatedEmployeeId === selectedEmployee.id) {
        const debtDate = new Date(debt.date);
        const filterYear = parseInt(activityFilter.year);
        const filterMonth = activityFilter.month === 'all' ? null : parseInt(activityFilter.month);
        const filterDay = activityFilter.day === 'all' ? null : parseInt(activityFilter.day);

        const yearMatch = activityFilter.year === 'all' || debtDate.getFullYear() === filterYear;
        const monthMatch = !filterMonth || (debtDate.getMonth() + 1) === filterMonth;
        const dayMatch = !filterDay || debtDate.getDate() === filterDay;

        if (yearMatch && monthMatch && dayMatch) {
          return sum + debt.amount;
        }
      }
      return sum;
    }, 0);
  }, [filteredEmployeeDebts, selectedEmployee, activityFilter]);

  const totalDiscountsByEmployee = useMemo(() => {
    return filteredEmployeeInvoices.reduce((sum, inv) => sum + (inv.discount || 0), 0);
  }, [filteredEmployeeInvoices]);


  const handleSelectEmployee = (employee: Employee) => {
    if (isAdmin || employee.id === currentUser?.uid) {
        setSelectedEmployee(employee);
        setActivityFilter(getCurrentDateFilter(false)); 
    } else {
        setSelectedEmployee(null); 
    }
  };

  const handleActivityFilterChange = (newFilter: Partial<DateFilter>) => {
    setActivityFilter(prev => ({ ...prev, ...newFilter }));
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
            
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t items-end">
                <div>
                  <Label htmlFor="activity-filter-day" className="text-sm">Ngày</Label>
                  <Select
                    value={activityFilter.day}
                    onValueChange={(value) => handleActivityFilterChange({ day: value })}
                  >
                    <SelectTrigger id="activity-filter-day" className="w-full sm:w-28 bg-card h-9">
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
                  <Label htmlFor="activity-filter-month" className="text-sm">Tháng</Label>
                  <Select
                    value={activityFilter.month}
                    onValueChange={(value) => handleActivityFilterChange({ month: value })}
                  >
                    <SelectTrigger id="activity-filter-month" className="w-full sm:w-32 bg-card h-9">
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
                  <Label htmlFor="activity-filter-year" className="text-sm">Năm</Label>
                  <Select
                    value={activityFilter.year}
                    onValueChange={(value) => handleActivityFilterChange({ year: value })}
                  >
                    <SelectTrigger id="activity-filter-year" className="w-full sm:w-32 bg-card h-9">
                      <SelectValue placeholder="Năm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả năm</SelectItem>
                      {availableActivityYears.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => setActivityFilter(getCurrentDateFilter(true))}
                  variant="outline"
                  className="h-9"
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
                    <CardDescription className="text-xs">(HĐ đã thu, do NV này tạo, theo bộ lọc)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-[hsl(var(--success))]">{totalSalesByEmployee.toLocaleString('vi-VN')} VNĐ</p>
                  </CardContent>
                </Card>
                <Card className="bg-success/10 border-[hsl(var(--success))]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-[hsl(var(--success))]">Tổng thu nợ</CardTitle>
                     <CardDescription className="text-xs">(Nợ được NV này xử lý "Đã TT", theo bộ lọc ngày tạo nợ)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-[hsl(var(--success))]">{totalDebtCollectedByEmployee.toLocaleString('vi-VN')} VNĐ</p>
                  </CardContent>
                </Card>
                <Card className="bg-destructive/10 border-destructive">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-[hsl(var(--destructive))]">Tổng giảm giá</CardTitle>
                     <CardDescription className="text-xs">(Trên các HĐ do NV này tạo, theo bộ lọc)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-[hsl(var(--destructive))]">{totalDiscountsByEmployee.toLocaleString('vi-VN')} VNĐ</p>
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
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                        <TableHead className="text-right">Giảm giá</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployeeInvoices.map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.id.substring(0, 8)}...</TableCell>
                          <TableCell>{invoice.customerName}</TableCell>
                          <TableCell>{new Date(invoice.date).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell className="text-right">{invoice.total.toLocaleString('vi-VN')} VNĐ</TableCell>
                          <TableCell className="text-right">{(invoice.discount ?? 0).toLocaleString('vi-VN')} VNĐ</TableCell>
                        </TableRow>
                      ))}
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
                        <TableHead>Ngày tạo nợ</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Vai trò</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployeeDebts.map(debt => (
                        <TableRow key={debt.id}>
                          <TableCell>{debt.supplier}</TableCell>
                          <TableCell>{new Date(debt.date).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell className="text-right">{debt.amount.toLocaleString('vi-VN')} VNĐ</TableCell>
                          <TableCell>{debt.status}</TableCell>
                          <TableCell>
                            {debt.createdEmployeeId === selectedEmployee.id && debt.lastUpdatedEmployeeId !== selectedEmployee.id && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Tạo bởi {debt.createdEmployeeName || 'N/A'}</span>
                            )}
                            {debt.lastUpdatedEmployeeId === selectedEmployee.id && debt.createdEmployeeId !== selectedEmployee.id && (
                                 <span className="text-xs bg-success/10 text-[hsl(var(--success))] px-2 py-0.5 rounded-full">Cập nhật bởi {debt.lastUpdatedEmployeeName || 'N/A'}</span>
                            )}
                            {/* Case where created and last updated by the same selected employee */}
                            {debt.lastUpdatedEmployeeId === selectedEmployee.id && debt.createdEmployeeId === selectedEmployee.id && (
                                 <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">Tạo & Cập nhật</span>
                            )}
                             {/* Case where created by selected employee, but last updated by someone else (or not updated yet) */}
                             {debt.createdEmployeeId === selectedEmployee.id && debt.lastUpdatedEmployeeId !== selectedEmployee.id && !debt.lastUpdatedEmployeeId && (
                                 <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Tạo bởi {debt.createdEmployeeName || 'N/A'}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
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


"use client";

import React, { useState, useMemo } from 'react';
import type { Employee, Invoice, Debt } from '@/types';
import type { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPhoneNumber } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface EmployeeTabProps {
  employees: Employee[];
  currentUser: User | null;
  invoices: Invoice[];
  debts: Debt[];
}

export function EmployeeTab({ employees, currentUser, invoices, debts }: EmployeeTabProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

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

  const employeeInvoices = useMemo(() => {
    if (!selectedEmployee) return [];
    return invoices.filter(inv => inv.employeeId === selectedEmployee.id)
                   .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, selectedEmployee]);

  const employeeDebts = useMemo(() => {
    if (!selectedEmployee) return [];
    // Filter for debts created by or last updated by the selected employee
    return debts.filter(debt => 
                        debt.createdEmployeeId === selectedEmployee.id || 
                        debt.lastUpdatedEmployeeId === selectedEmployee.id
                      )
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [debts, selectedEmployee]);

  const handleSelectEmployee = (employee: Employee) => {
    if (isAdmin || employee.id === currentUser?.uid) {
        setSelectedEmployee(employee);
    } else {
        setSelectedEmployee(null); 
    }
  };

  return (
    <Card> {/* Main Card for the Tab */}
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Danh sách Nhân sự</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-6">
        {/* Employee List Table Section */}
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

        {/* Activity Log Section - Wrapped in its own Card */}
        {selectedEmployee && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Nhật ký hoạt động của: {selectedEmployee.name}</CardTitle>
              <CardDescription>Tổng hợp các hóa đơn và công nợ liên quan đến nhân viên này.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 text-lg text-primary">Hóa đơn đã tạo ({employeeInvoices.length})</h3>
                {employeeInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa tạo hóa đơn nào.</p>
                ) : (
                <ScrollArea className="h-60 border rounded-md p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/4">ID HĐ</TableHead>
                        <TableHead className="w-1/4">Khách hàng</TableHead>
                        <TableHead className="w-1/4">Ngày tạo</TableHead>
                        <TableHead className="w-1/4 text-right">Tổng tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeInvoices.map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.id.substring(0, 8)}...</TableCell>
                          <TableCell>{invoice.customerName}</TableCell>
                          <TableCell>{new Date(invoice.date).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell className="text-right">{invoice.total.toLocaleString('vi-VN')} VNĐ</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2 text-lg text-primary">Công nợ đã xử lý ({employeeDebts.length})</h3>
                 {employeeDebts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa xử lý công nợ nào.</p>
                ) : (
                <ScrollArea className="h-60 border rounded-md p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Đối tượng</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Vai trò</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeDebts.map(debt => (
                        <TableRow key={debt.id}>
                          <TableCell>{debt.supplier}</TableCell>
                          <TableCell>{new Date(debt.date).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell className="text-right">{debt.amount.toLocaleString('vi-VN')} VNĐ</TableCell>
                          <TableCell>{debt.status}</TableCell>
                          <TableCell>
                            {debt.createdEmployeeId === selectedEmployee.id && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Tạo bởi {debt.createdEmployeeName || 'N/A'}</span>
                            )}
                            {debt.lastUpdatedEmployeeId === selectedEmployee.id && debt.createdEmployeeId !== selectedEmployee.id && (
                                 <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Cập nhật bởi {debt.lastUpdatedEmployeeName || 'N/A'}</span>
                            )}
                            {debt.lastUpdatedEmployeeId === selectedEmployee.id && debt.createdEmployeeId === selectedEmployee.id && (
                                 <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Tạo & Cập nhật bởi {debt.lastUpdatedEmployeeName || 'N/A'}</span>
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

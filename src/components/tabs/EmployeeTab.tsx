
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
    if (isAdmin) return employees; // Admin sees all employees as per page.tsx logic
    // Non-admin sees admin and themselves
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
    return debts.filter(debt => debt.createdEmployeeId === selectedEmployee.id || debt.lastUpdatedEmployeeId === selectedEmployee.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [debts, selectedEmployee]);

  const handleSelectEmployee = (employee: Employee) => {
    if (isAdmin || employee.id === currentUser?.uid) {
        setSelectedEmployee(employee);
    } else {
        // Non-admin trying to view details of another non-admin employee (should not happen with current displayEmployees logic)
        setSelectedEmployee(null); 
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Danh sách Nhân sự</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto mt-4">
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
                    className={`cursor-pointer hover:bg-muted/50 ${selectedEmployee?.id === emp.id ? 'bg-muted/50' : ''}`}
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

        {selectedEmployee && (
          <div className="mt-8">
            <Separator />
            <CardHeader className="px-0 pt-6 pb-4">
              <CardTitle className="text-xl font-semibold">Nhật ký hoạt động của: {selectedEmployee.name}</CardTitle>
            </CardHeader>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2 text-lg">Hóa đơn đã tạo ({employeeInvoices.length})</h4>
                {employeeInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa tạo hóa đơn nào.</p>
                ) : (
                <ScrollArea className="h-60 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID HĐ</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeInvoices.map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.id.substring(0, 6)}...</TableCell>
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

              <div>
                <h4 className="font-medium mb-2 text-lg">Công nợ đã xử lý ({employeeDebts.length})</h4>
                 {employeeDebts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa xử lý công nợ nào.</p>
                ) : (
                <ScrollArea className="h-60 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Đối tượng</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Hành động</TableHead>
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
                            {debt.createdEmployeeId === selectedEmployee.id && `Tạo bởi: ${debt.createdEmployeeName || 'Không rõ'}`}
                            {debt.lastUpdatedEmployeeId === selectedEmployee.id && debt.createdEmployeeId !== selectedEmployee.id && `Cập nhật bởi: ${debt.lastUpdatedEmployeeName || 'Không rõ'}`}
                            {debt.lastUpdatedEmployeeId === selectedEmployee.id && debt.createdEmployeeId === selectedEmployee.id && ` (Cập nhật bởi: ${debt.lastUpdatedEmployeeName || 'Không rõ'})`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

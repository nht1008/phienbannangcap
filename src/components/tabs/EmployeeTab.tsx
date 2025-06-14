
"use client";

import React from 'react';
import type { Employee } from '@/types';
import type { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPhoneNumber } from '@/lib/utils';
// Import Button, Input, Dialog etc. if actions like edit/delete are added later
// For now, it's display-only as per current request stage.

interface EmployeeTabProps {
  employees: Employee[];
  currentUser: User | null;
  // onDeleteEmployee?: (employeeId: string) => Promise<void>; // Kept for future, but not used now
  // onUpdateEmployee?: (employeeId: string, updatedData: Partial<Omit<Employee, 'id'>>) => Promise<void>; // Kept for future
}

export function EmployeeTab({ employees, currentUser }: EmployeeTabProps) {
  // const isAdmin = currentUser?.email === 'nthe1008@gmail.com';

  // Logic for edit/delete dialogs and forms would go here if those actions were enabled.
  // Currently, this tab is display-only.

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
                {/* <TableHead className="text-center">Hành động</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                    Chưa có nhân viên nào trong danh sách.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{formatPhoneNumber(emp.phone) || 'Chưa cập nhật'}</TableCell>
                    {/* Actions Cell - Hidden for now
                    <TableCell className="text-center space-x-2">
                      {isAdmin && emp.email !== currentUser?.email && (
                        <>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => {}}>
                              <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => {}}>
                              <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                       {emp.email === currentUser?.email && (
                         <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => {}}>
                            <Pencil className="h-4 w-4" />
                         </Button>
                       )}
                    </TableCell>
                    */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

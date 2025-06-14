
"use client";

import React from 'react';
import type { Employee } from '@/types'; // Giữ lại type Employee nếu cần cho tương lai
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import type { User } from 'firebase/auth';

interface EmployeeTabProps {
  employees: Employee[]; // Sẽ luôn là mảng rỗng
  currentUser: User | null;
  // Không còn các prop onAdd, onUpdate, onDelete
}

export function EmployeeTab({ employees, currentUser }: EmployeeTabProps) {
  // Không còn state và logic quản lý form thêm/sửa/xóa nhân viên

  return (
    <>
      <Card>
        <CardHeader className="p-4">
          <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">Danh sách nhân viên</CardTitle>
              {/* Nút Thêm nhân viên đã được xóa */}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Biểu mẫu thêm nhân viên đã được xóa */}
          
          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Họ và tên</TableCell>
                  <TableCell>Chức vụ</TableCell>
                  <TableCell>Số điện thoại</TableCell>
                  <TableCell>Email</TableCell>
                  {/* Không còn cột Hành động */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Vì employees sẽ luôn rỗng, đoạn map này sẽ không render gì */}
                {employees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>{emp.phone}</TableCell>
                    <TableCell>{emp.email || 'N/A'}</TableCell>
                    {/* Các nút Sửa/Xóa đã được loại bỏ */}
                  </TableRow>
                ))}
                {/* Luôn hiển thị thông báo này vì employees rỗng */}
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                        Chưa có nhân viên nào.
                    </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Các Dialog thêm/sửa/xóa nhân viên đã được loại bỏ */}
    </>
  );
}

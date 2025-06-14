"use client";

import React, { useState } from 'react';
import type { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface EmployeeTabProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

export function EmployeeTab({ employees, setEmployees }: EmployeeTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id'>>({ name: '', position: '', phone: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmp: Employee = {
      id: employees.length > 0 ? Math.max(...employees.map(emp => emp.id)) + 1 : 1,
      ...newEmployee
    };
    setEmployees([...employees, newEmp].sort((a,b) => a.id - b.id));
    setNewEmployee({ name: '', position: '', phone: '' });
    setIsAdding(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>Danh sách nhân viên</CardTitle>
            <Button onClick={() => setIsAdding(!isAdding)} variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isAdding ? 'Hủy' : 'Thêm nhân viên'}
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isAdding && (
          <form onSubmit={handleAddEmployee} className="mb-6 p-4 bg-muted/50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Input type="text" name="name" placeholder="Tên nhân viên" value={newEmployee.name} onChange={handleInputChange} required className="md:col-span-1" />
            <Input type="text" name="position" placeholder="Chức vụ" value={newEmployee.position} onChange={handleInputChange} required className="md:col-span-1" />
            <Input type="tel" name="phone" placeholder="Số điện thoại" value={newEmployee.phone} onChange={handleInputChange} required className="md:col-span-1" />
            <Button type="submit" className="bg-green-500 text-white hover:bg-green-600 h-10">Lưu</Button>
          </form>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Chức vụ</TableHead>
                <TableHead>Số điện thoại</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell>{emp.id}</TableCell>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell>{emp.phone}</TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">Chưa có nhân viên nào.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

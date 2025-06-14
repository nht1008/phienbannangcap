
"use client";

import React, { useState } from 'react';
import type { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from '@/components/ui/textarea';

interface CustomerTabProps {
  customers: Customer[];
  onAddCustomer: (newCustomerData: Omit<Customer, 'id'>) => Promise<void>;
}

export function CustomerTab({ customers, onAddCustomer }: CustomerTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id'>>({ name: '', phone: '', address: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      alert("Vui lòng điền tên và số điện thoại khách hàng.");
      return;
    }
    await onAddCustomer(newCustomer);
    setNewCustomer({ name: '', phone: '', address: '' });
    setIsAdding(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>Danh sách khách hàng</CardTitle>
            <Button onClick={() => setIsAdding(!isAdding)} variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isAdding ? 'Hủy' : 'Thêm khách hàng'}
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isAdding && (
          <form onSubmit={handleAdd} className="mb-6 p-4 bg-muted/50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <Input type="text" name="name" placeholder="Tên khách hàng (*)" value={newCustomer.name} onChange={handleInputChange} required className="md:col-span-1" />
            <Input type="tel" name="phone" placeholder="Số điện thoại (*)" value={newCustomer.phone} onChange={handleInputChange} required className="md:col-span-1" />
            <Textarea name="address" placeholder="Địa chỉ" value={newCustomer.address} onChange={handleInputChange} className="md:col-span-3 h-20 resize-none bg-card" />
            <Button type="submit" className="bg-green-500 text-white hover:bg-green-600 h-10 md:col-start-3 md:justify-self-end w-full md:w-auto">Lưu khách hàng</Button>
          </form>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Địa chỉ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map(customer => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.address || 'N/A'}</TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && !isAdding && (
                <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">Chưa có khách hàng nào.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

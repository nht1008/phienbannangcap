
"use client";

import React, { useState } from 'react';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';

interface InventoryTabProps {
  inventory: Product[];
  onAddProduct: (newProductData: Omit<Product, 'id'>) => Promise<void>;
}

export function InventoryTab({ inventory, onAddProduct }: InventoryTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Omit<Product, 'id' | 'quantity' | 'price'> & { quantity: string; price: string }>({ 
    name: '', quantity: '0', price: '0', image: '', color: '', size: '', unit: '' 
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.unit || parseInt(newItem.quantity) < 0 || parseInt(newItem.price) < 0) {
      // Add more specific validation feedback if needed
      alert("Vui lòng điền đầy đủ thông tin hợp lệ cho sản phẩm.");
      return;
    }
    const newProductData: Omit<Product, 'id'> = {
      name: newItem.name,
      quantity: parseInt(newItem.quantity),
      price: parseInt(newItem.price),
      image: newItem.image || `https://placehold.co/100x100.png`,
      color: newItem.color,
      size: newItem.size,
      unit: newItem.unit,
    };
    await onAddProduct(newProductData);
    setNewItem({ name: '', quantity: '0', price: '0', image: '', color: '', size: '', unit: '' });
    setIsAdding(false);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-foreground">Danh sách sản phẩm</h3>
          <Button onClick={() => setIsAdding(!isAdding)} variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isAdding ? 'Hủy' : 'Thêm sản phẩm mới'}
          </Button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddItem} className="mb-6 p-4 bg-muted/50 rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div><label className="text-sm text-foreground">Tên sản phẩm</label><Input type="text" name="name" placeholder="Hoa hồng" value={newItem.name} onChange={handleInputChange} required /></div>
            <div><label className="text-sm text-foreground">Màu sắc</label><Input type="text" name="color" placeholder="Đỏ" value={newItem.color} onChange={handleInputChange} /></div>
            <div><label className="text-sm text-foreground">Kích thước</label><Input type="text" name="size" placeholder="Lớn" value={newItem.size} onChange={handleInputChange} /></div>
            <div><label className="text-sm text-foreground">Đơn vị</label><Input type="text" name="unit" placeholder="Bông" value={newItem.unit} onChange={handleInputChange} required /></div>
            <div><label className="text-sm text-foreground">Số lượng</label><Input type="number" name="quantity" placeholder="50" value={newItem.quantity} onChange={handleInputChange} required min="0"/></div>
            <div><label className="text-sm text-foreground">Giá bán (VNĐ)</label><Input type="number" name="price" placeholder="10000" value={newItem.price} onChange={handleInputChange} required min="0"/></div>
            <div className="sm:col-span-2"><label className="text-sm text-foreground">URL Hình ảnh (tùy chọn)</label><Input type="text" name="image" placeholder="https://placehold.co/100x100.png" value={newItem.image} onChange={handleInputChange} /></div>
            <Button type="submit" className="bg-green-500 text-white hover:bg-green-600 h-10 md:col-start-4">Lưu sản phẩm</Button>
          </form>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Màu sắc</TableHead>
                <TableHead>Kích thước</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Giá bán (VNĐ)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="flex items-center">
                    <Image 
                        src={item.image || `https://placehold.co/40x40.png`} 
                        alt={item.name} 
                        width={40} 
                        height={40} 
                        className="w-10 h-10 rounded-full object-cover mr-4" 
                        data-ai-hint={`${item.name.split(' ')[0]} flower`}
                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/40x40.png')}
                    />
                    {item.name}
                  </TableCell>
                  <TableCell>{item.color}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.price.toLocaleString('vi-VN')}</TableCell>
                </TableRow>
              ))}
              {inventory.length === 0 && !isAdding && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">Chưa có sản phẩm nào. Hãy thêm sản phẩm mới.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

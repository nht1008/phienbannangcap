
"use client";

import React, { useState } from 'react';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import Image from 'next/image';
import { PlusCircle, Trash2, Settings } from 'lucide-react';

type ProductOptionType = 'colors' | 'sizes' | 'units';

interface InventoryTabProps {
  inventory: Product[];
  onAddProduct: (newProductData: Omit<Product, 'id'>) => Promise<void>;
  colorOptions: string[];
  sizeOptions: string[];
  unitOptions: string[];
  onAddOption: (type: ProductOptionType, name: string) => Promise<void>;
  onDeleteOption: (type: ProductOptionType, name: string) => Promise<void>;
}

export function InventoryTab({ 
  inventory, 
  onAddProduct,
  colorOptions,
  sizeOptions,
  unitOptions,
  onAddOption,
  onDeleteOption 
}: InventoryTabProps) {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newItem, setNewItem] = useState<Omit<Product, 'id' | 'quantity' | 'price'> & { quantity: string; price: string }>({ 
    name: '', quantity: '0', price: '0', image: '', color: '', size: '', unit: '' 
  });

  const [isOptionsDialogOpen, setIsOptionsDialogOpen] = useState(false);
  const [currentOptionType, setCurrentOptionType] = useState<ProductOptionType | null>(null);
  const [newOptionName, setNewOptionName] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.unit || parseInt(newItem.quantity) < 0 || parseInt(newItem.price) < 0) {
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
    setIsAddingProduct(false);
  };

  const openOptionsDialog = (type: ProductOptionType) => {
    setCurrentOptionType(type);
    setIsOptionsDialogOpen(true);
    setNewOptionName('');
  };

  const handleAddNewOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentOptionType && newOptionName.trim()) {
      await onAddOption(currentOptionType, newOptionName.trim());
      setNewOptionName(''); 
      // Dialog remains open for further additions/deletions
    }
  };

  const getOptionsForType = (type: ProductOptionType | null): string[] => {
    if (type === 'colors') return colorOptions;
    if (type === 'sizes') return sizeOptions;
    if (type === 'units') return unitOptions;
    return [];
  };
  
  const getOptionDialogTitle = (type: ProductOptionType | null): string => {
    if (type === 'colors') return 'Quản lý Màu sắc';
    if (type === 'sizes') return 'Quản lý Kích thước';
    if (type === 'units') return 'Quản lý Đơn vị';
    return 'Quản lý tùy chọn';
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Danh sách sản phẩm</CardTitle>
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground">Tên sản phẩm</span>
            <Button onClick={() => openOptionsDialog('colors')} variant="outline">
              <Settings className="mr-2 h-4 w-4" /> Màu sắc
            </Button>
            <Button onClick={() => openOptionsDialog('sizes')} variant="outline">
              <Settings className="mr-2 h-4 w-4" /> Kích thước
            </Button>
            <Button onClick={() => openOptionsDialog('units')} variant="outline">
              <Settings className="mr-2 h-4 w-4" /> Đơn vị
            </Button>
            <Button onClick={() => setIsAddingProduct(!isAddingProduct)} variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> {isAddingProduct ? 'Hủy' : 'Thêm sản phẩm'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isAddingProduct && (
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
              {inventory.length === 0 && !isAddingProduct && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">Chưa có sản phẩm nào. Hãy thêm sản phẩm mới.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {currentOptionType && (
        <Dialog open={isOptionsDialogOpen} onOpenChange={setIsOptionsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{getOptionDialogTitle(currentOptionType)}</DialogTitle>
              <DialogDescription>
                Thêm mới hoặc xóa các tùy chọn {currentOptionType === 'colors' ? 'màu sắc' : currentOptionType === 'sizes' ? 'kích thước' : 'đơn vị'}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddNewOption} className="flex items-center gap-2 mt-4">
              <Input
                type="text"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder={`Tên ${currentOptionType === 'colors' ? 'màu' : currentOptionType === 'sizes' ? 'kích thước' : 'đơn vị'} mới`}
                className="flex-grow"
              />
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground">Thêm</Button>
            </form>
            <div className="mt-4 max-h-60 overflow-y-auto">
              {getOptionsForType(currentOptionType).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Chưa có tùy chọn nào.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên tùy chọn</TableHead>
                      <TableHead className="text-right">Xóa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getOptionsForType(currentOptionType).map(option => (
                      <TableRow key={option}>
                        <TableCell>{option}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => onDeleteOption(currentOptionType, option)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsOptionsDialogOpen(false)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}


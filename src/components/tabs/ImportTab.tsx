"use client";

import React, { useState, useMemo } from 'react';
import type { Product, Debt, Supplier, ItemToImport } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { initialSuppliers } from '@/lib/initial-data'; 
import { NotificationDialog } from '@/components/shared/NotificationDialog';

interface ImportTabProps {
  inventory: Product[];
  setInventory: React.Dispatch<React.SetStateAction<Product[]>>;
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
}

export function ImportTab({ inventory, setInventory, debts, setDebts }: ImportTabProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(initialSuppliers[0].id.toString());
  const [itemsToImport, setItemsToImport] = useState<ItemToImport[]>([{ productId: inventory[0]?.id.toString() || '', quantity: 1, cost: 0 }]);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('error');

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification(message);
    setNotificationType(type);
  };

  const handleItemChange = (index: number, field: keyof ItemToImport, value: string | number) => {
    const newItems = [...itemsToImport];
    if (field === 'quantity' || field === 'cost') {
        newItems[index][field] = Number(value);
    } else {
        newItems[index][field] = value.toString();
    }
    setItemsToImport(newItems);
  };

  const addItemField = () => {
    setItemsToImport([...itemsToImport, { productId: inventory[0]?.id.toString() || '', quantity: 1, cost: 0 }]);
  };

  const totalCost = useMemo(() =>
    itemsToImport.reduce((sum, item) => sum + (item.quantity * item.cost), 0),
    [itemsToImport]
  );

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemsToImport.some(item => !item.productId || item.quantity <= 0 || item.cost < 0)) {
        showNotification('Vui lòng kiểm tra lại thông tin sản phẩm nhập.', 'error');
        return;
    }

    const newInventory = inventory.map(p => ({ ...p })); // Deep copy
    itemsToImport.forEach(importItem => {
      const productIndex = newInventory.findIndex(p => p.id === parseInt(importItem.productId as string));
      if (productIndex !== -1) {
        newInventory[productIndex].quantity += importItem.quantity;
      } else {
        // This case should ideally not happen if product IDs are from existing inventory
        console.error(`Product with ID ${importItem.productId} not found in inventory.`);
      }
    });
    setInventory(newInventory);

    const supplierName = initialSuppliers.find(s => s.id === parseInt(selectedSupplierId))?.name;
    const newDebt: Debt = {
      id: debts.length > 0 ? Math.max(...debts.map(d => d.id)) + 1 : 1,
      supplier: supplierName,
      amount: totalCost,
      date: new Date().toISOString(),
      status: 'Chưa thanh toán'
    };
    setDebts([newDebt, ...debts].sort((a,b) => b.id - a.id));

    setItemsToImport([{ productId: inventory[0]?.id.toString() || '', quantity: 1, cost: 0 }]);
    showNotification('Nhập hàng thành công!', 'success');
  };

  return (
    <>
      <NotificationDialog message={notification} type={notificationType} onClose={() => setNotification(null)} />
      <Card>
        <CardHeader>
            <CardTitle>Tạo phiếu nhập hàng</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleImport} className="space-y-6">
                <div>
                    <label className="block mb-2 font-medium text-foreground">Nhà cung cấp</label>
                    <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn nhà cung cấp" />
                        </SelectTrigger>
                        <SelectContent>
                            {initialSuppliers.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                
                {itemsToImport.map((item, index) => (
                    <Card key={index} className="p-4 bg-muted/50">
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-0">
                            <div>
                                <label className="block mb-1 text-sm text-foreground">Sản phẩm</label>
                                <Select 
                                    value={item.productId.toString()}
                                    onValueChange={value => handleItemChange(index, 'productId', value)}
                                >
                                    <SelectTrigger className="w-full bg-card">
                                        <SelectValue placeholder="Chọn sản phẩm" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {inventory.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.color}, {p.size})</SelectItem>)}
                                         {inventory.length === 0 && <SelectItem value="" disabled>Không có sản phẩm</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm text-foreground">Số lượng</label>
                                <Input 
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                    className="w-full bg-card"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm text-foreground">Giá nhập / đơn vị (VNĐ)</label>
                                <Input 
                                    type="number"
                                    min="0"
                                    value={item.cost}
                                    onChange={e => handleItemChange(index, 'cost', parseFloat(e.target.value))}
                                    className="w-full bg-card"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
                
                <Button type="button" onClick={addItemField} variant="link" className="text-primary hover:text-primary/80 p-0">
                    + Thêm sản phẩm khác
                </Button>

                <div className="text-right font-bold text-xl text-foreground">
                    Tổng tiền: {totalCost.toLocaleString()} VNĐ
                </div>
                
                <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-600">
                    Xác nhận nhập hàng
                </Button>
            </form>
        </CardContent>
      </Card>
    </>
  );
}


"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Product, ItemToImport } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationDialog } from '@/components/shared/NotificationDialog';

interface ImportTabProps {
  inventory: Product[];
  onImportProducts: (supplierName: string | undefined, itemsToImport: ItemToImport[], totalCost: number) => Promise<boolean>;
}

export function ImportTab({ inventory, onImportProducts }: ImportTabProps) {
  const [itemsToImport, setItemsToImport] = useState<ItemToImport[]>([{ productId: inventory[0]?.id || '', quantity: 1, cost: 0 }]);
  
  const [localNotification, setLocalNotification] = useState<string | null>(null);
  const [localNotificationType, setLocalNotificationType] = useState<'success' | 'error'>('error');

  const showLocalNotification = (message: string, type: 'success' | 'error') => {
    setLocalNotification(message);
    setLocalNotificationType(type);
  };

  useEffect(() => {
    if (inventory.length > 0 && itemsToImport.some(item => !item.productId && inventory[0].id)) {
        setItemsToImport(prevItems => prevItems.map(item => item.productId ? item : { ...item, productId: inventory[0].id}));
    } else if (inventory.length === 0 && itemsToImport.some(item => item.productId)) {
        setItemsToImport(prevItems => prevItems.map(item => ({...item, productId: ''})));
    }
  }, [inventory]);


  const handleItemChange = (index: number, field: keyof ItemToImport, value: string | number) => {
    const newItems = [...itemsToImport];
    if (field === 'quantity' || field === 'cost') {
        newItems[index][field] = Number(value) < 0 ? 0 : Number(value) ;
    } else if (field === 'productId') {
        newItems[index][field] = value.toString();
    }
    setItemsToImport(newItems);
  };

  const addItemField = () => {
    if (inventory.length === 0) {
      showLocalNotification("Không có sản phẩm nào trong kho để chọn cho việc nhập hàng.", "error");
      return;
    }
    setItemsToImport([...itemsToImport, { productId: inventory[0]?.id || '', quantity: 1, cost: 0 }]);
  };

  const removeItemField = (index: number) => {
    const newItems = itemsToImport.filter((_, i) => i !== index);
    setItemsToImport(newItems);
  };

  const totalCost = useMemo(() =>
    itemsToImport.reduce((sum, item) => sum + (item.quantity * item.cost), 0),
    [itemsToImport]
  );

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itemsToImport.some(item => !item.productId || item.quantity <= 0 || item.cost < 0)) {
        showLocalNotification('Vui lòng kiểm tra lại thông tin sản phẩm nhập. Mỗi sản phẩm phải có ID, số lượng > 0 và giá >= 0.', 'error');
        return;
    }
     if (itemsToImport.length === 0) {
      showLocalNotification('Vui lòng thêm ít nhất một sản phẩm để nhập hàng.', 'error');
      return;
    }

    const success = await onImportProducts(undefined, itemsToImport, totalCost); // Supplier is now undefined

    if (success) {
      setItemsToImport([{ productId: inventory[0]?.id || '', quantity: 1, cost: 0 }]);
    }
  };

  return (
    <>
      <NotificationDialog message={localNotification} type={localNotificationType} onClose={() => setLocalNotification(null)} />
      <Card>
        <CardHeader>
            <CardTitle>Tạo phiếu nhập hàng</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleImport} className="space-y-6">
                {/* Supplier selection removed */}
                
                {itemsToImport.map((item, index) => (
                    <Card key={index} className="p-4 bg-muted/50 relative">
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-0">
                            <div>
                                <label className="block mb-1 text-sm text-foreground">Sản phẩm</label>
                                <Select
                                    value={item.productId}
                                    onValueChange={value => handleItemChange(index, 'productId', value)}
                                    disabled={inventory.length === 0}
                                >
                                    <SelectTrigger className="w-full bg-card">
                                        <SelectValue placeholder="Chọn sản phẩm" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {inventory.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.color}, {p.size})</SelectItem>)}
                                        {inventory.length === 0 && 
                                            <div className="p-2 text-center text-muted-foreground">Không có sản phẩm trong kho.</div>
                                        }
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm text-foreground">Số lượng</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity.toString()}
                                    onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                    className="w-full bg-card"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm text-foreground">Giá nhập / đơn vị (VNĐ)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={item.cost.toString()}
                                    onChange={e => handleItemChange(index, 'cost', parseFloat(e.target.value))}
                                    className="w-full bg-card"
                                    required
                                />
                            </div>
                        </CardContent>
                        {itemsToImport.length > 1 && (
                            <Button
                                type="button"
                                onClick={() => removeItemField(index)}
                                variant="ghost"
                                size="sm"
                                className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                            >
                                Xóa
                            </Button>
                        )}
                    </Card>
                ))}
                
                <Button type="button" onClick={addItemField} variant="link" className="text-primary hover:text-primary/80 p-0" disabled={inventory.length === 0}>
                    + Thêm sản phẩm khác
                </Button>

                <div className="text-right font-bold text-xl text-foreground">
                    Tổng tiền: {totalCost.toLocaleString('vi-VN')} VNĐ
                </div>
                
                <Button 
                    type="submit" 
                    className="w-full bg-blue-500 text-white hover:bg-blue-600" 
                    disabled={inventory.length === 0 || itemsToImport.length === 0 || itemsToImport.some(item => !item.productId)}
                >
                    Xác nhận nhập hàng
                </Button>
            </form>
        </CardContent>
      </Card>
    </>
  );
}

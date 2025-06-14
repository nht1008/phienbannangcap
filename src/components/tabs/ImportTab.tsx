
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Product } from '@/types'; // Removed ItemToImport from here, will define locally
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationDialog } from '@/components/shared/NotificationDialog';
import { Trash2 } from 'lucide-react';

// Local interface for items in the import list within this component
interface LocalItemToImport {
  key: string; // Unique key for React list rendering
  name: string;
  color: string;
  size: string;
  unit: string;
  quantity: number;
  cost: number; // Nghin VND
  productId?: string | null; // Store resolved product ID, null if no match, undefined if not checked
  error?: string; // Error message if product combination not found
}

// Type for items to be submitted to the parent handler
interface SubmitItemToImport {
  productId: string;
  quantity: number;
  cost: number; // Nghin VND
}


interface ImportTabProps {
  inventory: Product[];
  onImportProducts: (supplierName: string | undefined, itemsToSubmit: SubmitItemToImport[], totalCostVND: number) => Promise<boolean>;
  productNameOptions: string[];
  colorOptions: string[];
  sizeOptions: string[];
  unitOptions: string[];
}

const createNewImportItem = (
    productNameOptions: string[], 
    colorOptions: string[], 
    sizeOptions: string[], 
    unitOptions: string[]
): LocalItemToImport => ({
    key: Date.now().toString() + Math.random().toString(36).substring(2, 7),
    name: productNameOptions[0] || '',
    color: colorOptions[0] || '',
    size: sizeOptions[0] || '',
    unit: unitOptions[0] || '',
    quantity: 1,
    cost: 0,
    productId: undefined,
    error: undefined,
});


export function ImportTab({ 
    inventory, 
    onImportProducts,
    productNameOptions,
    colorOptions,
    sizeOptions,
    unitOptions 
}: ImportTabProps) {
  const [itemsToImport, setItemsToImport] = useState<LocalItemToImport[]>(() => [
    createNewImportItem(productNameOptions, colorOptions, sizeOptions, unitOptions)
  ]);
  
  const [localNotification, setLocalNotification] = useState<string | null>(null);
  const [localNotificationType, setLocalNotificationType] = useState<'success' | 'error'>('error');

  const showLocalNotification = (message: string, type: 'success' | 'error') => {
    setLocalNotification(message);
    setLocalNotificationType(type);
  };

  // Effect to re-initialize if options become available after initial render
  useEffect(() => {
    if (itemsToImport.length === 1 && itemsToImport[0].name === '' && productNameOptions.length > 0) {
        setItemsToImport([createNewImportItem(productNameOptions, colorOptions, sizeOptions, unitOptions)]);
    }
  }, [productNameOptions, colorOptions, sizeOptions, unitOptions]);


  const findMatchingProduct = useCallback((item: Omit<LocalItemToImport, 'key' | 'quantity' | 'cost' | 'productId' | 'error'>) => {
    if (!item.name || !item.color || !item.size || !item.unit) return null;
    return inventory.find(p => 
      p.name === item.name && 
      p.color === item.color && 
      p.size === item.size && 
      p.unit === item.unit
    );
  }, [inventory]);

  useEffect(() => {
    setItemsToImport(prevItems => 
      prevItems.map(item => {
        if (item.productId === undefined || item.error === undefined) { // only re-check if not explicitly set or on attribute change
          const matchedProduct = findMatchingProduct(item);
          if (matchedProduct) {
            return { ...item, productId: matchedProduct.id, error: undefined };
          } else if (item.name && item.color && item.size && item.unit) { // Only show error if all attributes are selected
            return { ...item, productId: null, error: 'Sản phẩm không tồn tại trong kho.' };
          }
        }
        return item; // No change or error already set
      })
    );
  }, [itemsToImport.map(i => `${i.name}-${i.color}-${i.size}-${i.unit}`).join(','), inventory, findMatchingProduct]);


  const handleItemChange = (index: number, field: keyof Omit<LocalItemToImport, 'key' | 'productId' | 'error'>, value: string | number) => {
    setItemsToImport(prevItems => 
        prevItems.map((item, i) => {
            if (i === index) {
                const updatedItem = { ...item, [field]: value };
                 if (field === 'quantity') {
                    updatedItem[field] = Number(value) < 0 ? 0 : Number(value) ;
                } else if (field === 'cost') {
                    updatedItem[field] = Number(value) < 0 ? 0 : parseFloat(value.toString()) ;
                }

                // If attributes change, reset productId and error to trigger re-validation
                if (['name', 'color', 'size', 'unit'].includes(field)) {
                    updatedItem.productId = undefined; // Mark for re-check
                    updatedItem.error = undefined;
                }
                return updatedItem;
            }
            return item;
        })
    );
  };

  const addItemField = () => {
    if (inventory.length === 0) {
      showLocalNotification("Không có sản phẩm nào trong kho để chọn cho việc nhập hàng.", "error");
      return;
    }
    setItemsToImport(prev => [...prev, createNewImportItem(productNameOptions, colorOptions, sizeOptions, unitOptions)]);
  };

  const removeItemField = (keyToRemove: string) => {
    setItemsToImport(prevItems => prevItems.filter(item => item.key !== keyToRemove));
  };

  const totalCostVND = useMemo(() =>
    itemsToImport.reduce((sum, item) => sum + (item.quantity * item.cost * 1000), 0),
    [itemsToImport]
  );

  const canConfirmImport = useMemo(() => {
    if (inventory.length === 0 || itemsToImport.length === 0) return false;
    return itemsToImport.every(item => item.productId && !item.error && item.quantity > 0 && item.cost >= 0);
  }, [itemsToImport, inventory.length]);


  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canConfirmImport) {
        const firstErrorItem = itemsToImport.find(item => item.error || !item.productId || item.quantity <= 0 || item.cost < 0);
        if (firstErrorItem?.error) {
            showLocalNotification(`Lỗi ở một sản phẩm: ${firstErrorItem.error} Vui lòng kiểm tra lại.`, 'error');
        } else if (itemsToImport.some(item => item.quantity <= 0 || item.cost < 0)) {
             showLocalNotification('Số lượng phải > 0 và giá nhập phải >= 0 cho tất cả sản phẩm.', 'error');
        }
         else if (itemsToImport.some(item => !item.productId && item.name && item.color && item.size && item.unit)) {
            showLocalNotification('Một hoặc nhiều sản phẩm không tồn tại trong kho. Vui lòng kiểm tra lại.', 'error');
        } else if (itemsToImport.length === 0) {
            showLocalNotification('Vui lòng thêm ít nhất một sản phẩm để nhập hàng.', 'error');
        } else {
            showLocalNotification('Vui lòng kiểm tra lại thông tin các sản phẩm nhập.', 'error');
        }
        return;
    }

    const itemsToSubmit: SubmitItemToImport[] = itemsToImport
      .filter(item => item.productId) // Should be redundant due to canConfirmImport check
      .map(item => ({
        productId: item.productId!,
        quantity: item.quantity,
        cost: item.cost, // cost is in Nghin VND
      }));

    const success = await onImportProducts(undefined, itemsToSubmit, totalCostVND); 

    if (success) {
      setItemsToImport([createNewImportItem(productNameOptions, colorOptions, sizeOptions, unitOptions)]);
    }
  };

  const allOptionsExist = productNameOptions.length > 0 && colorOptions.length > 0 && sizeOptions.length > 0 && unitOptions.length > 0;

  return (
    <>
      <NotificationDialog message={localNotification} type={localNotificationType} onClose={() => setLocalNotification(null)} />
      <Card>
        <CardHeader>
            <CardTitle className="text-4xl font-bold">Tạo phiếu nhập hàng</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleImport} className="space-y-6">
                
                {itemsToImport.map((item, index) => (
                    <Card key={item.key} className="p-4 bg-muted/50 relative">
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-0">
                            <div>
                                <label className="block mb-1 text-sm text-foreground">Tên sản phẩm (*)</label>
                                <Select value={item.name} onValueChange={value => handleItemChange(index, 'name', value)} disabled={productNameOptions.length === 0}>
                                    <SelectTrigger className="w-full bg-card"><SelectValue placeholder="Chọn tên" /></SelectTrigger>
                                    <SelectContent>{productNameOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                             <div>
                                <label className="block mb-1 text-sm text-foreground">Màu sắc (*)</label>
                                <Select value={item.color} onValueChange={value => handleItemChange(index, 'color', value)} disabled={colorOptions.length === 0}>
                                    <SelectTrigger className="w-full bg-card"><SelectValue placeholder="Chọn màu" /></SelectTrigger>
                                    <SelectContent>{colorOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm text-foreground">Kích thước (*)</label>
                                <Select value={item.size} onValueChange={value => handleItemChange(index, 'size', value)} disabled={sizeOptions.length === 0}>
                                    <SelectTrigger className="w-full bg-card"><SelectValue placeholder="Chọn kích thước" /></SelectTrigger>
                                    <SelectContent>{sizeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm text-foreground">Đơn vị (*)</label>
                                <Select value={item.unit} onValueChange={value => handleItemChange(index, 'unit', value)} disabled={unitOptions.length === 0}>
                                    <SelectTrigger className="w-full bg-card"><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger>
                                    <SelectContent>{unitOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm text-foreground">Số lượng (*)</label>
                                <Input type="number" min="1" value={item.quantity.toString()} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} className="w-full bg-card" required/>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm text-foreground">Giá nhập / đơn vị (Nghìn VND) (*)</label>
                                <Input type="number" min="0" step="any" value={item.cost.toString()} onChange={e => handleItemChange(index, 'cost', parseFloat(e.target.value))} className="w-full bg-card" required/>
                            </div>
                        </CardContent>
                        {item.error && <p className="text-xs text-red-500 mt-1 px-1">{item.error}</p>}
                        {itemsToImport.length > 1 && (
                            <Button
                                type="button"
                                onClick={() => removeItemField(item.key)}
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 text-red-500 hover:text-red-700 h-7 w-7"
                            >
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        )}
                    </Card>
                ))}
                
                <Button
                    type="button"
                    onClick={addItemField}
                    variant="outline"
                    className="w-full mt-4"
                    disabled={!allOptionsExist || inventory.length === 0}
                >
                   + Thêm dòng sản phẩm nhập
                </Button>
                {!allOptionsExist && inventory.length > 0 && (
                     <p className="text-xs text-center text-muted-foreground">Vui lòng định nghĩa đầy đủ các tùy chọn (Tên SP, Màu, Kích thước, Đơn vị) trong tab Kho hàng trước.</p>
                )}
                {inventory.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground">Vui lòng thêm sản phẩm vào kho hàng trước khi nhập hàng.</p>
                )}


                <div className="mt-6 text-right font-bold text-xl text-foreground">
                    Tổng tiền: {totalCostVND.toLocaleString('vi-VN')} VNĐ
                </div>
                
                <Button 
                    type="submit" 
                    className="w-full bg-blue-500 text-white hover:bg-blue-600" 
                    disabled={!canConfirmImport}
                >
                    Xác nhận nhập hàng
                </Button>
            </form>
        </CardContent>
      </Card>
    </>
  );
}


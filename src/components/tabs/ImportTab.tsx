
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Product } from '@/types';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationDialog } from '@/components/shared/NotificationDialog';
import { Trash2 } from 'lucide-react';

interface LocalItemToImport {
  key: string;
  name: string;
  color: string;
  size: string;
  unit: string;
  quantity: number;
  cost: number;
  productId?: string | null; // undefined: not yet processed, null: processed and not found, string: processed and found
  error?: string;
}

interface SubmitItemToImport {
  productId: string;
  quantity: number;
  cost: number;
}


interface ImportTabProps {
  inventory: Product[];
  onImportProducts: (
    supplierName: string | undefined,
    itemsToSubmit: SubmitItemToImport[],
    totalCostVND: number,
    employeeId: string,
    employeeName: string
  ) => Promise<boolean>;
  productNameOptions: string[];
  colorOptions: string[];
  sizeOptions: string[];
  unitOptions: string[];
  currentUser: User | null;
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
    productId: undefined, // Needs to be calculated
    error: undefined,
});


export function ImportTab({
    inventory,
    onImportProducts,
    productNameOptions,
    colorOptions,
    sizeOptions,
    unitOptions,
    currentUser
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

  useEffect(() => {
    // Initialize or reset the first item if options become available and it's still in a default "empty" state
    if (
      itemsToImport.length === 1 &&
      itemsToImport[0].name === '' && // Check against default empty name
      (productNameOptions.length > 0 || colorOptions.length > 0 || sizeOptions.length > 0 || unitOptions.length > 0)
    ) {
        const firstItemIsEmptyAndDefault =
            itemsToImport[0].name === '' &&
            itemsToImport[0].color === '' &&
            itemsToImport[0].size === '' &&
            itemsToImport[0].unit === '';

        if (firstItemIsEmptyAndDefault) {
             setItemsToImport([createNewImportItem(productNameOptions, colorOptions, sizeOptions, unitOptions)]);
        }
    }
  }, [productNameOptions, colorOptions, sizeOptions, unitOptions, itemsToImport]);


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
    const nextItemsToImport = itemsToImport.map(item => {
      // Determine new productId and error based on current item attributes and inventory
      const matchedProduct = findMatchingProduct(item);
      const newProductId = matchedProduct ? matchedProduct.id : null;
      const newError = (item.name && item.color && item.size && item.unit && !matchedProduct)
        ? 'Sản phẩm không tồn tại trong kho.'
        : undefined;

      // If the derived productId or error is different from the current one,
      // it means this item needs to be updated. Return a new object.
      if (item.productId !== newProductId || item.error !== newError) {
        return { ...item, productId: newProductId, error: newError };
      }

      // Otherwise, no change for this item, so return the original object
      // to maintain reference equality if possible.
      return item;
    });

    // Check if any item object reference has changed, or if array length changed.
    // This implies that at least one item's data (productId or error) actually changed.
    let hasStateChanged = false;
    if (nextItemsToImport.length !== itemsToImport.length) {
      hasStateChanged = true;
    } else {
      for (let i = 0; i < nextItemsToImport.length; i++) {
        if (nextItemsToImport[i] !== itemsToImport[i]) { // Reference check
          hasStateChanged = true;
          break;
        }
      }
    }

    if (hasStateChanged) {
      setItemsToImport(nextItemsToImport);
    }
  }, [itemsToImport, inventory, findMatchingProduct]);


  const handleItemChange = (index: number, field: keyof Omit<LocalItemToImport, 'key' | 'productId' | 'error'>, value: string | number) => {
    setItemsToImport(prevItems =>
        prevItems.map((item, i) => {
            if (i === index) {
                const updatedItemBase = { ...item, [field]: value };
                 if (field === 'quantity') {
                    updatedItemBase[field] = Number(value) < 0 ? 0 : Number(value) ;
                } else if (field === 'cost') {
                    updatedItemBase[field] = Number(value) < 0 ? 0 : parseFloat(value.toString()) ;
                }

                // When identifying attributes change, mark productId as undefined to force recalculation by useEffect
                if (['name', 'color', 'size', 'unit'].includes(field)) {
                    return { ...updatedItemBase, productId: undefined, error: undefined };
                }
                return updatedItemBase;
            }
            return item;
        })
    );
  };

  const addItemField = () => {
    if (inventory.length === 0 && productNameOptions.length === 0) { // Adjusted condition
      showLocalNotification("Vui lòng thêm sản phẩm và các tùy chọn sản phẩm trong tab Kho hàng trước.", "error");
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
    if (itemsToImport.length === 0) return false;
    return itemsToImport.every(item => item.productId && !item.error && item.quantity > 0 && item.cost >= 0);
  }, [itemsToImport]);


  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showLocalNotification("Không tìm thấy thông tin người dùng. Vui lòng thử đăng nhập lại.", "error");
      return;
    }

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
      .filter(item => item.productId)
      .map(item => ({
        productId: item.productId!,
        quantity: item.quantity,
        cost: item.cost,
      }));

    const success = await onImportProducts(
        undefined,
        itemsToSubmit,
        totalCostVND,
        currentUser.uid,
        currentUser.displayName || currentUser.email || "Không rõ"
    );

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
                    disabled={!allOptionsExist && inventory.length === 0}
                >
                   + Thêm dòng sản phẩm nhập
                </Button>
                {!allOptionsExist && inventory.length > 0 && (
                     <p className="text-xs text-center text-muted-foreground">Vui lòng định nghĩa đầy đủ các tùy chọn (Tên SP, Màu, Kích thước, Đơn vị) trong tab Kho hàng trước.</p>
                )}
                {inventory.length === 0 && !allOptionsExist && ( // show if no inventory AND not all options exist
                    <p className="text-xs text-center text-muted-foreground">Vui lòng thêm sản phẩm vào kho hàng và định nghĩa các tùy chọn sản phẩm trước khi nhập hàng.</p>
                )}
                 {inventory.length === 0 && allOptionsExist && ( // show if no inventory BUT all options exist
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

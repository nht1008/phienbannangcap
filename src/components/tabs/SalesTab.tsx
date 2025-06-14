
"use client";

import React, { useState, useMemo } from 'react';
import type { Product, CartItem, Invoice } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationDialog } from '@/components/shared/NotificationDialog';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";

interface SalesTabProps {
  inventory: Product[];
  onCreateInvoice: (customerName: string, cart: CartItem[], total: number) => Promise<boolean>;
}

export function SalesTab({ inventory, onCreateInvoice }: SalesTabProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const { toast } = useToast(); // For local notifications if needed, main ones in page.tsx

  const [localNotification, setLocalNotification] = useState<string | null>(null);
  const [localNotificationType, setLocalNotificationType] = useState<'success' | 'error'>('error');

  const showLocalNotification = (message: string, type: 'success' | 'error') => {
    setLocalNotification(message);
    setLocalNotificationType(type);
  };


  const addToCart = (item: Product) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    const stockItem = inventory.find(i => i.id === item.id);

    if (!stockItem || stockItem.quantity <= 0) {
      showLocalNotification(`Sản phẩm "${item.name}" đã hết hàng!`, 'error');
      return;
    }

    if (existingItem) {
      if (existingItem.quantityInCart < stockItem.quantity) {
        setCart(cart.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, quantityInCart: cartItem.quantityInCart + 1 } : cartItem
        ));
      } else {
        showLocalNotification(`Không đủ số lượng "${item.name}" trong kho (Còn: ${stockItem.quantity}).`, 'error');
      }
    } else {
      setCart([...cart, { ...item, quantityInCart: 1 }]);
    }
  };

  const updateCartQuantity = (itemId: string, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr);
    const stockItem = inventory.find(i => i.id === itemId);
    if (!stockItem) return;

    if (newQuantity > stockItem.quantity) {
      showLocalNotification(`Số lượng tồn kho không đủ! Chỉ còn ${stockItem.quantity} ${stockItem.unit}.`, 'error');
      setCart(cart.map(item => item.id === itemId ? { ...item, quantityInCart: stockItem.quantity } : item));
      return;
    }
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item => item.id === itemId ? { ...item, quantityInCart: newQuantity } : item));
    }
  };

  const total = useMemo(() =>
    cart.reduce((sum, item) => sum + item.price * item.quantityInCart, 0),
    [cart]
  );

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showLocalNotification("Giỏ hàng trống!", 'error');
      return;
    }

    if (!customerName.trim()) {
      showLocalNotification("Vui lòng nhập tên khách hàng!", 'error');
      return;
    }

    for (const cartItem of cart) {
      const stockItem = inventory.find(i => i.id === cartItem.id);
      if (!stockItem || stockItem.quantity < cartItem.quantityInCart) {
        showLocalNotification(`Sản phẩm "${cartItem.name}" không đủ số lượng trong kho! (Còn: ${stockItem?.quantity ?? 0})`, 'error');
        return;
      }
    }

    const success = await onCreateInvoice(customerName, cart, total);
    if (success) {
      setCart([]);
      setCustomerName('');
      // Notification is handled by page.tsx after Firebase operation
    }
    // Else, notification of failure is handled by page.tsx
  };

  return (
    <>
      <NotificationDialog message={localNotification} type={localNotificationType} onClose={() => setLocalNotification(null)} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Sản phẩm có sẵn</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {inventory.filter(item => item.quantity > 0).map(item => (
              <Card key={item.id} className="text-center hover:shadow-lg transition-shadow flex flex-col">
                <CardContent className="p-4 flex-grow">
                  <Image 
                    src={item.image || `https://placehold.co/100x100.png`}
                    alt={item.name} 
                    width={100} 
                    height={100} 
                    className="w-24 h-24 mx-auto rounded-full object-cover mb-2"
                    data-ai-hint={`${item.name.split(' ')[0]} flower`}
                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100.png')}
                  />
                  <h4 className="font-semibold text-foreground">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">{item.color} - {item.size}</p>
                  <p className="text-sm text-muted-foreground">{item.price.toLocaleString('vi-VN')} VNĐ / {item.unit}</p>
                  <p className="text-xs text-muted-foreground">Còn lại: {item.quantity}</p>
                </CardContent>
                <CardFooter className="p-2">
                  <Button
                    onClick={() => addToCart(item)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                    size="sm"
                    disabled={item.quantity <= 0}
                  >
                    Thêm
                  </Button>
                </CardFooter>
              </Card>
            ))}
             {inventory.filter(item => item.quantity > 0).length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-4">Không có sản phẩm nào có sẵn trong kho.</p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Giỏ hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Tên khách hàng"
              className="w-full"
            />
            {cart.length === 0 ? (
              <p className="text-muted-foreground">Giỏ hàng trống</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground">{item.name} <span className="text-xs text-muted-foreground">({item.color})</span></p>
                    <p className="text-sm text-muted-foreground">{item.price.toLocaleString('vi-VN')} VNĐ</p>
                  </div>
                  <Input
                    type="number"
                    value={item.quantityInCart.toString()}
                    onChange={(e) => updateCartQuantity(item.id, e.target.value)}
                    className="w-16 p-1 text-center"
                    min="1"
                    max={(inventory.find(i => i.id === item.id)?.quantity ?? 1).toString()}
                  />
                </div>
              ))
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
             <hr className="w-full border-border my-2"/>
            <div className="flex justify-between font-bold text-lg w-full text-foreground">
              <span>Tổng cộng:</span>
              <span>{total.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <Button
              onClick={handleCheckout}
              className="w-full bg-green-500 text-white hover:bg-green-600"
              disabled={cart.length === 0}
            >
              Thanh toán
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

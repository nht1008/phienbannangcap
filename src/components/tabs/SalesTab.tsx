
"use client";

import React, { useState, useMemo } from 'react';
import type { Product, CartItem, Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { NotificationDialog } from '@/components/shared/NotificationDialog';
import Image from 'next/image';
import { ChevronsUpDown, Check, PlusCircle } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatPhoneNumber } from '@/lib/utils'; 


interface SalesTabProps {
  inventory: Product[];
  customers: Customer[];
  onCreateInvoice: (
    customerName: string, 
    cart: CartItem[], 
    subtotal: number, // actual VND
    paymentMethod: string,
    discount: number, // actual VND
    amountPaid: number // actual VND
  ) => Promise<boolean>;
}

const paymentOptions = ['Tiền mặt', 'Chuyển khoản'];

export function SalesTab({ inventory, customers, onCreateInvoice }: SalesTabProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [localNotification, setLocalNotification] = useState<string | null>(null);
  const [localNotificationType, setLocalNotificationType] = useState<'success' | 'error'>('error');
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [customerNameForInvoice, setCustomerNameForInvoice] = useState('Khách lẻ');
  const [customerSearchText, setCustomerSearchText] = useState(""); 
  const [openCustomerCombobox, setOpenCustomerCombobox] = useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<string>(paymentOptions[0]);
  const [discountStr, setDiscountStr] = useState(''); // Input as "Nghin VND"
  const [amountPaidStr, setAmountPaidStr] = useState(''); // Input as "Nghin VND"


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
      // item.price and item.costPrice are actual VND from inventory
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

  // subtotal is in actual VND because item.price is actual VND
  const subtotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.price * item.quantityInCart, 0),
    [cart]
  );

  // For dialog display and calculations:
  const parsedDiscountNghin = parseFloat(discountStr) || 0;
  const actualDiscountVND = parsedDiscountNghin * 1000;
  const finalTotalAfterDiscount = subtotal - actualDiscountVND;

  const parsedAmountPaidNghin = parseFloat(amountPaidStr) || 0;
  const actualAmountPaidVND = parsedAmountPaidNghin * 1000;
  const changeVND = actualAmountPaidVND - finalTotalAfterDiscount;


  const handleOpenPaymentDialog = () => {
    if (cart.length === 0) {
      showLocalNotification("Giỏ hàng trống!", 'error');
      return;
    }
    for (const cartItem of cart) {
      const stockItem = inventory.find(i => i.id === cartItem.id);
      if (!stockItem || stockItem.quantity < cartItem.quantityInCart) {
        showLocalNotification(`Sản phẩm "${cartItem.name}" không đủ số lượng trong kho! (Còn: ${stockItem?.quantity ?? 0})`, 'error');
        return;
      }
    }
    setCustomerNameForInvoice("Khách lẻ"); 
    setCustomerSearchText("");
    setDiscountStr(''); 
    setAmountPaidStr(''); 
    setCurrentPaymentMethod(paymentOptions[0]);
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmCheckout = async () => {
    const finalCustomerName = customerNameForInvoice.trim() === '' ? 'Khách lẻ' : customerNameForInvoice.trim();
    
    // actualDiscountVND and actualAmountPaidVND are already calculated based on discountStr and amountPaidStr
    if (actualDiscountVND < 0) {
        showLocalNotification("Số tiền giảm giá không thể âm.", "error");
        return;
    }
    if (actualAmountPaidVND < 0) {
        showLocalNotification("Số tiền khách trả không thể âm.", "error");
        return;
    }
    if (finalTotalAfterDiscount < 0) { // subtotal - actualDiscountVND
        showLocalNotification("Số tiền giảm giá không thể lớn hơn tổng tiền hàng.", "error");
        return;
    }

    const success = await onCreateInvoice(
        finalCustomerName, 
        cart, 
        subtotal, // Pass subtotal (actual VND)
        currentPaymentMethod,
        actualDiscountVND, // Pass actual VND
        actualAmountPaidVND // Pass actual VND
    );
    if (success) {
      setCart([]);
      setIsPaymentDialogOpen(false);
    }
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
              <span>{subtotal.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <Button
              onClick={handleOpenPaymentDialog}
              className="w-full bg-green-500 text-white hover:bg-green-600"
              disabled={cart.length === 0}
            >
              Chọn phương thức thanh toán
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin thanh toán</DialogTitle>
            <DialogDescription>
              Vui lòng kiểm tra và nhập thông tin thanh toán.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="customerCombobox">Tên khách hàng</Label>
              <Popover open={openCustomerCombobox} onOpenChange={setOpenCustomerCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    id="customerCombobox"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCustomerCombobox}
                    className="w-full justify-between bg-card text-foreground hover:text-foreground"
                  >
                    {customerNameForInvoice || "Chọn hoặc nhập tên..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(var(--radix-popover-trigger-width))] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Tìm khách hàng hoặc nhập tên mới..."
                      value={customerSearchText}
                      onValueChange={setCustomerSearchText}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {customerSearchText.trim() ? `Không tìm thấy "${customerSearchText}". Bạn có thể thêm mới.` : "Nhập tên để tìm kiếm."}
                      </CommandEmpty>
                      <CommandGroup>
                        {customers
                          .filter(c => c.name.toLowerCase().includes(customerSearchText.toLowerCase()) || (c.phone && c.phone.includes(customerSearchText)))
                          .map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name} 
                              onSelect={() => { 
                                setCustomerNameForInvoice(customer.name);
                                setCustomerSearchText(customer.name); 
                                setOpenCustomerCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  customerNameForInvoice === customer.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {customer.name} ({formatPhoneNumber(customer.phone)})
                            </CommandItem>
                          ))}
                      </CommandGroup>
                      {customerSearchText.trim() &&
                       !customers.some(c => c.name.toLowerCase() === customerSearchText.trim().toLowerCase()) &&
                       customerSearchText.trim().toLowerCase() !== 'khách lẻ' && (
                        <CommandItem
                          key="use-typed-value"
                          value={`use-${customerSearchText.trim()}`}
                          onSelect={() => {
                            setCustomerNameForInvoice(customerSearchText.trim());
                            setOpenCustomerCombobox(false);
                          }}
                          className="text-primary hover:!bg-primary/10"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Sử dụng tên: "{customerSearchText.trim()}"
                        </CommandItem>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-between items-center">
              <Label>Tổng tiền hàng:</Label>
              <span className="font-semibold">{subtotal.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            
            <div>
                <Label className="mb-2 block">Phương thức thanh toán</Label>
                <RadioGroup value={currentPaymentMethod} onValueChange={setCurrentPaymentMethod} className="flex space-x-4">
                    {paymentOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`payment-${option}`} />
                        <Label htmlFor={`payment-${option}`}>{option}</Label>
                    </div>
                    ))}
                </RadioGroup>
            </div>

            <div className="space-y-1">
              <Label htmlFor="amountPaid">Số tiền khách trả (Nghìn VND)</Label>
              <Input 
                id="amountPaid" 
                type="number" 
                value={amountPaidStr} 
                onChange={(e) => setAmountPaidStr(e.target.value)} 
                min="0"
                className="bg-card" 
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="discount">Giảm giá (Nghìn VND)</Label>
              <Input 
                id="discount" 
                type="number" 
                value={discountStr} 
                onChange={(e) => setDiscountStr(e.target.value)} 
                min="0"
                className="bg-card" 
              />
            </div>

            <div className="flex justify-between items-center">
              <Label>Tiền thừa:</Label>
              <span className="font-semibold">{changeVND >= 0 && actualAmountPaidVND > 0 && actualAmountPaidVND >= finalTotalAfterDiscount ? changeVND.toLocaleString('vi-VN') : '0'} VNĐ</span>
            </div>
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirmCheckout} 
              className="bg-green-500 hover:bg-green-600 text-white"
              disabled={finalTotalAfterDiscount < 0}
            >
              Xác nhận thanh toán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


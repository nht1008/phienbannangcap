
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Product, CartItem, Customer } from '@/types';
import type { User } from 'firebase/auth';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    amountPaid: number, // actual VND
    isGuestCustomer: boolean,
    employeeId: string,
    employeeName: string
  ) => Promise<boolean>;
  currentUser: User | null;
}

const paymentOptions = ['Tiền mặt', 'Chuyển khoản'];

interface VariantSelection {
  color: string;
  size: string;
  unit: string;
}

interface AvailableVariants {
  colors: string[];
  sizes: string[];
  units: string[];
}

export function SalesTab({ inventory, customers, onCreateInvoice, currentUser }: SalesTabProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [localNotification, setLocalNotification] = useState<string | null>(null);
  const [localNotificationType, setLocalNotificationType] = useState<'success' | 'error'>('error');
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [customerNameForInvoice, setCustomerNameForInvoice] = useState('Khách lẻ');
  const [customerSearchText, setCustomerSearchText] = useState(""); 
  const [openCustomerCombobox, setOpenCustomerCombobox] = useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<string>(paymentOptions[0]);
  const [discountStr, setDiscountStr] = useState(''); 
  const [amountPaidStr, setAmountPaidStr] = useState('');

  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);

  const [selectedProductNameForVariants, setSelectedProductNameForVariants] = useState<string | null>(null);
  const [variantSelection, setVariantSelection] = useState<VariantSelection>({ color: '', size: '', unit: '' });
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  const [availableVariants, setAvailableVariants] = useState<AvailableVariants>({ colors: [], sizes: [], units: [] });

  const showLocalNotification = (message: string, type: 'success' | 'error') => {
    setLocalNotification(message);
    setLocalNotificationType(type);
  };

  const addToCart = (item: Product) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    const stockItem = inventory.find(i => i.id === item.id);

    if (!stockItem || stockItem.quantity <= 0) {
      showLocalNotification(`Sản phẩm "${item.name} (${item.color}, ${item.size}, ${item.unit})" đã hết hàng!`, 'error');
      return;
    }

    if (existingItem) {
      if (existingItem.quantityInCart < stockItem.quantity) {
        setCart(cart.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, quantityInCart: cartItem.quantityInCart + 1 } : cartItem
        ));
      } else {
        showLocalNotification(`Không đủ số lượng "${item.name} (${item.color}, ${item.size}, ${item.unit})" trong kho (Còn: ${stockItem.quantity}).`, 'error');
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

  const subtotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.price * item.quantityInCart, 0),
    [cart]
  );

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
    if (!currentUser) {
      showLocalNotification("Không tìm thấy thông tin người dùng hiện tại. Vui lòng thử đăng nhập lại.", "error");
      return;
    }
    const finalCustomerName = customerNameForInvoice.trim() === '' ? 'Khách lẻ' : customerNameForInvoice.trim();
    const isGuest = finalCustomerName.toLowerCase() === 'khách lẻ';
    
    if (actualDiscountVND < 0) {
        showLocalNotification("Số tiền giảm giá không thể âm.", "error");
        return;
    }
    if (actualAmountPaidVND < 0) {
        showLocalNotification("Số tiền khách trả không thể âm.", "error");
        return;
    }
    if (finalTotalAfterDiscount < 0) { 
        showLocalNotification("Số tiền giảm giá không thể lớn hơn tổng tiền hàng.", "error");
        return;
    }

    if (finalTotalAfterDiscount > actualAmountPaidVND) {
      if (isGuest || currentPaymentMethod === 'Chuyển khoản') {
        showLocalNotification(
          "Khách lẻ hoặc thanh toán Chuyển khoản không được phép nợ. Vui lòng thanh toán đủ.",
          "error"
        );
        return; 
      }
    }

    const success = await onCreateInvoice(
        finalCustomerName, 
        cart, 
        subtotal, 
        currentPaymentMethod,
        actualDiscountVND, 
        actualAmountPaidVND,
        isGuest,
        currentUser.uid,
        currentUser.displayName || currentUser.email || "Không rõ"
    );
    if (success) {
      setCart([]);
      setIsPaymentDialogOpen(false);
    }
  };

  const productsWithSameName = useMemo(() => {
    const nameMap = new Map<string, Product[]>();
    inventory.filter(p => p.quantity > 0).forEach(product => {
      if (!nameMap.has(product.name)) {
        nameMap.set(product.name, []);
      }
      nameMap.get(product.name)!.push(product);
    });
    return Array.from(nameMap.entries()).map(([name, products]) => ({
      name,
      firstVariant: products[0], // For display on card
      totalStock: products.reduce((sum, p) => sum + p.quantity, 0)
    }));
  }, [inventory]);

  const openVariantSelector = useCallback((productName: string) => {
    const variantsOfProduct = inventory.filter(p => p.name === productName && p.quantity > 0);
    if (variantsOfProduct.length === 0) {
      showLocalNotification(`Sản phẩm "${productName}" hiện đã hết hàng.`, 'error');
      return;
    }

    const colors = Array.from(new Set(variantsOfProduct.map(p => p.color))).sort();
    // Initially, sizes and units are empty until a color is selected
    setAvailableVariants({ colors, sizes: [], units: [] });
    setSelectedProductNameForVariants(productName);
    setVariantSelection({ color: colors[0] || '', size: '', unit: '' }); // Pre-select first color
    setIsVariantSelectorOpen(true);
  }, [inventory]);

  useEffect(() => {
    if (selectedProductNameForVariants && variantSelection.color) {
      const variantsMatchingNameAndColor = inventory.filter(p => 
        p.name === selectedProductNameForVariants && 
        p.color === variantSelection.color &&
        p.quantity > 0
      );
      const sizes = Array.from(new Set(variantsMatchingNameAndColor.map(p => p.size))).sort();
      setAvailableVariants(prev => ({ ...prev, sizes }));
      
      // If only one size, auto-select it. Otherwise, reset size selection.
      const newSize = sizes.length === 1 ? sizes[0] : '';
      setVariantSelection(prev => ({ ...prev, size: newSize, unit: '' })); // Reset unit when color/size changes
    } else if (selectedProductNameForVariants) { // Color not selected or cleared
        setAvailableVariants(prev => ({ ...prev, sizes: [], units: [] }));
        setVariantSelection(prev => ({ ...prev, size: '', unit: '' }));
    }
  }, [selectedProductNameForVariants, variantSelection.color, inventory]);

  useEffect(() => {
    if (selectedProductNameForVariants && variantSelection.color && variantSelection.size) {
      const variantsMatchingNameColorSize = inventory.filter(p => 
        p.name === selectedProductNameForVariants &&
        p.color === variantSelection.color &&
        p.size === variantSelection.size &&
        p.quantity > 0
      );
      const units = Array.from(new Set(variantsMatchingNameColorSize.map(p => p.unit))).sort();
      setAvailableVariants(prev => ({ ...prev, units }));

      // If only one unit, auto-select it.
      const newUnit = units.length === 1 ? units[0] : '';
      setVariantSelection(prev => ({ ...prev, unit: newUnit }));
    } else if (selectedProductNameForVariants) { // Size not selected or cleared
        setAvailableVariants(prev => ({ ...prev, units: [] }));
        setVariantSelection(prev => ({ ...prev, unit: '' }));
    }
  }, [selectedProductNameForVariants, variantSelection.color, variantSelection.size, inventory]);


  const handleVariantSelectionChange = (field: keyof VariantSelection, value: string) => {
    setVariantSelection(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'color') { // Reset size and unit if color changes
        newState.size = '';
        newState.unit = '';
      } else if (field === 'size') { // Reset unit if size changes
        newState.unit = '';
      }
      return newState;
    });
  };

  const handleAddVariantToCart = () => {
    if (!selectedProductNameForVariants || !variantSelection.color || !variantSelection.size || !variantSelection.unit) {
      showLocalNotification('Vui lòng chọn đầy đủ màu sắc, kích thước và đơn vị.', 'error');
      return;
    }
    const productToAdd = inventory.find(p => 
      p.name === selectedProductNameForVariants &&
      p.color === variantSelection.color &&
      p.size === variantSelection.size &&
      p.unit === variantSelection.unit &&
      p.quantity > 0
    );

    if (productToAdd) {
      addToCart(productToAdd);
      setIsVariantSelectorOpen(false);
      setSelectedProductNameForVariants(null);
      setVariantSelection({ color: '', size: '', unit: '' });
    } else {
      showLocalNotification('Không tìm thấy sản phẩm phù hợp hoặc đã hết hàng.', 'error');
    }
  };

  const selectedVariantDetails = useMemo(() => {
    if (selectedProductNameForVariants && variantSelection.color && variantSelection.size && variantSelection.unit) {
      return inventory.find(p => 
        p.name === selectedProductNameForVariants &&
        p.color === variantSelection.color &&
        p.size === variantSelection.size &&
        p.unit === variantSelection.unit &&
        p.quantity > 0
      );
    }
    return null;
  }, [inventory, selectedProductNameForVariants, variantSelection]);


  return (
    <>
      <NotificationDialog message={localNotification} type={localNotificationType} onClose={() => setLocalNotification(null)} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">

          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Bán hàng nhanh</h3>
            <Popover open={isProductSearchOpen} onOpenChange={setIsProductSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isProductSearchOpen}
                  className="w-full justify-between bg-card text-foreground hover:text-foreground"
                >
                  Tìm và thêm sản phẩm vào giỏ...
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput
                    placeholder="Gõ tên sản phẩm..."
                    value={productSearchQuery}
                    onValueChange={setProductSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
                    <CommandGroup>
                      {productsWithSameName
                        .filter(group => 
                          group.name.toLowerCase().includes(productSearchQuery.toLowerCase())
                        )
                        .map((productGroup) => (
                          <CommandItem
                            key={productGroup.name}
                            value={productGroup.name}
                            onSelect={() => {
                              openVariantSelector(productGroup.name);
                              setProductSearchQuery("");
                              setIsProductSearchOpen(false);
                            }}
                          >
                            <div className="flex flex-col w-full">
                              <span className="font-medium">{productGroup.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Tổng tồn: {productGroup.totalStock}
                              </span>
                            </div>
                          </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <h3 className="text-xl font-semibold mb-4 text-foreground">Hoặc chọn từ danh sách sản phẩm có sẵn</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {productsWithSameName.map(group => (
              <Card key={group.name} className="text-center hover:shadow-lg transition-shadow flex flex-col">
                <CardContent className="p-4 flex-grow">
                  <Image 
                    src={group.firstVariant.image || `https://placehold.co/100x100.png`}
                    alt={group.name} 
                    width={100} 
                    height={100} 
                    className="w-24 h-24 mx-auto rounded-full object-cover mb-2"
                    data-ai-hint={`${group.name.split(' ')[0]} flower`}
                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100.png')}
                  />
                  <h4 className="font-semibold text-foreground">{group.name}</h4>
                   <p className="text-xs text-muted-foreground">Tổng còn lại: {group.totalStock}</p>
                </CardContent>
                <CardFooter className="p-2">
                  <Button
                    onClick={() => openVariantSelector(group.name)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                    size="sm"
                    disabled={group.totalStock <= 0}
                  >
                    Thêm
                  </Button>
                </CardFooter>
              </Card>
            ))}
             {productsWithSameName.length === 0 && (
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
                    <p className="font-semibold text-foreground">{item.name} <span className="text-xs text-muted-foreground">({item.color}, {item.size}, {item.unit})</span></p>
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
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
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
            {finalTotalAfterDiscount > actualAmountPaidVND && customerNameForInvoice.toLowerCase() !== 'khách lẻ' && currentPaymentMethod !== 'Chuyển khoản' && (
                 <div className="flex justify-between items-center text-red-600">
                    <Label className="text-red-600">Còn nợ:</Label>
                    <span className="font-semibold">{(finalTotalAfterDiscount - actualAmountPaidVND).toLocaleString('vi-VN')} VNĐ</span>
                </div>
            )}
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

      {/* Variant Selector Dialog */}
      <Dialog open={isVariantSelectorOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSelectedProductNameForVariants(null);
          setVariantSelection({ color: '', size: '', unit: '' });
        }
        setIsVariantSelectorOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chọn thuộc tính cho: {selectedProductNameForVariants}</DialogTitle>
            <DialogDescription>
              Vui lòng chọn màu sắc, kích thước và đơn vị.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="variant-color">Màu sắc</Label>
              <Select 
                value={variantSelection.color} 
                onValueChange={(value) => handleVariantSelectionChange('color', value)}
                disabled={availableVariants.colors.length === 0}
              >
                <SelectTrigger id="variant-color" className="bg-card">
                  <SelectValue placeholder="Chọn màu sắc" />
                </SelectTrigger>
                <SelectContent>
                  {availableVariants.colors.map(color => (
                    <SelectItem key={color} value={color}>{color}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="variant-size">Kích thước</Label>
              <Select 
                value={variantSelection.size} 
                onValueChange={(value) => handleVariantSelectionChange('size', value)}
                disabled={!variantSelection.color || availableVariants.sizes.length === 0}
              >
                <SelectTrigger id="variant-size" className="bg-card">
                  <SelectValue placeholder="Chọn kích thước" />
                </SelectTrigger>
                <SelectContent>
                  {availableVariants.sizes.map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="variant-unit">Đơn vị</Label>
              <Select 
                value={variantSelection.unit} 
                onValueChange={(value) => handleVariantSelectionChange('unit', value)}
                disabled={!variantSelection.color || !variantSelection.size || availableVariants.units.length === 0}
              >
                <SelectTrigger id="variant-unit" className="bg-card">
                  <SelectValue placeholder="Chọn đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  {availableVariants.units.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedVariantDetails && (
              <Card className="p-3 bg-muted/50 text-sm">
                <p><strong>Giá bán:</strong> {selectedVariantDetails.price.toLocaleString('vi-VN')} VNĐ</p>
                <p><strong>Tồn kho:</strong> {selectedVariantDetails.quantity}</p>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVariantSelectorOpen(false)}>Hủy</Button>
            <Button 
              onClick={handleAddVariantToCart}
              disabled={!variantSelection.color || !variantSelection.size || !variantSelection.unit || !selectedVariantDetails}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Thêm vào giỏ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


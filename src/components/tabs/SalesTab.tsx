
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Product, CartItem, Customer } from '@/types';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { ChevronsUpDown, Check, PlusCircle, Trash2, ShoppingCart, Minus, Plus, Tag, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatPhoneNumber, normalizeStringForSearch } from '@/lib/utils';
import type { NumericDisplaySize } from '@/components/settings/SettingsDialog';


interface SalesTabProps {
  inventory: Product[];
  customers: Customer[];
  onCreateInvoice: (
    customerName: string,
    cart: CartItem[],
    subtotalAfterItemDiscounts: number,
    paymentMethod: string,
    overallInvoiceDiscount: number,
    amountPaid: number,
    isGuestCustomer: boolean,
    employeeId: string,
    employeeName: string
  ) => Promise<boolean>;
  currentUser: User | null;
  numericDisplaySize: NumericDisplaySize;
  cart: CartItem[];
  onAddToCart: (item: Product) => void;
  onUpdateCartQuantity: (itemId: string, newQuantityStr: string) => void;
  onItemDiscountChange: (itemId: string, discountNghinStr: string) => boolean;
  onClearCart: () => void;
  productQualityOptions: string[];
}

const paymentOptions = ['Tiền mặt', 'Chuyển khoản'];

interface VariantSelection {
  color: string;
  quality: string;
  size: string;
  unit: string;
}

interface AvailableVariants {
  colors: string[];
  qualities: string[];
  sizes: string[];
  units: string[];
}

export function SalesTab({
    inventory,
    customers,
    onCreateInvoice,
    currentUser,
    numericDisplaySize,
    cart,
    onAddToCart,
    onUpdateCartQuantity,
    onItemDiscountChange,
    onClearCart,
    productQualityOptions
}: SalesTabProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [customerNameForInvoice, setCustomerNameForInvoice] = useState('Khách lẻ');
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [openCustomerCombobox, setOpenCustomerCombobox] = useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<string>(paymentOptions[0]);
  const [overallDiscountStr, setOverallDiscountStr] = useState('');
  const [amountPaidStr, setAmountPaidStr] = useState('');

  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);

  const [selectedProductNameForVariants, setSelectedProductNameForVariants] = useState<string | null>(null);
  const [variantSelection, setVariantSelection] = useState<VariantSelection>({ color: '', quality: '', size: '', unit: '' });
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  const [availableVariants, setAvailableVariants] = useState<AvailableVariants>({ colors: [], qualities: [], sizes: [], units: [] });

  const subtotalAfterItemDiscounts = useMemo(() =>
    cart.reduce((sum, item) => {
      const itemTotal = item.price * item.quantityInCart;
      const discount = item.itemDiscount || 0;
      return sum + (itemTotal - discount);
    }, 0),
    [cart]
  );

  const areAllItemDiscountsValid = useMemo(() => {
    return cart.every(item => {
      const itemOriginalTotal = item.price * item.quantityInCart;
      const discount = item.itemDiscount || 0;
      if (discount < 0 || discount > itemOriginalTotal) return false;

      if (item.maxDiscountPerUnitVND !== undefined && item.maxDiscountPerUnitVND !== null && item.maxDiscountPerUnitVND >= 0) {
        const maxAllowedLineItemDiscount = item.maxDiscountPerUnitVND * item.quantityInCart;
        if (discount > maxAllowedLineItemDiscount) return false;
      }
      return true;
    });
  }, [cart]);

  const parsedOverallDiscountNghin = parseFloat(overallDiscountStr) || 0;
  const actualOverallInvoiceDiscountVND = parsedOverallDiscountNghin * 1000;

  const finalTotalAfterAllDiscounts = useMemo(() => {
      const total = subtotalAfterItemDiscounts - actualOverallInvoiceDiscountVND;
      return total < 0 ? 0 : total;
  }, [subtotalAfterItemDiscounts, actualOverallInvoiceDiscountVND]);

  const parsedAmountPaidNghin = parseFloat(amountPaidStr) || 0;
  const actualAmountPaidVND = parsedAmountPaidNghin * 1000;
  const changeVND = actualAmountPaidVND - finalTotalAfterAllDiscounts;

  const isEveryItemAtMaxPossibleDiscount = useMemo(() => {
    if (cart.length === 0) return false;
    return cart.every(item => {
      const actualItemDiscount = item.itemDiscount || 0;
      const itemLineTotal = item.price * item.quantityInCart;

      let maxPossibleDiscountForItem = itemLineTotal; // Default to full item price

      if (item.maxDiscountPerUnitVND !== undefined && item.maxDiscountPerUnitVND >= 0) {
        const productSpecificMaxLineDiscount = item.maxDiscountPerUnitVND * item.quantityInCart;
        maxPossibleDiscountForItem = Math.min(itemLineTotal, productSpecificMaxLineDiscount);
      }
      
      // After correction by page.tsx, itemDiscount should be <= maxPossibleDiscountForItem
      // We check if it's effectively at this maximum.
      return actualItemDiscount >= maxPossibleDiscountForItem;
    });
  }, [cart]);

  useEffect(() => {
    if (isEveryItemAtMaxPossibleDiscount && overallDiscountStr !== '' && overallDiscountStr !== '0') {
        setOverallDiscountStr('0'); 
    }
  }, [isEveryItemAtMaxPossibleDiscount, overallDiscountStr]);


  const handleOpenPaymentDialog = () => {
    if (cart.length === 0) return;
    if (!areAllItemDiscountsValid) return;

    for (const cartItem of cart) {
      const stockItem = inventory.find(i => i.id === cartItem.id);
      if (!stockItem || stockItem.quantity < cartItem.quantityInCart) {
        return;
      }
    }

    setCustomerNameForInvoice("Khách lẻ");
    setCustomerSearchText("");
    setOverallDiscountStr(isEveryItemAtMaxPossibleDiscount ? '0' : '');
    setAmountPaidStr((finalTotalAfterAllDiscounts / 1000).toString());
    setCurrentPaymentMethod(paymentOptions[0]);
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmCheckout = async () => {
    if (!currentUser) {
      alert("Không tìm thấy thông tin người dùng hiện tại. Vui lòng thử đăng nhập lại.");
      return;
    }
    const finalCustomerName = customerNameForInvoice.trim() === '' ? 'Khách lẻ' : customerNameForInvoice.trim();
    const isGuest = finalCustomerName.toLowerCase() === 'khách lẻ';

    if (actualOverallInvoiceDiscountVND < 0) {
        alert("Số tiền giảm giá chung không thể âm.");
        return;
    }
    if (actualAmountPaidVND < 0) {
        alert("Số tiền khách trả không thể âm.");
        return;
    }

    if (subtotalAfterItemDiscounts < actualOverallInvoiceDiscountVND) {
        alert("Tổng giảm giá chung không thể lớn hơn tổng tiền hàng sau khi đã giảm giá từng sản phẩm.");
        return;
    }

    if (finalTotalAfterAllDiscounts > actualAmountPaidVND) {
      if (isGuest || currentPaymentMethod === 'Chuyển khoản') {
        alert("Khách lẻ hoặc thanh toán Chuyển khoản không được phép nợ. Vui lòng thanh toán đủ.");
        return;
      }
    }

    const success = await onCreateInvoice(
        finalCustomerName,
        cart,
        subtotalAfterItemDiscounts,
        currentPaymentMethod,
        actualOverallInvoiceDiscountVND,
        actualAmountPaidVND,
        isGuest,
        currentUser.uid,
        currentUser.displayName || currentUser.email || "Không rõ"
    );
    if (success) {
      setIsPaymentDialogOpen(false);
      setOverallDiscountStr('');
      setAmountPaidStr('');
    }
  };

  const productsGroupedByName = useMemo(() => {
    const nameMap = new Map<string, { firstVariant: Product, totalStock: number }>();
    inventory.filter(p => p.quantity > 0).forEach(product => {
      if (!nameMap.has(product.name)) {
        nameMap.set(product.name, { firstVariant: product, totalStock: 0 });
      }
      const entry = nameMap.get(product.name)!;
      entry.totalStock += product.quantity;
    });
    return Array.from(nameMap.entries()).map(([name, data]) => ({
      name,
      firstVariant: data.firstVariant,
      totalStock: data.totalStock
    }));
  }, [inventory]);

  const distinctInStockVariants = useMemo(() => {
    return inventory
      .filter(p => p.quantity > 0)
      .map(p => ({
        ...p,
        displayLabel: `${p.name} ${p.color} ${p.quality || ''} ${p.size} ${p.unit} - Tồn: ${p.quantity} - Giá: ${p.price.toLocaleString('vi-VN')}`.replace(/\s\s+/g, ' ')
      }));
  }, [inventory]);


  const openVariantSelector = useCallback((productName: string) => {
    const variantsOfProduct = inventory.filter(p => p.name === productName && p.quantity > 0);
    if (variantsOfProduct.length === 0) {
      alert(`Sản phẩm "${productName}" hiện đã hết hàng.`);
      return;
    }
    const colors = Array.from(new Set(variantsOfProduct.map(p => p.color))).sort();
    setAvailableVariants({ colors, qualities: [], sizes: [], units: [] });
    setSelectedProductNameForVariants(productName);
    setVariantSelection({ color: colors[0] || '', quality: '', size: '', unit: '' });
    setIsVariantSelectorOpen(true);
  }, [inventory]);

  useEffect(() => {
    if (selectedProductNameForVariants && variantSelection.color) {
      const variantsMatchingNameAndColor = inventory.filter(p =>
        p.name === selectedProductNameForVariants &&
        p.color === variantSelection.color &&
        p.quantity > 0
      );
      const qualities = Array.from(new Set(variantsMatchingNameAndColor.map(p => p.quality || ''))).sort();
      setAvailableVariants(prev => ({ ...prev, qualities }));
      const newQuality = qualities.length === 1 ? qualities[0] : (qualities.includes(variantSelection.quality) ? variantSelection.quality : (qualities[0] || ''));
      setVariantSelection(prev => ({ ...prev, quality: newQuality, size: '', unit: '' }));
    } else if (selectedProductNameForVariants) {
        setAvailableVariants(prev => ({ ...prev, qualities: [], sizes: [], units: [] }));
        setVariantSelection(prev => ({ ...prev, quality: '', size: '', unit: '' }));
    }
  }, [selectedProductNameForVariants, variantSelection.color, inventory, variantSelection.quality]);

  useEffect(() => {
    if (selectedProductNameForVariants && variantSelection.color && variantSelection.quality) {
      const variantsMatchingNameColorQuality = inventory.filter(p =>
        p.name === selectedProductNameForVariants &&
        p.color === variantSelection.color &&
        p.quality === variantSelection.quality &&
        p.quantity > 0
      );
      const sizes = Array.from(new Set(variantsMatchingNameColorQuality.map(p => p.size))).sort();
      setAvailableVariants(prev => ({ ...prev, sizes }));
      const newSize = sizes.length === 1 ? sizes[0] : (sizes.includes(variantSelection.size) ? variantSelection.size : (sizes[0] || ''));
      setVariantSelection(prev => ({ ...prev, size: newSize, unit: '' }));
    } else if (selectedProductNameForVariants) {
        setAvailableVariants(prev => ({ ...prev, sizes: [], units: [] }));
        setVariantSelection(prev => ({ ...prev, size: '', unit: '' }));
    }
  }, [selectedProductNameForVariants, variantSelection.color, variantSelection.quality, inventory, variantSelection.size]);

  useEffect(() => {
    if (selectedProductNameForVariants && variantSelection.color && variantSelection.quality && variantSelection.size) {
      const variantsMatchingNameColorQualitySize = inventory.filter(p =>
        p.name === selectedProductNameForVariants &&
        p.color === variantSelection.color &&
        p.quality === variantSelection.quality &&
        p.size === variantSelection.size &&
        p.quantity > 0
      );
      const units = Array.from(new Set(variantsMatchingNameColorQualitySize.map(p => p.unit))).sort();
      setAvailableVariants(prev => ({ ...prev, units }));
      const newUnit = units.length === 1 ? units[0] : (units.includes(variantSelection.unit) ? variantSelection.unit : (units[0] || ''));
      setVariantSelection(prev => ({ ...prev, unit: newUnit }));
    } else if (selectedProductNameForVariants) {
        setAvailableVariants(prev => ({ ...prev, units: [] }));
        setVariantSelection(prev => ({ ...prev, unit: '' }));
    }
  }, [selectedProductNameForVariants, variantSelection.color, variantSelection.quality, variantSelection.size, inventory, variantSelection.unit]);


  const handleVariantSelectionChange = (field: keyof VariantSelection, value: string) => {
    setVariantSelection(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'color') {
        newState.quality = ''; newState.size = ''; newState.unit = '';
      } else if (field === 'quality') {
        newState.size = ''; newState.unit = '';
      } else if (field === 'size') {
        newState.unit = '';
      }
      return newState;
    });
  };

  const handleAddVariantToCart = () => {
    if (!selectedProductNameForVariants || !variantSelection.color || !variantSelection.quality || !variantSelection.size || !variantSelection.unit) {
      alert('Vui lòng chọn đầy đủ màu sắc, chất lượng, kích thước và đơn vị.');
      return;
    }
    const productToAdd = inventory.find(p =>
      p.name === selectedProductNameForVariants &&
      p.color === variantSelection.color &&
      p.quality === variantSelection.quality &&
      p.size === variantSelection.size &&
      p.unit === variantSelection.unit &&
      p.quantity > 0
    );

    if (productToAdd) {
      onAddToCart(productToAdd);
      setIsVariantSelectorOpen(false);
      setSelectedProductNameForVariants(null);
      setVariantSelection({ color: '', quality: '', size: '', unit: '' });
    } else {
      alert('Không tìm thấy sản phẩm phù hợp hoặc đã hết hàng.');
    }
  };

  const selectedVariantDetails = useMemo(() => {
    if (selectedProductNameForVariants && variantSelection.color && variantSelection.quality && variantSelection.size && variantSelection.unit) {
      return inventory.find(p =>
        p.name === selectedProductNameForVariants &&
        p.color === variantSelection.color &&
        p.quality === variantSelection.quality &&
        p.size === variantSelection.size &&
        p.unit === variantSelection.unit &&
        p.quantity > 0
      );
    }
    return null;
  }, [inventory, selectedProductNameForVariants, variantSelection]);

  const handleItemDiscountInputChange = (itemId: string, discountStr: string) => {
    onItemDiscountChange(itemId, discountStr);
  };


  return (
    <>
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-6">
            <div className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-lg">
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
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Gõ tên, màu, chất lượng, size hoặc đơn vị..."
                        value={productSearchQuery}
                        onValueChange={setProductSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
                        <CommandGroup>
                          {distinctInStockVariants
                            .filter(variant => {
                              const normalizedLabel = normalizeStringForSearch(variant.displayLabel);
                              const normalizedQuery = normalizeStringForSearch(productSearchQuery);
                              return normalizedLabel.includes(normalizedQuery);
                            })
                            .map((variant) => (
                              <CommandItem
                                key={variant.id}
                                value={variant.id}
                                onSelect={(currentValue) => {
                                  const productToAdd = inventory.find(p => p.id === currentValue);
                                  if (productToAdd) {
                                    onAddToCart(productToAdd);
                                  }
                                  setProductSearchQuery("");
                                  setIsProductSearchOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                               <div className="grid grid-cols-[auto_1fr_minmax(3.5rem,auto)_minmax(4rem,auto)_minmax(4.5rem,auto)_minmax(3rem,auto)_minmax(4.5rem,auto)_minmax(3.5rem,auto)] gap-x-2 items-center w-full text-xs py-1">
                                  <Image
                                    src={variant.image || `https://placehold.co/24x24.png`}
                                    alt={variant.name}
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 rounded object-cover aspect-square border"
                                    data-ai-hint={`${variant.name.split(' ')[0]} flower`}
                                    onError={(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/24x24.png')}
                                  />
                                  <span className="font-medium truncate" title={variant.name}>{variant.name}</span>
                                  <span className="truncate" title={variant.color}>{variant.color}</span>
                                  <span className="truncate" title={variant.quality || ''}>{variant.quality || 'N/A'}</span>
                                  <span className="truncate" title={variant.size}>{variant.size}</span>
                                  <span className="truncate" title={variant.unit}>{variant.unit}</span>
                                  <span className="text-right truncate" title={variant.price.toLocaleString('vi-VN') + ' VNĐ'}>
                                    {variant.price.toLocaleString('vi-VN')}
                                  </span>
                                  <span className="text-right truncate" title={'Tồn: ' + variant.quantity.toString()}>{variant.quantity}</span>
                                </div>
                              </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Hoặc chọn từ danh sách sản phẩm có sẵn</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {productsGroupedByName.map(group => (
                    <Card key={group.name} className="text-center hover:shadow-lg transition-shadow flex flex-col">
                      <CardContent className="p-4 flex-grow">
                        <Image
                          src={group.firstVariant.image || `https://placehold.co/100x100.png`}
                          alt={group.name}
                          width={100}
                          height={100}
                          className="w-24 h-24 mx-auto rounded-full object-cover mb-2 aspect-square"
                          data-ai-hint={`${group.name.split(' ')[0]} flower`}
                          onError={(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/100x100.png')}
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
                  {productsGroupedByName.length === 0 && (
                      <p className="text-muted-foreground col-span-full text-center py-4">Không có sản phẩm nào có sẵn trong kho.</p>
                  )}
                </div>
              </div>
            </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                  <ShoppingCart className="mr-2 h-6 w-6 text-primary"/>
                  Giỏ hàng ({cart.reduce((acc, item) => acc + item.quantityInCart, 0)})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 px-3">Giỏ hàng trống</p>
              ) : (
                <ScrollArea className="max-h-[calc(100vh-20rem)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">STT</TableHead>
                        <TableHead className="min-w-[150px]">Tên Sản phẩm</TableHead>
                        <TableHead className="min-w-[60px]">Màu</TableHead>
                        <TableHead className="min-w-[70px]">Chất lượng</TableHead>
                        <TableHead className="min-w-[70px]">K.Thước</TableHead>
                        <TableHead className="min-w-[50px]">ĐV</TableHead>
                        <TableHead className="text-center w-[120px]">SL</TableHead>
                        <TableHead className="text-right min-w-[80px]">Đơn giá</TableHead>
                        <TableHead className="text-center w-[90px]">GG SP (Nghìn VND)</TableHead>
                        <TableHead className="text-right min-w-[100px]">Thành tiền</TableHead>
                        <TableHead className="text-center w-[40px]">Xóa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item, index) => {
                        const itemOriginalTotal = item.price * item.quantityInCart;
                        const itemFinalTotal = itemOriginalTotal - (item.itemDiscount || 0);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="py-2 align-middle">
                              <div className="flex items-center gap-2">
                                <Image
                                  src={item.image || `https://placehold.co/32x32.png`}
                                  alt={item.name}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-md object-cover aspect-square border"
                                  data-ai-hint={`${item.name.split(' ')[0]} flower`}
                                  onError={(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/32x32.png')}
                                />
                                <p className="font-semibold text-foreground text-sm leading-tight">{item.name}</p>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 align-middle text-xs">{item.color}</TableCell>
                            <TableCell className="py-2 align-middle text-xs">{item.quality || 'N/A'}</TableCell>
                            <TableCell className="py-2 align-middle text-xs">{item.size}</TableCell>
                            <TableCell className="py-2 align-middle text-xs">{item.unit}</TableCell>
                            <TableCell className="text-center py-2 align-middle">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={() => onUpdateCartQuantity(item.id, (item.quantityInCart - 1).toString())}
                                  disabled={item.quantityInCart <= 0}
                                  aria-label="Giảm số lượng"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  value={item.quantityInCart.toString()}
                                  onChange={(e) => onUpdateCartQuantity(item.id, e.target.value)}
                                  className="w-12 h-7 text-center text-sm hide-number-spinners px-1 bg-card"
                                  min="0"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={() => onUpdateCartQuantity(item.id, (item.quantityInCart + 1).toString())}
                                  disabled={item.quantityInCart >= (inventory.find(p => p.id === item.id)?.quantity ?? 0)}
                                  aria-label="Tăng số lượng"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-2 align-middle text-sm">{item.price.toLocaleString('vi-VN')}</TableCell>
                            <TableCell className="text-center py-2 align-middle">
                              <Input
                                  id={`item-discount-${item.id}`}
                                  type="number"
                                  value={typeof item.itemDiscount === 'number' ? (item.itemDiscount / 1000).toString() : ""}
                                  onChange={(e) => handleItemDiscountInputChange(item.id, e.target.value)}
                                  min="0"
                                  step="0.1"
                                  className="h-8 w-full bg-card text-xs p-1 hide-number-spinners text-center"
                                  placeholder="GG"
                              />
                            </TableCell>
                            <TableCell className={cn("text-right py-2 align-middle font-semibold text-sm",(item.itemDiscount || 0) > 0 ? "text-green-600" : "text-primary")}>
                              {itemFinalTotal.toLocaleString('vi-VN')}
                              {(item.itemDiscount || 0) > 0 && (
                                  <p className="text-xs text-destructive font-normal normal-case">
                                      (từ {itemOriginalTotal.toLocaleString('vi-VN')})
                                  </p>
                              )}
                            </TableCell>
                            <TableCell className="text-center py-2 align-middle">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive/80"
                                onClick={() => onUpdateCartQuantity(item.id, '0')}
                                aria-label="Xóa sản phẩm khỏi giỏ hàng"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 mt-auto pt-4 border-t px-3 pb-3">
              <div className={cn("flex justify-between font-bold w-full text-foreground", numericDisplaySize)}>
                <span>Tổng cộng:</span>
                <span>{subtotalAfterItemDiscounts.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <Button
                onClick={handleOpenPaymentDialog}
                className="w-full bg-green-500 text-white hover:bg-green-600 text-lg py-3 h-auto"
                disabled={cart.length === 0 || !areAllItemDiscountsValid}
              >
                Thanh toán
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={isVariantSelectorOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSelectedProductNameForVariants(null);
          setVariantSelection({ color: '', quality: '', size: '', unit: '' });
        }
        setIsVariantSelectorOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chọn thuộc tính cho: {selectedProductNameForVariants}</DialogTitle>
            <DialogDescription>
              Vui lòng chọn màu sắc, chất lượng, kích thước và đơn vị.
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
              <Label htmlFor="variant-quality">Chất lượng</Label>
              <Select
                value={variantSelection.quality}
                onValueChange={(value) => handleVariantSelectionChange('quality', value)}
                disabled={!variantSelection.color || availableVariants.qualities.length === 0}
              >
                <SelectTrigger id="variant-quality" className="bg-card">
                  <SelectValue placeholder="Chọn chất lượng" />
                </SelectTrigger>
                <SelectContent>
                  {availableVariants.qualities.map(quality => (
                    <SelectItem key={quality} value={quality}>{quality || 'N/A'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="variant-size">Kích thước</Label>
              <Select
                value={variantSelection.size}
                onValueChange={(value) => handleVariantSelectionChange('size', value)}
                disabled={!variantSelection.color || !variantSelection.quality || availableVariants.sizes.length === 0}
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
                disabled={!variantSelection.color || !variantSelection.quality || !variantSelection.size || availableVariants.units.length === 0}
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
              disabled={!variantSelection.color || !variantSelection.quality || !variantSelection.size || !variantSelection.unit || !selectedVariantDetails}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Thêm vào giỏ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Tìm khách hàng hoặc nhập tên mới..."
                      value={customerSearchText}
                      onValueChange={(value) => {
                        setCustomerSearchText(value);
                        if (!customers.some(c => normalizeStringForSearch(c.name) === normalizeStringForSearch(value.trim())) && value.trim().toLowerCase() !== "khách lẻ") {
                            setCustomerNameForInvoice(value.trim());
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {customerSearchText.trim() ? `Sử dụng tên mới: "${customerSearchText.trim()}"` : "Nhập tên để tìm hoặc thêm mới."}
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                            key="guest"
                            value="Khách lẻ"
                            onSelect={() => {
                                setCustomerNameForInvoice("Khách lẻ");
                                setCustomerSearchText("Khách lẻ");
                                setOpenCustomerCombobox(false);
                            }}
                        >
                             <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                customerNameForInvoice === "Khách lẻ" ? "opacity-100" : "opacity-0"
                                )}
                            />
                            Khách lẻ
                        </CommandItem>
                        {customers
                          .filter(c => normalizeStringForSearch(c.name).includes(normalizeStringForSearch(customerSearchText)) || (c.phone && c.phone.includes(customerSearchText)))
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
                       !customers.some(c => normalizeStringForSearch(c.name) === normalizeStringForSearch(customerSearchText.trim())) &&
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
                          Thêm mới & sử dụng: "{customerSearchText.trim()}"
                        </CommandItem>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-between items-center">
              <Label>Tổng tiền hàng (sau GG SP):</Label>
              <span className={cn("font-semibold", numericDisplaySize)}>{subtotalAfterItemDiscounts.toLocaleString('vi-VN')} VNĐ</span>
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
              <Label htmlFor="overallDiscount">Giảm giá thêm (Nghìn VND)</Label>
              <Input
                id="overallDiscount"
                type="number"
                value={overallDiscountStr}
                onChange={(e) => setOverallDiscountStr(e.target.value)}
                min="0"
                className="bg-card hide-number-spinners"
                disabled={isEveryItemAtMaxPossibleDiscount && cart.length > 0}
              />
               {isEveryItemAtMaxPossibleDiscount && cart.length > 0 && (
                <p className="text-xs text-muted-foreground">Tất cả sản phẩm đã ở mức giảm giá tối đa. Không thể giảm thêm.</p>
              )}
            </div>

            <div className="flex justify-between items-center text-red-500">
              <Label className={cn("text-red-500", numericDisplaySize === "text-xl" ? "text-lg" : numericDisplaySize === "text-2xl" ? "text-xl" : numericDisplaySize === "text-3xl" ? "text-2xl" : "text-3xl" )}>Thành tiền (sau tất cả GG):</Label>
              <span className={cn("font-semibold", numericDisplaySize)}>{finalTotalAfterAllDiscounts.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <Separator/>

            <div className="space-y-1">
              <Label htmlFor="amountPaid" className={cn(numericDisplaySize === "text-xl" ? "text-lg" : numericDisplaySize === "text-2xl" ? "text-xl" : numericDisplaySize === "text-3xl" ? "text-2xl" : "text-3xl" )}>Số tiền khách trả (Nghìn VND)</Label>
              <Input
                id="amountPaid"
                type="number"
                value={amountPaidStr}
                onChange={(e) => setAmountPaidStr(e.target.value)}
                min="0"
                className="bg-card hide-number-spinners"
              />
            </div>


            <div className="flex justify-between items-center">
              <Label className={cn(numericDisplaySize === "text-xl" ? "text-lg" : numericDisplaySize === "text-2xl" ? "text-xl" : numericDisplaySize === "text-3xl" ? "text-2xl" : "text-3xl" )}>Tiền thừa:</Label>
              <span className={cn("font-semibold", numericDisplaySize)}>{changeVND >= 0 && actualAmountPaidVND > 0 && actualAmountPaidVND >= finalTotalAfterAllDiscounts ? changeVND.toLocaleString('vi-VN') : '0'} VNĐ</span>
            </div>
            {finalTotalAfterAllDiscounts > actualAmountPaidVND && customerNameForInvoice.toLowerCase() !== 'khách lẻ' && currentPaymentMethod !== 'Chuyển khoản' && (
                 <div className="flex justify-between items-center text-red-600">
                    <Label className={cn("text-red-600", numericDisplaySize === "text-xl" ? "text-lg" : numericDisplaySize === "text-2xl" ? "text-xl" : numericDisplaySize === "text-3xl" ? "text-2xl" : "text-3xl" )}>Còn nợ:</Label>
                    <span className={cn("font-semibold", numericDisplaySize)}>{(finalTotalAfterAllDiscounts - actualAmountPaidVND).toLocaleString('vi-VN')} VNĐ</span>
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
              className="w-full bg-green-500 text-white hover:bg-green-600"
              disabled={
                finalTotalAfterAllDiscounts < 0 ||
                subtotalAfterItemDiscounts < actualOverallInvoiceDiscountVND ||
                (customerNameForInvoice.trim().toLowerCase() === 'khách lẻ' && finalTotalAfterAllDiscounts > actualAmountPaidVND && currentPaymentMethod !== 'Chuyển khoản') || 
                (currentPaymentMethod === 'Chuyển khoản' && finalTotalAfterAllDiscounts > actualAmountPaidVND) ||
                !areAllItemDiscountsValid
              }
            >
              Xác nhận thanh toán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


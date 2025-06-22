
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Product, ProductOptionType, ProductFormData } from '@/types';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter, 
    DialogDescription 
} from "@/components/ui/dialog";
import Image from 'next/image';
import { PlusCircle, Trash2, Settings, Pencil, Search, BadgePercent, PackageX, ChevronsUpDown, Check, Store, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { normalizeStringForSearch, cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '../ui/textarea';


interface InventoryTabProps {
  inventory: Product[];
  onOpenAddProductDialog: () => void;
  onOpenEditProductDialog: (product: Product) => void;
  onDeleteProduct: (productId: string) => Promise<void>;
  productNameOptions: string[];
  colorOptions: string[];
  productQualityOptions: string[];
  sizeOptions: string[];
  unitOptions: string[];
  onAddOption: (type: ProductOptionType, name: string) => Promise<void>;
  onDeleteOption: (type: ProductOptionType, name: string) => Promise<void>;
  hasFullAccessRights: boolean;
  onDisposeProductItems: (
    productId: string, 
    quantityToDecrease: number, 
    reason: string,
    productDetails: Pick<Product, 'name' | 'color' | 'quality' | 'size' | 'unit' | 'image'>,
    employeeId: string,
    employeeName: string
  ) => Promise<void>;
  currentUser: User | null;
  onUpdateProductMaxDiscount: (productId: string, newMaxDiscountVND: number) => Promise<void>;
  storefrontProductIds: Record<string, boolean>;
  onAddToStorefront: (productId: string) => Promise<void>;
  onRemoveFromStorefront: (productId: string) => Promise<void>;
}


export function InventoryTab({ 
  inventory, 
  onOpenAddProductDialog,
  onOpenEditProductDialog,
  onDeleteProduct,
  productNameOptions,
  colorOptions,
  productQualityOptions,
  sizeOptions,
  unitOptions,
  onAddOption,
  onDeleteOption,
  hasFullAccessRights,
  onDisposeProductItems,
  currentUser,
  onUpdateProductMaxDiscount,
  storefrontProductIds,
  onAddToStorefront,
  onRemoveFromStorefront,
}: InventoryTabProps) {
  
  const [isOptionsDialogOpen, setIsOptionsDialogOpen] = useState(false);
  const [currentOptionType, setCurrentOptionType] = useState<ProductOptionType | null>(null);
  const [newOptionName, setNewOptionName] = useState('');
  const { toast } = useToast();
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');

  const [isSetMaxDiscountDialogOpen, setIsSetMaxDiscountDialogOpen] = useState(false);
  const [productToSetMaxDiscount, setProductToSetMaxDiscount] = useState<Product | null>(null);
  const [currentMaxDiscountInput, setCurrentMaxDiscountInput] = useState('');

  const [selectedProductForDisposal, setSelectedProductForDisposal] = useState<(Product & {displayLabel: string}) | null>(null);
  const [quantityToDispose, setQuantityToDispose] = useState('');
  const [disposeReason, setDisposeReason] = useState('');
  const [isDisposeComboboxOpen, setIsDisposeComboboxOpen] = useState(false);
  const [disposeSearchQuery, setDisposeSearchQuery] = useState('');


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
    }
  };

  const getOptionsForType = (type: ProductOptionType | null): string[] => {
    if (type === 'productNames') return productNameOptions;
    if (type === 'colors') return colorOptions;
    if (type === 'qualities') return productQualityOptions;
    if (type === 'sizes') return sizeOptions;
    if (type === 'units') return unitOptions;
    return [];
  };
  
  const getOptionDialogTitle = (type: ProductOptionType | null): string => {
    if (type === 'productNames') return 'Quản lý Tên sản phẩm';
    if (type === 'colors') return 'Quản lý Màu sắc';
    if (type === 'qualities') return 'Quản lý Chất lượng';
    if (type === 'sizes') return 'Quản lý Kích thước';
    if (type === 'units') return 'Quản lý Đơn vị';
    return 'Quản lý tùy chọn';
  };

  const handleOpenSetMaxDiscountDialog = (product: Product) => {
    setProductToSetMaxDiscount(product);
    setCurrentMaxDiscountInput(product.maxDiscountPerUnitVND ? (product.maxDiscountPerUnitVND / 1000).toString() : '0');
    setIsSetMaxDiscountDialogOpen(true);
  };

  const handleSaveMaxDiscount = async () => {
    if (!productToSetMaxDiscount) return;
    const newMaxDiscountNghin = parseFloat(currentMaxDiscountInput);
    if (isNaN(newMaxDiscountNghin) || newMaxDiscountNghin < 0) {
      toast({ title: "Lỗi", description: "Số tiền giảm giá tối đa không hợp lệ.", variant: "destructive" });
      return;
    }
    if ((newMaxDiscountNghin * 1000) > productToSetMaxDiscount.price) {
       toast({ title: "Lỗi", description: "Giảm giá tối đa không được vượt quá giá bán của sản phẩm.", variant: "destructive" });
      return;
    }
    
    await onUpdateProductMaxDiscount(productToSetMaxDiscount.id, newMaxDiscountNghin * 1000);
    
    setIsSetMaxDiscountDialogOpen(false);
    setProductToSetMaxDiscount(null);
  };


  const filteredInventory = useMemo(() => {
    if (!inventorySearchQuery.trim()) {
      return inventory;
    }
    const normalizedQuery = normalizeStringForSearch(inventorySearchQuery);
    return inventory.filter(item => {
      const searchableText = [
        item.name,
        item.color,
        item.quality,
        item.size,
        item.unit,
      ].join(' ');
      return normalizeStringForSearch(searchableText).includes(normalizedQuery);
    });
  }, [inventory, inventorySearchQuery]);

  const distinctInventoryForDisposal = useMemo(() => {
    return inventory
      .filter(p => p.quantity > 0) 
      .map(p => ({
        ...p,
        displayLabel: `${p.name} - ${p.color} - ${p.quality || ''} - ${p.size} - ${p.unit} (Tồn: ${p.quantity})`.replace(/\s-\s-/g, ' - ')
      }));
  }, [inventory]);

  const handleConfirmDisposal = async () => {
    if (!selectedProductForDisposal || !quantityToDispose || !currentUser) {
        toast({ title: "Thiếu thông tin", description: "Vui lòng chọn sản phẩm, nhập số lượng cần loại bỏ và đảm bảo bạn đã đăng nhập.", variant: "destructive" });
        return;
    }
    const qty = parseInt(quantityToDispose);
    if (isNaN(qty) || qty <= 0) {
        toast({ title: "Số lượng không hợp lệ", description: "Số lượng loại bỏ phải là số dương.", variant: "destructive" });
        return;
    }
    if (qty > selectedProductForDisposal.quantity) {
        toast({ title: "Số lượng vượt tồn kho", description: `Không thể loại bỏ ${qty} ${selectedProductForDisposal.unit}, chỉ còn ${selectedProductForDisposal.quantity} trong kho.`, variant: "destructive" });
        return;
    }

    const productDetailsToLog = {
      name: selectedProductForDisposal.name,
      color: selectedProductForDisposal.color,
      quality: selectedProductForDisposal.quality,
      size: selectedProductForDisposal.size,
      unit: selectedProductForDisposal.unit,
      image: selectedProductForDisposal.image
    };

    await onDisposeProductItems(
      selectedProductForDisposal.id, 
      qty, 
      disposeReason.trim(),
      productDetailsToLog,
      currentUser.uid,
      currentUser.displayName || currentUser.email || "Không rõ"
    );
    setSelectedProductForDisposal(null);
    setQuantityToDispose('');
    setDisposeReason('');
    setDisposeSearchQuery('');
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-end items-center">
          <div className="flex gap-2 items-center flex-wrap">
            <Button onClick={() => openOptionsDialog('productNames')} variant="outline" size="sm">
              <Settings className="mr-1 h-3 w-3" /> Tên Sản Phẩm
            </Button>
            <Button onClick={() => openOptionsDialog('colors')} variant="outline" size="sm">
              <Settings className="mr-1 h-3 w-3" /> Màu sắc
            </Button>
            <Button onClick={() => openOptionsDialog('qualities')} variant="outline" size="sm">
              <Settings className="mr-1 h-3 w-3" /> Chất lượng
            </Button>
            <Button onClick={() => openOptionsDialog('sizes')} variant="outline" size="sm">
              <Settings className="mr-1 h-3 w-3" /> Kích thước
            </Button>
            <Button onClick={() => openOptionsDialog('units')} variant="outline" size="sm">
              <Settings className="mr-1 h-3 w-3" /> Đơn vị
            </Button>
            {hasFullAccessRights && (
              <Button 
                  onClick={onOpenAddProductDialog} 
                  variant="default" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90" 
                  size="sm"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Thêm sản phẩm
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mt-6 mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <CardTitle className="text-center sm:text-left">Danh sách sản phẩm</CardTitle>
          <div className="relative w-full sm:w-auto sm:min-w-[250px]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm sản phẩm..."
              value={inventorySearchQuery}
              onChange={(e) => setInventorySearchQuery(e.target.value)}
              className="pl-8 w-full bg-card"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  <TableHead key="h-stt" className="w-12">STT</TableHead>,
                  <TableHead key="h-product">Sản phẩm</TableHead>,
                  <TableHead key="h-color">Màu sắc</TableHead>,
                  <TableHead key="h-quality">Chất lượng</TableHead>,
                  <TableHead key="h-size">Kích thước</TableHead>,
                  <TableHead key="h-unit">Đơn vị</TableHead>,
                  <TableHead key="h-quantity" className="text-right">Số lượng</TableHead>,
                  <TableHead key="h-costPrice" className="text-right">Giá gốc</TableHead>,
                  <TableHead key="h-price" className="text-right">Giá bán</TableHead>,
                  <TableHead key="h-maxDiscount" className="text-right">Tối đa GG/ĐV</TableHead>,
                  <TableHead key="h-storefront" className="text-center">Gian hàng</TableHead>,
                  <TableHead key="h-actions" className="text-center">Hành động</TableHead>,
                ]}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="flex items-center">
                    <Image 
                        src={item.image || `https://placehold.co/40x40.png`} 
                        alt={item.name} 
                        width={40} 
                        height={40} 
                        className="w-10 h-10 rounded-md object-cover mr-4 aspect-square" 
                        data-ai-hint={`${item.name.split(' ')[0]} flower`}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://placehold.co/40x40.png';
                        }}
                    />
                    {item.name}
                  </TableCell>
                  <TableCell>{item.color || 'N/A'}</TableCell>
                  <TableCell>{item.quality || 'N/A'}</TableCell>
                  <TableCell>{item.size || 'N/A'}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{(item.costPrice ?? 0).toLocaleString('vi-VN')} VNĐ</TableCell>
                  <TableCell className="text-right">{item.price.toLocaleString('vi-VN')} VNĐ</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {item.maxDiscountPerUnitVND === 0
                      ? '0 VNĐ'
                      : (item.maxDiscountPerUnitVND && item.maxDiscountPerUnitVND > 0)
                        ? `${item.maxDiscountPerUnitVND.toLocaleString('vi-VN')} VNĐ`
                        : 'Không GH'}
                  </TableCell>
                  <TableCell className="text-center">
                    {hasFullAccessRights && (
                        storefrontProductIds[item.id] ? (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRemoveFromStorefront(item.id)} title="Gỡ khỏi gian hàng">
                                <XCircle className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-primary" onClick={() => onAddToStorefront(item.id)} title="Thêm vào gian hàng">
                                <Store className="h-4 w-4" />
                            </Button>
                        )
                    )}
                  </TableCell>
                  <TableCell className="text-center space-x-1">
                    {hasFullAccessRights && (
                      <>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenSetMaxDiscountDialog(item)} title="Giới hạn giảm giá">
                            <BadgePercent className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onOpenEditProductDialog(item)} title="Sửa sản phẩm">
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onDeleteProduct(item.id)} title="Xóa sản phẩm">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredInventory.length === 0 && (
                <TableRow>
                    <TableCell colSpan={12} className="text-center text-muted-foreground py-10">
                      {inventorySearchQuery ? `Không tìm thấy sản phẩm nào với "${inventorySearchQuery}".` : "Chưa có sản phẩm nào. Hãy thêm sản phẩm mới."}
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {hasFullAccessRights && (
            <Separator className="my-8" />
        )}

        {hasFullAccessRights && (
            <Card className="mt-6 border-orange-500 border-2">
            <CardHeader className="bg-orange-500/10">
                <CardTitle className="text-xl text-orange-600 flex items-center">
                    <PackageX className="mr-2 h-6 w-6" />
                    Loại bỏ hàng hỏng/không bán được
                </CardTitle>
                <CardDescription className="text-orange-700/80">
                    Giảm số lượng tồn kho cho các sản phẩm bị hỏng, hết hạn hoặc không thể bán được.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="productToDispose">Sản phẩm cần loại bỏ (*)</Label>
                        <Popover open={isDisposeComboboxOpen} onOpenChange={setIsDisposeComboboxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                id="productToDispose"
                                variant="outline"
                                role="combobox"
                                aria-expanded={isDisposeComboboxOpen}
                                className="w-full justify-between bg-card text-foreground hover:text-foreground"
                                >
                                {selectedProductForDisposal
                                    ? selectedProductForDisposal.displayLabel
                                    : "Chọn sản phẩm..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command shouldFilter={false}>
                                <CommandInput
                                    placeholder="Tìm sản phẩm để loại bỏ..."
                                    value={disposeSearchQuery}
                                    onValueChange={setDisposeSearchQuery}
                                />
                                <CommandList>
                                    <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
                                    <CommandGroup heading="Sản phẩm trong kho (có số lượng > 0)">
                                    {distinctInventoryForDisposal
                                        .filter(variant => 
                                            normalizeStringForSearch(variant.displayLabel).includes(normalizeStringForSearch(disposeSearchQuery))
                                        )
                                        .map((variant) => (
                                        <CommandItem
                                            key={variant.id}
                                            value={variant.id}
                                            onSelect={(currentValue) => {
                                                const product = inventory.find(p => p.id === currentValue);
                                                setSelectedProductForDisposal(product ? {...product, displayLabel: variant.displayLabel} as (Product & {displayLabel: string}) : null);
                                                setDisposeSearchQuery("");
                                                setIsDisposeComboboxOpen(false);
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedProductForDisposal?.id === variant.id ? "opacity-100" : "opacity-0"
                                            )}
                                            />
                                            {variant.displayLabel}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="quantityToDispose">Số lượng loại bỏ (*)</Label>
                        <Input
                            id="quantityToDispose"
                            type="number"
                            value={quantityToDispose}
                            onChange={(e) => setQuantityToDispose(e.target.value)}
                            placeholder="Nhập số lượng"
                            min="1"
                            className="bg-card"
                            disabled={!selectedProductForDisposal}
                        />
                         {selectedProductForDisposal && (
                            <p className="text-xs text-muted-foreground">Tồn kho hiện tại: {selectedProductForDisposal.quantity} {selectedProductForDisposal.unit}</p>
                        )}
                    </div>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="disposeReason">Lý do loại bỏ</Label>
                    <Textarea
                        id="disposeReason"
                        value={disposeReason}
                        onChange={(e) => setDisposeReason(e.target.value)}
                        placeholder="VD: Hàng hỏng do vận chuyển, hết hạn sử dụng,..."
                        className="bg-card"
                    />
                </div>
                <Button 
                    onClick={handleConfirmDisposal} 
                    className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={!selectedProductForDisposal || !quantityToDispose || parseInt(quantityToDispose) <= 0 || !currentUser}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xác nhận loại bỏ
                </Button>
            </CardContent>
            </Card>
        )}
      </CardContent>

      {currentOptionType && (
        <Dialog open={isOptionsDialogOpen} onOpenChange={setIsOptionsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{getOptionDialogTitle(currentOptionType)}</DialogTitle>
              <DialogDescription>
                Thêm mới hoặc xóa các tùy chọn {currentOptionType === 'productNames' ? 'tên sản phẩm' : currentOptionType === 'colors' ? 'màu sắc' : currentOptionType === 'qualities' ? 'chất lượng' : currentOptionType === 'sizes' ? 'kích thước' : 'đơn vị'}.
              </DialogDescription>
            </DialogHeader>
            {hasFullAccessRights && (
              <form onSubmit={handleAddNewOption} className="flex items-center gap-2 mt-4">
                <Input
                  type="text"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  placeholder={`Tên ${currentOptionType === 'productNames' ? 'sản phẩm' : currentOptionType === 'colors' ? 'màu' : currentOptionType === 'qualities' ? 'chất lượng' : currentOptionType === 'sizes' ? 'kích thước' : 'đơn vị'} mới`}
                  className="flex-grow"
                />
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground">Thêm</Button>
              </form>
            )}
            <div className="mt-4 max-h-60 overflow-y-auto">
              {getOptionsForType(currentOptionType).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Chưa có tùy chọn nào.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[
                        <TableHead key="opt-name">Tên tùy chọn</TableHead>,
                        hasFullAccessRights && <TableHead key="opt-delete" className="text-right">Xóa</TableHead>,
                      ].filter(Boolean)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getOptionsForType(currentOptionType).map(option => (
                      <TableRow key={option}>
                        <TableCell>{option}</TableCell>
                        {hasFullAccessRights && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => onDeleteOption(currentOptionType, option)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
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

      {isSetMaxDiscountDialogOpen && productToSetMaxDiscount && (
        <Dialog open={isSetMaxDiscountDialogOpen} onOpenChange={() => {setIsSetMaxDiscountDialogOpen(false); setProductToSetMaxDiscount(null);}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Giới hạn giảm giá cho sản phẩm</DialogTitle>
              <DialogDescription>
                Đặt giới hạn giảm giá tối đa cho phép trên mỗi đơn vị sản phẩm.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <p className="text-sm">
                    <strong>Sản phẩm:</strong> {productToSetMaxDiscount.name} ({productToSetMaxDiscount.color}, {productToSetMaxDiscount.quality || 'N/A'}, {productToSetMaxDiscount.size}, {productToSetMaxDiscount.unit})
                </p>
                <p className="text-sm">
                    <strong>Giá bán hiện tại / đơn vị:</strong> {(productToSetMaxDiscount.price / 1000).toLocaleString('vi-VN')} Nghìn VNĐ
                </p>
              <div>
                <Label htmlFor="maxDiscountInput">Giảm giá tối đa / đơn vị (Nghìn VND)</Label>
                <Input
                  id="maxDiscountInput"
                  type="number"
                  value={currentMaxDiscountInput}
                  onChange={(e) => setCurrentMaxDiscountInput(e.target.value)}
                  min="0"
                  step="any"
                  className="bg-card"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {setIsSetMaxDiscountDialogOpen(false); setProductToSetMaxDiscount(null);}}>Hủy</Button>
              {hasFullAccessRights && (
                <Button onClick={handleSaveMaxDiscount} className="bg-primary text-primary-foreground">Lưu giới hạn</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

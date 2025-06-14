
"use client";

import React, { useState, useEffect } from 'react';
import type { Product, ProductOptionType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter, 
    DialogDescription 
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from 'next/image';
import { PlusCircle, Trash2, Settings, Pencil } from 'lucide-react';

const EMPTY_COLOR_VALUE = "__EMPTY_COLOR__";
const EMPTY_SIZE_VALUE = "__EMPTY_SIZE__";

interface InventoryTabProps {
  inventory: Product[];
  onAddProduct: (newProductData: Omit<Product, 'id'>) => Promise<void>;
  onUpdateProduct: (productId: string, updatedProductData: Omit<Product, 'id'>) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  productNameOptions: string[];
  colorOptions: string[];
  sizeOptions: string[];
  unitOptions: string[];
  onAddOption: (type: ProductOptionType, name: string) => Promise<void>;
  onDeleteOption: (type: ProductOptionType, name: string) => Promise<void>;
}

type FormProduct = Omit<Product, 'id' | 'quantity' | 'price' | 'costPrice'> & { quantity: string; price: string; costPrice: string };

const initialFormProductState: FormProduct = {
    name: '', quantity: '0', price: '0', costPrice: '0', image: '', color: '', size: '', unit: ''
};

export function InventoryTab({ 
  inventory, 
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  productNameOptions,
  colorOptions,
  sizeOptions,
  unitOptions,
  onAddOption,
  onDeleteOption 
}: InventoryTabProps) {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newItem, setNewItem] = useState<FormProduct>(initialFormProductState);

  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [editedItem, setEditedItem] = useState<FormProduct>(initialFormProductState);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  const [isOptionsDialogOpen, setIsOptionsDialogOpen] = useState(false);
  const [currentOptionType, setCurrentOptionType] = useState<ProductOptionType | null>(null);
  const [newOptionName, setNewOptionName] = useState('');

  useEffect(() => {
    const defaultProductName = productNameOptions.length > 0 ? productNameOptions[0] : '';
    const defaultUnit = unitOptions.length > 0 ? unitOptions[0] : '';
    
    const updateFormStateDefaults = (currentFormState: FormProduct) => {
        let updatedState = { ...currentFormState };
        if (!currentFormState.name && defaultProductName) {
            updatedState.name = defaultProductName;
        }
        if (!currentFormState.unit && defaultUnit) {
            updatedState.unit = defaultUnit;
        }
        return updatedState;
    };

    if (isAddingProduct) {
        setNewItem(updateFormStateDefaults);
    }
    if (isEditingProduct && productToEdit) {
        // When opening edit, original values are set. This ensures defaults if those were empty.
        // However, productToEdit should already have name/unit. This is more for newItem.
    }

  }, [productNameOptions, unitOptions, isAddingProduct, isEditingProduct, productToEdit]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, formSetter: React.Dispatch<React.SetStateAction<FormProduct>>) => {
    const { name, value } = e.target;
    formSetter(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (fieldName: keyof FormProduct, value: string, formSetter: React.Dispatch<React.SetStateAction<FormProduct>>) => {
    let actualValue = value;
    if (fieldName === 'color' && value === EMPTY_COLOR_VALUE) actualValue = '';
    else if (fieldName === 'size' && value === EMPTY_SIZE_VALUE) actualValue = '';
    
    formSetter(prev => ({ ...prev, [fieldName]: actualValue }));
  };
  
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.unit || parseInt(newItem.quantity) < 0 || parseInt(newItem.costPrice) < 0 || parseInt(newItem.price) < 0) {
      alert("Vui lòng điền đầy đủ thông tin hợp lệ cho sản phẩm (Tên, Đơn vị, Số lượng >= 0, Giá gốc >=0, Giá bán >= 0).");
      return;
    }
    const newProductData: Omit<Product, 'id'> = {
      name: newItem.name,
      quantity: parseInt(newItem.quantity),
      price: parseInt(newItem.price),
      costPrice: parseInt(newItem.costPrice) || 0,
      image: newItem.image || `https://placehold.co/100x100.png`,
      color: newItem.color,
      size: newItem.size,
      unit: newItem.unit,
    };
    await onAddProduct(newProductData);
    setNewItem({
        ...initialFormProductState, 
        name: productNameOptions.length > 0 ? productNameOptions[0] : '', 
        unit: unitOptions.length > 0 ? unitOptions[0] : ''
    });
    setIsAddingProduct(false);
  };

  const openEditDialog = (product: Product) => {
    setProductToEdit(product);
    setEditedItem({
      name: product.name,
      quantity: product.quantity.toString(),
      price: product.price.toString(),
      costPrice: product.costPrice?.toString() || '0',
      image: product.image,
      color: product.color,
      size: product.size,
      unit: product.unit
    });
    setIsEditingProduct(true);
    setIsAddingProduct(false); 
  };

  const handleUpdateExistingProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToEdit || !editedItem.name || !editedItem.unit || parseInt(editedItem.quantity) < 0 || parseInt(editedItem.costPrice) < 0 || parseInt(editedItem.price) < 0) {
      alert("Vui lòng điền đầy đủ thông tin hợp lệ cho sản phẩm.");
      return;
    }
    const updatedProductData: Omit<Product, 'id'> = {
      name: editedItem.name,
      quantity: parseInt(editedItem.quantity),
      price: parseInt(editedItem.price),
      costPrice: parseInt(editedItem.costPrice) || 0,
      image: editedItem.image || `https://placehold.co/100x100.png`,
      color: editedItem.color,
      size: editedItem.size,
      unit: editedItem.unit,
    };
    await onUpdateProduct(productToEdit.id, updatedProductData);
    setIsEditingProduct(false);
    setProductToEdit(null);
  };

  const openDeleteConfirmDialog = (product: Product) => {
    setProductToDelete(product);
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      await onDeleteProduct(productToDelete.id);
      setIsConfirmingDelete(false);
      setProductToDelete(null);
    }
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
    }
  };

  const getOptionsForType = (type: ProductOptionType | null): string[] => {
    if (type === 'productNames') return productNameOptions;
    if (type === 'colors') return colorOptions;
    if (type === 'sizes') return sizeOptions;
    if (type === 'units') return unitOptions;
    return [];
  };
  
  const getOptionDialogTitle = (type: ProductOptionType | null): string => {
    if (type === 'productNames') return 'Quản lý Tên sản phẩm';
    if (type === 'colors') return 'Quản lý Màu sắc';
    if (type === 'sizes') return 'Quản lý Kích thước';
    if (type === 'units') return 'Quản lý Đơn vị';
    return 'Quản lý tùy chọn';
  };

  const renderProductForm = (
    formState: FormProduct, 
    formSetter: React.Dispatch<React.SetStateAction<FormProduct>>, 
    handleSubmit: (e: React.FormEvent) => Promise<void>,
    isEditMode: boolean
    ) => (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-muted/50 rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div>
            <label className="text-sm text-foreground">Tên sản phẩm (*)</label>
            <Select value={formState.name} onValueChange={(value) => handleSelectChange('name', value, formSetter)} required disabled={productNameOptions.length === 0 && !formState.name}>
                <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder="Chọn tên sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                    {productNameOptions.length === 0 ? (
                         <SelectItem value="no-name-option" disabled>Vui lòng thêm Tên SP ở mục quản lý</SelectItem>
                    ) : (
                        productNameOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
        </div>
        <div>
            <label className="text-sm text-foreground">Màu sắc</label>
            <Select value={formState.color === '' ? EMPTY_COLOR_VALUE : formState.color} onValueChange={(value) => handleSelectChange('color', value, formSetter)}>
                <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder="Chọn màu sắc (tùy chọn)" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={EMPTY_COLOR_VALUE}>Để trống</SelectItem>
                    {colorOptions.map(option => ( <SelectItem key={option} value={option}>{option}</SelectItem> ))}
                    {colorOptions.length === 0 && formState.color !== '' && <SelectItem value="no-color-option" disabled>Vui lòng thêm Màu ở mục quản lý</SelectItem>}
                </SelectContent>
            </Select>
        </div>
        <div>
            <label className="text-sm text-foreground">Kích thước</label>
            <Select value={formState.size === '' ? EMPTY_SIZE_VALUE : formState.size} onValueChange={(value) => handleSelectChange('size', value, formSetter)}>
                <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder="Chọn kích thước (tùy chọn)" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={EMPTY_SIZE_VALUE}>Để trống</SelectItem>
                    {sizeOptions.map(option => ( <SelectItem key={option} value={option}>{option}</SelectItem> ))}
                    {sizeOptions.length === 0 && formState.size !== '' && <SelectItem value="no-size-option" disabled>Vui lòng thêm Kích thước ở mục quản lý</SelectItem>}
                </SelectContent>
            </Select>
        </div>
        <div>
            <label className="text-sm text-foreground">Đơn vị (*)</label>
            <Select value={formState.unit} onValueChange={(value) => handleSelectChange('unit', value, formSetter)} required disabled={unitOptions.length === 0 && !formState.unit}>
                <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder="Chọn đơn vị" />
                </SelectTrigger>
                <SelectContent>
                    {unitOptions.length === 0 ? (
                         <SelectItem value="no-unit-option" disabled>Vui lòng thêm Đơn vị ở mục quản lý</SelectItem>
                    ) : (
                        unitOptions.map(option => ( <SelectItem key={option} value={option}>{option}</SelectItem> ))
                    )}
                </SelectContent>
            </Select>
        </div>
        <div>
            <label className="text-sm text-foreground">Số lượng (*)</label>
            <Input type="number" name="quantity" placeholder="50" value={formState.quantity} onChange={(e) => handleInputChange(e, formSetter)} required min="0" className="bg-card"/>
        </div>
        <div>
            <label className="text-sm text-foreground">Giá gốc (VNĐ) (*)</label>
            <Input type="number" name="costPrice" placeholder="5000" value={formState.costPrice} onChange={(e) => handleInputChange(e, formSetter)} required min="0" className="bg-card"/>
        </div>
        <div>
            <label className="text-sm text-foreground">Giá bán (VNĐ) (*)</label>
            <Input type="number" name="price" placeholder="10000" value={formState.price} onChange={(e) => handleInputChange(e, formSetter)} required min="0" className="bg-card"/>
        </div>
        <div className="sm:col-span-2 md:col-span-3">
            <label className="text-sm text-foreground">URL Hình ảnh</label>
            <Input type="text" name="image" placeholder="https://placehold.co/100x100.png" value={formState.image} onChange={(e) => handleInputChange(e, formSetter)} className="bg-card"/>
        </div>
        <Button type="submit" className="bg-green-500 text-white hover:bg-green-600 h-10 md:col-start-4" disabled={(!formState.name && productNameOptions.length === 0) || (!formState.unit && unitOptions.length === 0) }>
            {isEditMode ? 'Lưu thay đổi' : 'Lưu sản phẩm'}
        </Button>
    </form>
  );


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-end items-center">
          <div className="flex gap-2 items-center flex-wrap">
            <Button onClick={() => openOptionsDialog('productNames')} variant="outline" size="sm">
              <Settings className="mr-1 h-3 w-3" /> Tên SP
            </Button>
            <Button onClick={() => openOptionsDialog('colors')} variant="outline" size="sm">
              <Settings className="mr-1 h-3 w-3" /> Màu sắc
            </Button>
            <Button onClick={() => openOptionsDialog('sizes')} variant="outline" size="sm">
              <Settings className="mr-1 h-3 w-3" /> Kích thước
            </Button>
            <Button onClick={() => openOptionsDialog('units')} variant="outline" size="sm">
              <Settings className="mr-1 h-3 w-3" /> Đơn vị
            </Button>
            <Button onClick={() => { 
                const isCurrentlyAdding = !isAddingProduct;
                setIsAddingProduct(isCurrentlyAdding); 
                setIsEditingProduct(false); 
                if (isCurrentlyAdding) {
                    setNewItem({
                        ...initialFormProductState, 
                        name: productNameOptions.length > 0 ? productNameOptions[0] : '', 
                        unit: unitOptions.length > 0 ? unitOptions[0] : ''
                    });
                }
             }} variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> {isAddingProduct ? 'Hủy thêm mới' : 'Thêm sản phẩm'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isAddingProduct && renderProductForm(newItem, setNewItem, handleAddItem, false)}
        {isEditingProduct && productToEdit && renderProductForm(editedItem, setEditedItem, handleUpdateExistingProduct, true)}


        <CardTitle className="mt-6 mb-4 text-center sm:text-left">Danh sách sản phẩm</CardTitle>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Màu sắc</TableHead>
                <TableHead>Kích thước</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Giá gốc (VNĐ)</TableHead>
                <TableHead className="text-right">Giá bán (VNĐ)</TableHead>
                <TableHead className="text-center">Hành động</TableHead>
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
                  <TableCell>{item.color || 'N/A'}</TableCell>
                  <TableCell>{item.size || 'N/A'}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{(item.costPrice ?? 0).toLocaleString('vi-VN')}</TableCell>
                  <TableCell className="text-right">{item.price.toLocaleString('vi-VN')}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => openDeleteConfirmDialog(item)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {inventory.length === 0 && !isAddingProduct && !isEditingProduct && (
                <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">Chưa có sản phẩm nào. Hãy thêm sản phẩm mới.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {isEditingProduct && productToEdit && (
        <Dialog open={isEditingProduct} onOpenChange={(open) => { if(!open) { setIsEditingProduct(false); setProductToEdit(null); }}}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
                    <DialogDescription>Cập nhật thông tin cho sản phẩm: {productToEdit?.name}</DialogDescription>
                </DialogHeader>
                {/* Form is rendered directly in CardContent now when isEditingProduct is true */}
                 <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsEditingProduct(false); setProductToEdit(null); }}>Hủy</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
      
      {/* This separate rendering of edit form inside Dialog might be redundant if already in CardContent */}
      {/* Consider removing this if the main renderProductForm in CardContent is sufficient for editing */}


      {productToDelete && (
        <AlertDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa sản phẩm?</AlertDialogTitle>
                <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa sản phẩm "{productToDelete.name} ({productToDelete.color}, {productToDelete.size})" không? Hành động này không thể hoàn tác.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setProductToDelete(null)}>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {currentOptionType && (
        <Dialog open={isOptionsDialogOpen} onOpenChange={setIsOptionsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{getOptionDialogTitle(currentOptionType)}</DialogTitle>
              <DialogDescription>
                Thêm mới hoặc xóa các tùy chọn {currentOptionType === 'productNames' ? 'tên sản phẩm' : currentOptionType === 'colors' ? 'màu sắc' : currentOptionType === 'sizes' ? 'kích thước' : 'đơn vị'}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddNewOption} className="flex items-center gap-2 mt-4">
              <Input
                type="text"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder={`Tên ${currentOptionType === 'productNames' ? 'sản phẩm' : currentOptionType === 'colors' ? 'màu' : currentOptionType === 'sizes' ? 'kích thước' : 'đơn vị'} mới`}
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
    

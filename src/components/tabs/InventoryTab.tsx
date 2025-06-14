
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
import { PlusCircle, Trash2, Settings, Pencil, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type FormProduct = Omit<Product, 'id' | 'quantity' | 'price' | 'costPrice'> & { quantity: string; price: string; costPrice: string };

const initialFormProductState: FormProduct = {
    name: '', color: '', size: '', unit: '', quantity: '', costPrice: '', price: '', image: ''
};

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [editedItem, setEditedItem] = useState<FormProduct>(initialFormProductState);
  const [editedImagePreview, setEditedImagePreview] = useState<string | null>(null);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  const [isOptionsDialogOpen, setIsOptionsDialogOpen] = useState(false);
  const [currentOptionType, setCurrentOptionType] = useState<ProductOptionType | null>(null);
  const [newOptionName, setNewOptionName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const defaultState = {
      ...initialFormProductState,
      name: productNameOptions.length > 0 ? productNameOptions[0] : '',
      color: colorOptions.length > 0 ? colorOptions[0] : '',
      size: sizeOptions.length > 0 ? sizeOptions[0] : '',
      unit: unitOptions.length > 0 ? unitOptions[0] : '',
      image: `https://placehold.co/100x100.png`, // Default placeholder
    };

    if (isAddingProduct) {
        setNewItem(currentFormState => ({
            ...defaultState, 
            ...currentFormState,
            name: currentFormState.name || defaultState.name,
            color: currentFormState.color || defaultState.color,
            size: currentFormState.size || defaultState.size,
            unit: currentFormState.unit || defaultState.unit,
            image: currentFormState.image || defaultState.image,
        }));
        setImagePreview(defaultState.image); 
    } else {
        setNewItem(defaultState);
        setImagePreview(null);
    }

    if (isEditingProduct && productToEdit) {
        const imageToUse = productToEdit.image || defaultState.image;
        setEditedItem({
            name: productToEdit.name,
            color: productToEdit.color,
            size: productToEdit.size,
            unit: productToEdit.unit,
            quantity: productToEdit.quantity.toString(),
            price: (productToEdit.price / 1000).toString(),
            costPrice: productToEdit.costPrice ? (productToEdit.costPrice / 1000).toString() : '',
            image: imageToUse,
        });
        setEditedImagePreview(imageToUse);
    } else if (!isEditingProduct) {
        setEditedItem(defaultState);
        setEditedImagePreview(null);
    }
  }, [productNameOptions, colorOptions, sizeOptions, unitOptions, isAddingProduct, isEditingProduct, productToEdit]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, formSetter: React.Dispatch<React.SetStateAction<FormProduct>>) => {
    const { name, value } = e.target;
    formSetter(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (fieldName: keyof FormProduct, value: string, formSetter: React.Dispatch<React.SetStateAction<FormProduct>>) => {
    formSetter(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleImageChange = async (
     e: React.ChangeEvent<HTMLInputElement>,
     formSetter: React.Dispatch<React.SetStateAction<FormProduct>>,
     previewSetter: React.Dispatch<React.SetStateAction<string | null>>
   ) => {
     const file = e.target.files?.[0];
     if (file) {
       if (file.size > 5 * 1024 * 1024) { // 5MB limit
         toast({ title: "Lỗi", description: "Kích thước file ảnh không được vượt quá 5MB.", variant: "destructive"});
         e.target.value = ""; 
         return;
       }
       const reader = new FileReader();
       reader.onloadend = () => {
         const dataUri = reader.result as string;
         formSetter(prev => ({ ...prev, image: dataUri }));
         previewSetter(dataUri);
       };
       reader.readAsDataURL(file);
     } else {
        // If no file is selected or selection is cancelled, revert to a default placeholder
        const placeholder = `https://placehold.co/100x100.png`;
        formSetter(prev => ({ ...prev, image: placeholder }));
        previewSetter(placeholder);
     }
   };
  
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.color || !newItem.size || !newItem.unit || newItem.quantity === '' || newItem.costPrice === '' || newItem.price === '' || parseInt(newItem.quantity) < 0 || parseFloat(newItem.costPrice) < 0 || parseFloat(newItem.price) < 0) {
      toast({title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin hợp lệ cho sản phẩm (Tên, Màu sắc, Kích thước, Đơn vị, Số lượng >= 0, Giá gốc >=0, Giá bán >= 0).", variant: "destructive"});
      return;
    }
    const newProductData: Omit<Product, 'id'> = {
      name: newItem.name,
      quantity: parseInt(newItem.quantity),
      price: parseFloat(newItem.price) * 1000, 
      costPrice: (parseFloat(newItem.costPrice) || 0) * 1000, 
      image: newItem.image || `https://placehold.co/100x100.png`,
      color: newItem.color,
      size: newItem.size,
      unit: newItem.unit,
    };
    await onAddProduct(newProductData);
    setNewItem({ 
        ...initialFormProductState, 
        name: productNameOptions.length > 0 ? productNameOptions[0] : '',
        color: colorOptions.length > 0 ? colorOptions[0] : '',
        size: sizeOptions.length > 0 ? sizeOptions[0] : '',
        unit: unitOptions.length > 0 ? unitOptions[0] : '',
        image: `https://placehold.co/100x100.png`,
    });
    setImagePreview(null);
    setIsAddingProduct(false);
  };

  const openEditDialog = (product: Product) => {
    setProductToEdit(product);
    setIsEditingProduct(true);
    setIsAddingProduct(false); 
  };

  const handleUpdateExistingProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToEdit || !editedItem.name || !editedItem.color || !editedItem.size || !editedItem.unit || editedItem.quantity === '' || editedItem.costPrice === '' || editedItem.price === '' || parseInt(editedItem.quantity) < 0 || parseFloat(editedItem.costPrice) < 0 || parseFloat(editedItem.price) < 0) {
      toast({title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin hợp lệ cho sản phẩm (Tên, Màu sắc, Kích thước, Đơn vị, Số lượng >= 0, Giá gốc >=0, Giá bán >= 0).", variant: "destructive"});
      return;
    }
    const updatedProductData: Omit<Product, 'id'> = {
      name: editedItem.name,
      quantity: parseInt(editedItem.quantity),
      price: parseFloat(editedItem.price) * 1000,
      costPrice: (parseFloat(editedItem.costPrice) || 0) * 1000,
      image: editedItem.image || `https://placehold.co/100x100.png`,
      color: editedItem.color,
      size: editedItem.size,
      unit: editedItem.unit,
    };
    await onUpdateProduct(productToEdit.id, updatedProductData);
    setIsEditingProduct(false);
    setProductToEdit(null);
    setEditedImagePreview(null);
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
    isEditMode: boolean,
    currentPreview: string | null
    ) => {
      const displayImage = currentPreview || formState.image || `https://placehold.co/100x100.png`;
      return (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-muted/50 rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start">
            {/* Fields for name, color, size, unit, quantity, costPrice, price */}
            <div>
                <label className="text-sm text-foreground">Tên sản phẩm (*)</label>
                <Select value={formState.name} onValueChange={(value) => handleSelectChange('name', value, formSetter)} required disabled={productNameOptions.length === 0}>
                    <SelectTrigger className="w-full bg-card">
                        <SelectValue placeholder="Chọn tên sản phẩm (*)" />
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
                <label className="text-sm text-foreground">Màu sắc (*)</label>
                <Select value={formState.color} onValueChange={(value) => handleSelectChange('color', value, formSetter)} required disabled={colorOptions.length === 0}>
                    <SelectTrigger className="w-full bg-card">
                        <SelectValue placeholder="Chọn màu sắc (*)" />
                    </SelectTrigger>
                    <SelectContent>
                        {colorOptions.length === 0 ? (
                            <SelectItem value="no-color-option" disabled>Vui lòng thêm Màu ở mục quản lý</SelectItem>
                        ) : (
                            colorOptions.map(option => ( <SelectItem key={option} value={option}>{option}</SelectItem> ))
                        )}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label className="text-sm text-foreground">Kích thước (*)</label>
                <Select value={formState.size} onValueChange={(value) => handleSelectChange('size', value, formSetter)} required disabled={sizeOptions.length === 0}>
                    <SelectTrigger className="w-full bg-card">
                        <SelectValue placeholder="Chọn kích thước (*)" />
                    </SelectTrigger>
                    <SelectContent>
                        {sizeOptions.length === 0 ? (
                            <SelectItem value="no-size-option" disabled>Vui lòng thêm Kích thước ở mục quản lý</SelectItem>
                        ) : (
                            sizeOptions.map(option => ( <SelectItem key={option} value={option}>{option}</SelectItem> ))
                        )}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label className="text-sm text-foreground">Đơn vị (*)</label>
                <Select value={formState.unit} onValueChange={(value) => handleSelectChange('unit', value, formSetter)} required disabled={unitOptions.length === 0}>
                    <SelectTrigger className="w-full bg-card">
                        <SelectValue placeholder="Chọn đơn vị (*)" />
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
                <Input type="number" name="quantity" value={formState.quantity} onChange={(e) => handleInputChange(e, formSetter)} required min="0" className="bg-card"/>
            </div>
            <div>
                <label className="text-sm text-foreground">Giá gốc (Nghìn VND) (*)</label>
                <Input type="number" name="costPrice" value={formState.costPrice} onChange={(e) => handleInputChange(e, formSetter)} required min="0" step="any" className="bg-card"/>
            </div>
            <div>
                <label className="text-sm text-foreground">Giá bán (Nghìn VND) (*)</label>
                <Input type="number" name="price" value={formState.price} onChange={(e) => handleInputChange(e, formSetter)} required min="0" step="any" className="bg-card"/>
            </div>
            
            {/* Image Upload and Preview */}
            <div className="md:col-span-2 flex flex-col">
                <label className="text-sm text-foreground mb-1">Hình ảnh sản phẩm</label>
                <div className="flex items-center gap-4">
                    <Input
                        id={isEditMode ? "editImageFile" : "newImageFile"}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, formSetter, isEditMode ? setEditedImagePreview : setImagePreview)}
                        className="bg-card flex-grow w-auto"
                    />
                    {displayImage && (
                        <Image
                            src={displayImage}
                            alt="Xem trước hình ảnh"
                            width={60}
                            height={60}
                            className="rounded-md object-cover border aspect-square"
                            data-ai-hint="flower product"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://placehold.co/60x60.png';
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Submit and Cancel Buttons */}
            <div className="md:col-span-2 flex justify-end items-end gap-2 mt-2 md:mt-0">
                {isEditMode && (
                    <Button 
                        type="button" 
                        onClick={() => { setIsEditingProduct(false); setProductToEdit(null); setEditedImagePreview(null); }} 
                        variant="outline" 
                        className="h-10"
                    >
                        Hủy
                    </Button>
                )}
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 flex-grow md:flex-grow-0" 
                    disabled={
                        (productNameOptions.length > 0 && !formState.name) || productNameOptions.length === 0 ||
                        (colorOptions.length > 0 && !formState.color) || colorOptions.length === 0 ||
                        (sizeOptions.length > 0 && !formState.size) || sizeOptions.length === 0 ||
                        (unitOptions.length > 0 && !formState.unit) || unitOptions.length === 0
                    }
                >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {isEditMode ? 'Lưu thay đổi' : 'Lưu sản phẩm'}
                </Button>
            </div>
        </form>
      );
    };


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
            <Button 
                onClick={() => { 
                    const isCurrentlyAdding = !isAddingProduct;
                    setIsAddingProduct(isCurrentlyAdding); 
                    if (isCurrentlyAdding) {
                        setIsEditingProduct(false); 
                        setProductToEdit(null);
                        setEditedImagePreview(null); 
                        setImagePreview(newItem.image || `https://placehold.co/100x100.png`);
                    } else {
                        setImagePreview(null);
                    }
                }} 
                variant="default" 
                className="bg-primary text-primary-foreground hover:bg-primary/90" 
                size="sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> {isAddingProduct ? 'Hủy thêm mới' : 'Thêm sản phẩm'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isAddingProduct && renderProductForm(newItem, setNewItem, handleAddItem, false, imagePreview)}
        {isEditingProduct && productToEdit && renderProductForm(editedItem, setEditedItem, handleUpdateExistingProduct, true, editedImagePreview)}


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
                <TableHead className="text-right">Giá gốc</TableHead>
                <TableHead className="text-right">Giá bán</TableHead>
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
                  <TableCell>{item.size || 'N/A'}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{(item.costPrice ?? 0).toLocaleString('vi-VN')} VNĐ</TableCell>
                  <TableCell className="text-right">{item.price.toLocaleString('vi-VN')} VNĐ</TableCell>
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

      {productToDelete && (
        <AlertDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa sản phẩm?</AlertDialogTitle>
                <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa sản phẩm "{productToDelete.name} ({productToDelete.color || 'Không màu'}, {productToDelete.size || 'Không kích thước'})" không? Hành động này không thể hoàn tác.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {setIsConfirmingDelete(false); setProductToDelete(null);}}>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Xóa</AlertDialogAction>
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
    

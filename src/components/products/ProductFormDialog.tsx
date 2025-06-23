
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import type { Product, ProductFormData } from '@/types'; // Using ProductFormData
import { UploadCloud } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { uploadImageAndGetURL } from '@/lib/firebase';

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Omit<Product, 'id'>, isEditMode: boolean, productId?: string) => Promise<void>;
  initialData?: Product | null;
  productNameOptions: string[];
  colorOptions: string[];
  productQualityOptions: string[];
  sizeOptions: string[];
  unitOptions: string[];
  isEditMode: boolean;
  defaultFormState: ProductFormData; // Pass default state from parent
}

export function ProductFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  productNameOptions,
  colorOptions,
  productQualityOptions,
  sizeOptions,
  unitOptions,
  isEditMode,
  defaultFormState,
}: ProductFormDialogProps) {
  const [formState, setFormState] = useState<ProductFormData>(defaultFormState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const placeholderImage = `https://placehold.co/100x100.png`;
    if (isOpen) {
      setImageFile(null); // Reset file on open
      if (isEditMode && initialData) {
        const populatedFormState: ProductFormData = {
          name: initialData.name,
          color: initialData.color,
          quality: initialData.quality || (productQualityOptions.length > 0 ? productQualityOptions[0] : ''),
          size: initialData.size,
          unit: initialData.unit,
          quantity: initialData.quantity.toString(),
          price: (initialData.price / 1000).toString(),
          costPrice: initialData.costPrice ? (initialData.costPrice / 1000).toString() : '',
          image: initialData.image || placeholderImage,
          maxDiscountPerUnitVND: initialData.maxDiscountPerUnitVND ? (initialData.maxDiscountPerUnitVND / 1000).toString() : '0',
        };
        setFormState(populatedFormState);
        setImagePreview(initialData.image || placeholderImage);
      } else {
        // For adding, use the defaultFormState passed from parent which already considers first options
        setFormState(defaultFormState);
        setImagePreview(defaultFormState.image || placeholderImage);
      }
    } else {
      // Reset when closed if not controlled externally more tightly
      setFormState(defaultFormState);
      setImagePreview(null);
    }
  }, [isOpen, isEditMode, initialData, productQualityOptions, defaultFormState]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (fieldName: keyof ProductFormData, value: string) => {
    setFormState(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Lỗi", description: "Kích thước file ảnh không được vượt quá 5MB.", variant: "destructive" });
        e.target.value = "";
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(formState.image || `https://placehold.co/100x100.png`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(formState.price);
    const costPriceNum = parseFloat(formState.costPrice);
    const maxDiscountNum = parseFloat(formState.maxDiscountPerUnitVND) || 0;
    const quantityNum = parseInt(formState.quantity);

    if (!formState.name || !formState.color || !formState.quality || !formState.size || !formState.unit || formState.quantity === '' || formState.price === '' || formState.costPrice === '' || isNaN(quantityNum) || quantityNum < 0 || isNaN(priceNum) || priceNum < 0 || isNaN(costPriceNum) || costPriceNum < 0 || isNaN(maxDiscountNum) || maxDiscountNum < 0) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ các trường bắt buộc (*). Giá trị số phải lớn hơn hoặc bằng 0.", variant: "destructive" });
      return;
    }
    if (priceNum <= costPriceNum) {
      toast({ title: "Lỗi", description: "Giá bán phải lớn hơn giá gốc.", variant: "destructive" });
      return;
    }
    if (maxDiscountNum > priceNum) {
      toast({ title: "Lỗi", description: "Giảm giá tối đa không được vượt quá Giá bán.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = formState.image || `https://placehold.co/100x100.png`;
      if (imageFile) {
        finalImageUrl = await uploadImageAndGetURL(imageFile, 'product_images');
      }

      const productData: Omit<Product, 'id'> = {
        name: formState.name,
        quantity: quantityNum,
        price: priceNum * 1000,
        costPrice: costPriceNum * 1000,
        image: finalImageUrl,
        color: formState.color,
        quality: formState.quality,
        size: formState.size,
        unit: formState.unit,
        maxDiscountPerUnitVND: maxDiscountNum * 1000,
      };
      await onSubmit(productData, isEditMode, initialData?.id);
    } catch(error: any) {
      console.error("Error submitting product form:", error);
      let errorMessage = "Đã có lỗi xảy ra khi lưu sản phẩm.";
      if (error.code === 'storage/unauthorized') {
        errorMessage = "Lỗi quyền truy cập: Bạn không có quyền tải ảnh lên. Vui lòng kiểm tra lại quy tắc bảo mật của Firebase Storage.";
      } else if (error.code === 'storage/unknown') {
        errorMessage = "Lỗi không xác định từ Firebase Storage. Có thể do lỗi kết nối mạng hoặc cấu hình CORS.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: "Lỗi", description: errorMessage, variant: "destructive", duration: 7000});
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Cập nhật thông tin chi tiết cho sản phẩm.' : 'Điền thông tin để thêm sản phẩm vào kho hàng.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start">
          <div>
              <Label htmlFor="prodForm-name" className="text-sm text-foreground">Tên sản phẩm (*)</Label>
              <Select value={formState.name} onValueChange={(value) => handleSelectChange('name', value)} required disabled={productNameOptions.length === 0}>
                  <SelectTrigger id="prodForm-name" className="w-full bg-card">
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
              <Label htmlFor="prodForm-color" className="text-sm text-foreground">Màu sắc (*)</Label>
              <Select value={formState.color} onValueChange={(value) => handleSelectChange('color', value)} required disabled={colorOptions.length === 0}>
                  <SelectTrigger id="prodForm-color" className="w-full bg-card">
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
              <Label htmlFor="prodForm-quality" className="text-sm text-foreground">Chất lượng (*)</Label>
              <Select value={formState.quality} onValueChange={(value) => handleSelectChange('quality', value)} required disabled={productQualityOptions.length === 0}>
                  <SelectTrigger id="prodForm-quality" className="w-full bg-card">
                      <SelectValue placeholder="Chọn chất lượng (*)" />
                  </SelectTrigger>
                  <SelectContent>
                      {productQualityOptions.length === 0 ? (
                          <SelectItem value="no-quality-option" disabled>Vui lòng thêm Chất lượng ở mục quản lý</SelectItem>
                      ) : (
                          productQualityOptions.map(option => ( <SelectItem key={option} value={option}>{option}</SelectItem> ))
                      )}
                  </SelectContent>
              </Select>
          </div>
          <div>
              <Label htmlFor="prodForm-size" className="text-sm text-foreground">Kích thước (*)</Label>
              <Select value={formState.size} onValueChange={(value) => handleSelectChange('size', value)} required disabled={sizeOptions.length === 0}>
                  <SelectTrigger id="prodForm-size" className="w-full bg-card">
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
              <Label htmlFor="prodForm-unit" className="text-sm text-foreground">Đơn vị (*)</Label>
              <Select value={formState.unit} onValueChange={(value) => handleSelectChange('unit', value)} required disabled={unitOptions.length === 0}>
                  <SelectTrigger id="prodForm-unit" className="w-full bg-card">
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
              <Label htmlFor="prodForm-quantity" className="text-sm text-foreground">Số lượng (*)</Label>
              <Input id="prodForm-quantity" type="number" name="quantity" value={formState.quantity} onChange={handleInputChange} required min="0" className="bg-card"/>
          </div>
          <div>
              <Label htmlFor="prodForm-costPrice" className="text-sm text-foreground">Giá gốc (Nghìn VND) (*)</Label>
              <Input id="prodForm-costPrice" type="number" name="costPrice" placeholder="Giá nhập hàng" value={formState.costPrice} onChange={handleInputChange} required min="0" step="any" className="bg-card"/>
          </div>
          <div>
              <Label htmlFor="prodForm-price" className="text-sm text-foreground">Giá bán (Nghìn VND) (*)</Label>
              <Input id="prodForm-price" type="number" name="price" value={formState.price} onChange={handleInputChange} required min="0" step="any" className="bg-card"/>
          </div>
          <div>
              <Label htmlFor="prodForm-maxDiscount" className="text-sm text-foreground">Giảm giá tối đa / ĐV (Nghìn VND)</Label>
              <Input id="prodForm-maxDiscount" type="number" name="maxDiscountPerUnitVND" placeholder="Mặc định là 0" value={formState.maxDiscountPerUnitVND} onChange={handleInputChange} min="0" step="any" className="bg-card"/>
          </div>
          
          <div className="md:col-span-2 flex flex-col">
              <Label htmlFor="prodForm-imageFile" className="text-sm text-foreground mb-1">Hình ảnh sản phẩm</Label>
              <Input
                  id="prodForm-imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="bg-card flex-grow"
              />
          </div>
            {imagePreview && (
                <div className="md:col-span-1 flex items-center justify-center">
                <Image
                    src={imagePreview}
                    alt="Xem trước hình ảnh"
                    width={80}
                    height={80}
                    className="rounded-md object-cover border aspect-square"
                    data-ai-hint="flower product"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://placehold.co/80x80.png';
                    }}
                />
                </div>
            )}
            <div className="md:col-span-1 flex items-end">
            </div>


          <DialogFooter className="md:col-span-4 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Hủy</Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={
                isSubmitting ||
                (productNameOptions.length > 0 && !formState.name) || productNameOptions.length === 0 ||
                (colorOptions.length > 0 && !formState.color) || colorOptions.length === 0 ||
                (productQualityOptions.length > 0 && !formState.quality) || productQualityOptions.length === 0 ||
                (sizeOptions.length > 0 && !formState.size) || sizeOptions.length === 0 ||
                (unitOptions.length > 0 && !formState.unit) || unitOptions.length === 0
              }
            >
              {isSubmitting ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Đang lưu...
                  </>
              ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {isEditMode ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                  </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

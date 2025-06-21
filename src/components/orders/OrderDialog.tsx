
"use client";

import React, { useState, useEffect } from 'react';
import type { Product } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Plus, Minus } from 'lucide-react';
import { Separator } from '../ui/separator';

interface OrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirmOrder: (product: Product, quantity: number, notes: string) => Promise<void>;
}

export function OrderDialog({ isOpen, onClose, product, onConfirmOrder }: OrderDialogProps) {
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setQuantity('1');
      setNotes('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!product) return null;

  const handleQuantityChange = (value: string) => {
    if (value === '') {
        setQuantity('');
        return;
    }
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && product) {
      if (numValue > product.quantity) {
        setQuantity(product.quantity.toString());
        toast({ title: "Số lượng vượt tồn kho", description: `Chỉ còn ${product.quantity} sản phẩm.`, variant: "destructive" });
      } else if (numValue < 1) {
        setQuantity('1');
      } else {
        setQuantity(numValue.toString());
      }
    }
  };

  const handleConfirm = async () => {
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast({ title: "Lỗi", description: "Số lượng phải là một số lớn hơn 0.", variant: "destructive" });
      return;
    }
    if (numQuantity > product.quantity) {
      toast({ title: "Lỗi", description: `Số lượng đặt hàng không thể vượt quá số lượng tồn kho (${product.quantity}).`, variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    await onConfirmOrder(product, numQuantity, notes);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Đặt hàng: {product.name}</DialogTitle>
          <DialogDescription>
            Kiểm tra thông tin sản phẩm, nhập số lượng và ghi chú (nếu có) cho đơn hàng.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 py-4">
            <div className="flex justify-center items-center row-span-2">
                 <Image
                    src={product.image || `https://placehold.co/400x400.png`}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="rounded-lg object-cover aspect-square border shadow-lg"
                    data-ai-hint={`${product.name.split(' ')[0]} flower`}
                    onError={(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/400x400.png')}
                />
            </div>

            <div className="space-y-4">
                 <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-muted-foreground">Màu sắc:</span>
                        <span className="font-medium text-lg">{product.color}</span>
                    </div>
                     <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-muted-foreground">Chất lượng:</span>
                        <span className="font-medium text-lg">{product.quality || 'N/A'}</span>
                    </div>
                     <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-muted-foreground">Kích thước:</span>
                        <span className="font-medium text-lg">{product.size}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-muted-foreground">Tồn kho:</span>
                        <span className="font-medium text-lg">{product.quantity} {product.unit}</span>
                    </div>
                </div>

                <Separator />

                <div>
                    <p className="text-sm text-muted-foreground">Đơn giá</p>
                    <p className="text-4xl font-bold text-primary">{`${product.price.toLocaleString('vi-VN')} VNĐ`}</p>
                </div>
            </div>

             <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="quantity" className="font-semibold text-lg">Số lượng đặt (*)</Label>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            onClick={() => handleQuantityChange((parseInt(quantity, 10) - 1).toString())}
                            disabled={parseInt(quantity, 10) <= 1}
                        >
                            <Minus className="h-5 w-5" />
                        </Button>
                        <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(e.target.value)}
                            min="1"
                            max={product.quantity.toString()}
                            required
                            className="w-20 text-center hide-number-spinners text-xl h-10"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            onClick={() => handleQuantityChange((parseInt(quantity, 10) + 1).toString())}
                            disabled={parseInt(quantity, 10) >= product.quantity}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes" className="font-semibold text-lg">Ghi chú</Label>
                    <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ví dụ: Giao hàng sau 5 giờ chiều, gói quà cẩn thận..."
                    className="min-h-[80px]"
                    />
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} size="lg">Hủy</Button>
          <Button onClick={handleConfirm} className="bg-primary text-primary-foreground" disabled={isSubmitting} size="lg">
             {isSubmitting ? <><LoadingSpinner className="mr-2" /> Đang xử lý...</> : 'Xác nhận đặt hàng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

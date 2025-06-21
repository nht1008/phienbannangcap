
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Đặt hàng: {product.name}</DialogTitle>
          <DialogDescription>
            Nhập số lượng và ghi chú (nếu có) cho đơn hàng của bạn.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-start gap-4">
            <Image
              src={product.image || `https://placehold.co/100x100.png`}
              alt={product.name}
              width={100}
              height={100}
              className="rounded-md object-cover aspect-square border"
              data-ai-hint={`${product.name.split(' ')[0]} flower`}
              onError={(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/100x100.png')}
            />
            <div className="flex-1 space-y-2 text-sm">
                <div className="grid grid-cols-[80px_1fr] items-center">
                    <span className="font-semibold text-muted-foreground">Tên:</span>
                    <span className="font-bold text-base">{product.name}</span>
                </div>
                 <div className="grid grid-cols-[80px_1fr] items-center">
                    <span className="font-semibold text-muted-foreground">Chi tiết:</span>
                    <span>{`${product.color}, ${product.quality || 'N/A'}, ${product.size}`}</span>
                </div>
                 <div className="grid grid-cols-[80px_1fr] items-center">
                    <span className="font-semibold text-muted-foreground">Đơn giá:</span>
                    <span className="font-bold text-primary">{`${product.price.toLocaleString('vi-VN')} VNĐ / ${product.unit}`}</span>
                </div>
                 <div className="grid grid-cols-[80px_1fr] items-center">
                    <span className="font-semibold text-muted-foreground">Tồn kho:</span>
                    <span>{product.quantity}</span>
                </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <Label htmlFor="quantity">Số lượng đặt (*)</Label>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleQuantityChange((parseInt(quantity, 10) - 1).toString())}
                    disabled={parseInt(quantity, 10) <= 1}
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    min="1"
                    max={product.quantity.toString()}
                    required
                    className="w-16 text-center hide-number-spinners"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleQuantityChange((parseInt(quantity, 10) + 1).toString())}
                    disabled={parseInt(quantity, 10) >= product.quantity}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Giao hàng sau 5 giờ chiều, gói quà cẩn thận..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Hủy</Button>
          <Button onClick={handleConfirm} className="bg-primary text-primary-foreground" disabled={isSubmitting}>
             {isSubmitting ? <><LoadingSpinner className="mr-2" /> Đang xử lý...</> : 'Xác nhận đặt hàng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

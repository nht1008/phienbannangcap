
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đặt hàng: {product.name}</DialogTitle>
          <DialogDescription>
            Nhập số lượng và ghi chú (nếu có) cho đơn hàng của bạn.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-4">
            <Image
              src={product.image || `https://placehold.co/80x80.png`}
              alt={product.name}
              width={80}
              height={80}
              className="rounded-md object-cover aspect-square border"
              data-ai-hint={`${product.name.split(' ')[0]} flower`}
              onError={(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/80x80.png')}
            />
            <div className="text-sm">
              <p className="font-semibold">{product.name}</p>
              <p className="text-muted-foreground">{product.color}, {product.size}, {product.quality}</p>
              <p className="text-primary font-bold">{product.price.toLocaleString('vi-VN')} VNĐ / {product.unit}</p>
              <p className="text-muted-foreground">Tồn kho: {product.quantity}</p>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="quantity">Số lượng</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={product.quantity.toString()}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Ghi chú</Label>
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

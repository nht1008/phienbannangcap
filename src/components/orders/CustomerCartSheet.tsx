
"use client";

import React, { useState } from 'react';
import type { CartItem, Product } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingCart, Pencil, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CustomerCartSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, newQuantity: string) => void;
  onRemoveItem: (itemId: string) => void;
  onPlaceOrder: () => void;
  inventory: Product[];
  onOpenNoteEditor: (itemId: string) => void;
}

export function CustomerCartSheet({
  isOpen,
  onOpenChange,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  inventory,
  onOpenNoteEditor,
}: CustomerCartSheetProps) {

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantityInCart, 0);

  const handlePlaceOrder = () => {
    onPlaceOrder();
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-4xl">
        <SheetHeader className="px-4 sm:px-6 pt-6">
          <SheetTitle className="flex items-center gap-2 text-2xl">
            <ShoppingCart className="h-6 w-6" />
            Giỏ hàng của bạn
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6">
              <p className="text-muted-foreground">Giỏ hàng của bạn đang trống.</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-4 sm:pl-6 w-[250px]">Sản phẩm</TableHead>
                            <TableHead>Màu</TableHead>
                            <TableHead>Chất lượng</TableHead>
                            <TableHead>Kích thước</TableHead>
                            <TableHead>Đơn vị</TableHead>
                            <TableHead className="text-right">Đơn giá</TableHead>
                            <TableHead className="text-center w-[130px]">Số lượng</TableHead>
                            <TableHead className="text-right">Thành tiền</TableHead>
                            <TableHead className="min-w-[120px]">Ghi chú</TableHead>
                            <TableHead className="text-center">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cart.map(item => {
                            const stockItem = inventory.find(p => p.id === item.id);
                            const maxQuantity = stockItem?.quantity ?? 0;
                            return (
                                <TableRow key={item.id} className="align-middle">
                                    <TableCell className="pl-4 sm:pl-6 font-medium py-3">
                                        <div className="flex items-center gap-3">
                                            <Image
                                                src={item.image || 'https://placehold.co/40x40.png'}
                                                alt={item.name}
                                                width={40}
                                                height={40}
                                                className="rounded-md object-cover aspect-square border"
                                                data-ai-hint={`${item.name.split(' ')[0]} flower`}
                                            />
                                            <p className="font-semibold leading-tight">{item.name}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.color}</TableCell>
                                    <TableCell>{item.quality || 'N/A'}</TableCell>
                                    <TableCell>{item.size}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell className="text-right">
                                        {item.price.toLocaleString('vi-VN')} VNĐ
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 shrink-0"
                                            onClick={() => onUpdateQuantity(item.id, (item.quantityInCart - 1).toString())}
                                            disabled={item.quantityInCart <= 1}
                                            >
                                            <Minus className="h-4 w-4" />
                                            </Button>
                                            <Input
                                            type="number"
                                            value={item.quantityInCart}
                                            readOnly
                                            className="h-7 w-12 text-center hide-number-spinners bg-background"
                                            />
                                            <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 shrink-0"
                                            onClick={() => onUpdateQuantity(item.id, (item.quantityInCart + 1).toString())}
                                            disabled={item.quantityInCart >= maxQuantity}
                                            >
                                            <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-primary">
                                        {(item.price * item.quantityInCart).toLocaleString('vi-VN')} VNĐ
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]" title={item.notes}>
                                      {item.notes || "Không có"}
                                    </TableCell>
                                    <TableCell className="text-center space-x-1">
                                      <Button
                                          variant="outline"
                                          size="icon"
                                          className={cn(
                                            "h-8 w-8 relative", 
                                            item.notes ? "border-primary text-primary hover:bg-primary/5" : "text-muted-foreground hover:text-primary"
                                          )}
                                          onClick={() => onOpenNoteEditor(item.id)}
                                          title={item.notes ? `Sửa ghi chú: "${item.notes}"` : "Thêm ghi chú"}
                                      >
                                          <Pencil className="h-4 w-4" />
                                          {item.notes && (
                                            <span className="absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
                                          )}
                                      </Button>
                                      <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive/80"
                                          onClick={() => onRemoveItem(item.id)}
                                          title="Xóa sản phẩm"
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
        </div>
        {cart.length > 0 && (
          <>
            <Separator className="mt-auto" />
            <SheetFooter className="px-4 sm:px-6 py-4 flex-col space-y-4 items-start">
              <div className="flex justify-between w-full text-lg font-semibold">
                <p>Tổng cộng:</p>
                <p>{totalAmount.toLocaleString('vi-VN')} VNĐ</p>
              </div>
              <div className="w-full space-y-2 pt-2">
                <Label htmlFor="payment-method" className="font-semibold">Phương thức thanh toán</Label>
                <Input id="payment-method" value="Chuyển khoản ngân hàng" readOnly className="bg-muted/50" />
                <p className="text-xs text-muted-foreground">Chúng tôi sẽ xác nhận và chuẩn bị đơn hàng chỉ sau khi đã nhận được tiền thành công</p>
              </div>
              <Button onClick={handlePlaceOrder} className="w-full bg-primary text-primary-foreground" size="lg">
                Tiến hành đặt hàng
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
    

    
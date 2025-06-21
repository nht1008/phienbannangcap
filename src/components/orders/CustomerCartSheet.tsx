
"use client";

import React from 'react';
import type { CartItem, Product } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';

interface CustomerCartSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, newQuantity: string) => void;
  onRemoveItem: (itemId: string) => void;
  onPlaceOrder: () => void;
  inventory: Product[];
}

export function CustomerCartSheet({
  isOpen,
  onOpenChange,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  inventory,
}: CustomerCartSheetProps) {

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantityInCart, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6 pt-6">
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
            <ScrollArea className="h-full px-6">
              <div className="flex flex-col gap-6 py-4">
                {cart.map(item => {
                   const stockItem = inventory.find(p => p.id === item.id);
                   const maxQuantity = stockItem?.quantity ?? 0;
                  return (
                    <div key={item.id} className="flex items-start gap-4">
                      <Image
                        src={item.image || 'https://placehold.co/64x64.png'}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover aspect-square border"
                        data-ai-hint={`${item.name.split(' ')[0]} flower`}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                            <p className="font-semibold leading-tight">{item.name}</p>
                             <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive shrink-0"
                                onClick={() => onRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.color}, {item.quality}, {item.size}</p>
                        <div className="flex items-center justify-between mt-2">
                           <p className="text-sm font-medium text-primary">{item.price.toLocaleString('vi-VN')} VNĐ</p>
                          <div className="flex items-center gap-2">
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
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>
        {cart.length > 0 && (
          <>
            <Separator className="mt-auto" />
            <SheetFooter className="px-6 py-4 space-y-4">
              <div className="flex justify-between w-full text-lg font-semibold">
                <p>Tổng cộng:</p>
                <p>{totalAmount.toLocaleString('vi-VN')} VNĐ</p>
              </div>
              <Button onClick={onPlaceOrder} className="w-full bg-primary text-primary-foreground" size="lg">
                Tiến hành đặt hàng
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

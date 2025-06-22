
"use client";

import React from 'react';
import type { Product } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pencil, Store, XCircle } from 'lucide-react';

interface StorefrontTabProps {
  products: Product[];
  onOpenEditProductDialog: (product: Product) => void;
  onRemoveFromStorefront: (productId: string) => void;
  hasFullAccessRights: boolean;
  isCurrentUserCustomer: boolean;
  onAddToCart: (product: Product) => void;
}

export function StorefrontTab({ products, onOpenEditProductDialog, onRemoveFromStorefront, hasFullAccessRights, isCurrentUserCustomer, onAddToCart }: StorefrontTabProps) {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center">
              <Store className="mr-2 h-6 w-6 text-primary" />
              Gian hàng
            </CardTitle>
            <CardDescription>Các sản phẩm dành cho khách hàng đặt hàng online.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">
              Chưa có sản phẩm nào được trưng bày trên gian hàng.
            </p>
          ) : (
            <ScrollArea className="max-h-[75vh] w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Ảnh</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead>Màu</TableHead>
                    <TableHead>Chất lượng</TableHead>
                    <TableHead>Kích thước</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead className="text-right">Tồn kho</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Image
                          src={product.image || `https://placehold.co/40x40.png`}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover aspect-square"
                          data-ai-hint={`${product.name.split(' ')[0]} flower`}
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40.png'; }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{product.price.toLocaleString('vi-VN')} VNĐ</TableCell>
                      <TableCell>{product.color}</TableCell>
                      <TableCell>{product.quality || 'N/A'}</TableCell>
                      <TableCell>{product.size}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {hasFullAccessRights && (
                          <>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onOpenEditProductDialog(product)} title="Sửa thông tin sản phẩm (trong kho)">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onRemoveFromStorefront(product.id)} title="Gỡ khỏi gian hàng">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {isCurrentUserCustomer && product.quantity > 0 && (
                          <Button variant="default" size="sm" className="h-8" onClick={() => onAddToCart(product)}>
                              Thêm vào giỏ
                          </Button>
                        )}
                        {isCurrentUserCustomer && product.quantity <= 0 && (
                          <Button variant="outline" size="sm" className="h-8" disabled>
                              Hết hàng
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

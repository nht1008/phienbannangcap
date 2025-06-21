
"use client";

import React, { useMemo } from 'react';
import type { Product, Invoice } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pencil, PlusCircle, Store, Trash2 } from 'lucide-react';

interface StorefrontTabProps {
  inventory: Product[];
  invoices: Invoice[];
  onOpenAddProductDialog: () => void;
  onOpenEditProductDialog: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  hasFullAccessRights: boolean;
  isCurrentUserCustomer: boolean;
  onOrderProduct: (product: Product) => void;
}

interface ProductPerformance extends Product {
  sold: number;
}

const RenderProductTable: React.FC<{
  products: ProductPerformance[] | Product[];
  title: string;
  description: string;
  isBestSellerTable?: boolean;
  onOpenEditProductDialog: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  hasFullAccessRights: boolean;
  isCurrentUserCustomer: boolean;
  onOrderProduct: (product: Product) => void;
}> = ({ products, title, description, isBestSellerTable = false, onOpenEditProductDialog, onDeleteProduct, hasFullAccessRights, isCurrentUserCustomer, onOrderProduct }) => {
  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            {isBestSellerTable ? "Chưa có sản phẩm bán chạy nào." : "Không có sản phẩm nào trong kho."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[60vh] w-full overflow-x-auto">
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
                {isBestSellerTable && <TableHead className="text-right">Đã bán</TableHead>}
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
                  {isBestSellerTable && 'sold' in product && (
                    <TableCell className="text-right">{(product as ProductPerformance).sold}</TableCell>
                  )}
                  <TableCell className="text-right space-x-1">
                    {hasFullAccessRights && (
                      <>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onOpenEditProductDialog(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onDeleteProduct(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {isCurrentUserCustomer && product.quantity > 0 && (
                       <Button variant="default" size="sm" className="h-8" onClick={() => onOrderProduct(product)}>
                          Đặt hàng
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
      </CardContent>
    </Card>
  );
};


export function StorefrontTab({ inventory, invoices, onOpenAddProductDialog, onOpenEditProductDialog, onDeleteProduct, hasFullAccessRights, isCurrentUserCustomer, onOrderProduct }: StorefrontTabProps) {
  const topSellingProducts = useMemo((): ProductPerformance[] => {
    const salesMap: Record<string, { product: Product; sold: number }> = {};

    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const originalProduct = inventory.find(p => p.id === item.id);
        if (originalProduct) {
          if (!salesMap[item.id]) {
            salesMap[item.id] = { product: originalProduct, sold: 0 };
          }
          salesMap[item.id].sold += item.quantityInCart;
        }
      });
    });

    return Object.values(salesMap)
      .map(data => ({ ...data.product, sold: data.sold }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);
  }, [invoices, inventory]);

  const inventoryToDisplay = useMemo(() => {
    // Customers only see in-stock items, admins see all
    return hasFullAccessRights ? inventory : inventory.filter(product => product.quantity > 0);
  }, [inventory, hasFullAccessRights]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center">
              <Store className="mr-2 h-6 w-6 text-primary" />
              Gian hàng
            </CardTitle>
            <CardDescription>Hiển thị các sản phẩm nổi bật và toàn bộ sản phẩm trong kho.</CardDescription>
          </div>
          {hasFullAccessRights && (
            <Button onClick={onOpenAddProductDialog} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Thêm sản phẩm
            </Button>
          )}
        </CardHeader>
      </Card>

      <RenderProductTable
        products={topSellingProducts}
        title="Sản phẩm bán chạy"
        description="Top 10 sản phẩm bán chạy nhất dựa trên số lượng đã bán."
        isBestSellerTable
        onOpenEditProductDialog={onOpenEditProductDialog}
        onDeleteProduct={onDeleteProduct}
        hasFullAccessRights={hasFullAccessRights}
        isCurrentUserCustomer={isCurrentUserCustomer}
        onOrderProduct={onOrderProduct}
      />

      <RenderProductTable
        products={inventoryToDisplay}
        title="Tất cả sản phẩm"
        description="Danh sách tất cả các sản phẩm hiện có trong kho."
        onOpenEditProductDialog={onOpenEditProductDialog}
        onDeleteProduct={onDeleteProduct}
        hasFullAccessRights={hasFullAccessRights}
        isCurrentUserCustomer={isCurrentUserCustomer}
        onOrderProduct={onOrderProduct}
      />
    </div>
  );
}

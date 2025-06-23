
"use client";

import React, { useMemo } from 'react';
import type { Product } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, XCircle, Eye } from 'lucide-react';

interface ProductGroup {
  name: string;
  variants: Product[];
  representativeImage: string;
  minPrice: number;
  totalStock: number;
}

interface StorefrontTabProps {
  products: Product[];
  onOpenEditProductDialog: (product: Product) => void;
  onRemoveFromStorefront: (productId: string) => void;
  hasFullAccessRights: boolean;
  isCurrentUserCustomer: boolean;
  onSelectProduct: (variants: Product[]) => void;
}

export function StorefrontTab({ 
  products, 
  onOpenEditProductDialog, 
  onRemoveFromStorefront, 
  hasFullAccessRights, 
  isCurrentUserCustomer, 
  onSelectProduct 
}: StorefrontTabProps) {

  const groupedProducts = useMemo((): ProductGroup[] => {
    if (!products) return [];
    const map = new Map<string, ProductGroup>();

    products.forEach(product => {
      if (!map.has(product.name)) {
        map.set(product.name, {
          name: product.name,
          variants: [],
          representativeImage: product.image,
          minPrice: product.price,
          totalStock: 0,
        });
      }
      const group = map.get(product.name)!;
      group.variants.push(product);
      group.totalStock += product.quantity;
      if (product.price < group.minPrice) {
        group.minPrice = product.price;
      }
    });
    return Array.from(map.values());
  }, [products]);


  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-400 mb-2 animate-fadeInUp">
          Cửa Hàng Hoa Công Nguyệt
        </h1>
        <p className="text-lg text-muted-foreground animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          Khám phá những sản phẩm hoa tươi đẹp nhất
        </p>
      </div>

      {groupedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-fadeInUp" style={{ animationDelay: '400ms' }}>
          <Store className="w-20 h-20 text-muted-foreground/50 mb-4" />
          <h3 className="text-2xl font-bold text-foreground">Gian hàng đang được cập nhật</h3>
          <p className="text-muted-foreground mt-2">
            Chưa có sản phẩm nào được trưng bày. Vui lòng quay lại sau!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {groupedProducts.map((group, index) => (
            <Card
              key={group.name}
              className="overflow-hidden group/card relative flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 animate-popIn cursor-pointer"
              style={{ animationDelay: `${index * 70}ms`, opacity: 0 }}
              onClick={() => group.totalStock > 0 && isCurrentUserCustomer ? onSelectProduct(group.variants) : null}
            >
              <CardHeader className="p-0 relative">
                <div className="aspect-square overflow-hidden">
                  <Image
                    src={group.representativeImage || `https://placehold.co/400x400.png`}
                    alt={group.name}
                    width={400}
                    height={400}
                    className="object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover/card:scale-110"
                    data-ai-hint={`${group.name.split(' ')[0]} flower`}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400.png'; }}
                  />
                </div>
                {group.totalStock <= 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge variant="destructive" className="text-base px-4 py-1 border-2 border-white/50 backdrop-blur-sm">Hết hàng</Badge>
                  </div>
                )}
                 {hasFullAccessRights && (
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                        <Button variant="destructive" size="icon" className="h-8 w-8 bg-destructive/80 hover:bg-destructive" onClick={(e) => {e.stopPropagation(); group.variants.forEach(v => onRemoveFromStorefront(v.id))}} title="Gỡ khỏi gian hàng">
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </div>
                )}
              </CardHeader>
              <CardContent className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-lg truncate text-foreground group-hover/card:text-primary transition-colors" title={group.name}>
                    {group.name}
                </h3>
                
                <div className="flex-grow" />

                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Từ <span className="text-xl font-bold text-primary">{group.minPrice.toLocaleString('vi-VN')} VNĐ</span>
                  </p>
                  {isCurrentUserCustomer && (
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground transition-transform duration-200 group-hover/card:scale-110"
                    >
                      <Eye className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

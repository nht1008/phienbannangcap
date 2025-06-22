
"use client";

import React, { useState, useMemo } from 'react';
import type { Invoice, InvoiceCartItem } from '@/types';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { normalizeStringForSearch } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ListChecks } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface HistoryTabProps {
  invoices: Invoice[];
  currentUser: User | null;
}

export function HistoryTab({ invoices, currentUser }: HistoryTabProps) {
  const [invoiceForDetailedView, setInvoiceForDetailedView] = useState<Invoice | null>(null);
  const [isInvoiceDetailModalOpen, setIsInvoiceDetailModalOpen] = useState(false);

  const myInvoices = useMemo(() => {
    if (!currentUser || !currentUser.displayName) {
      return [];
    }
    const normalizedName = normalizeStringForSearch(currentUser.displayName);
    return invoices
      .filter(invoice => normalizeStringForSearch(invoice.customerName) === normalizedName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, currentUser]);

  const openInvoiceItemDetailsDialog = (invoice: Invoice) => {
    setInvoiceForDetailedView(invoice);
    setIsInvoiceDetailModalOpen(true);
  };

  const closeInvoiceItemDetailsDialog = () => {
    setInvoiceForDetailedView(null);
    setIsInvoiceDetailModalOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="p-6">
          <CardTitle className="text-2xl font-bold">Lịch sử mua hàng</CardTitle>
          <CardDescription>Xem lại tất cả các hóa đơn mua hàng của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          {myInvoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">Bạn chưa có giao dịch nào.</p>
          ) : (
            <ScrollArea className="h-[70vh] no-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">STT</TableHead>
                    <TableHead>ID Hóa đơn</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Giờ</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>PT Thanh toán</TableHead>
                    <TableHead className="text-right text-destructive">Tiền nợ</TableHead>
                    <TableHead className="text-center">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myInvoices.map((invoice, index) => {
                    const invoiceDate = new Date(invoice.date);
                    return (
                      <TableRow key={invoice.id} className={invoice.debtAmount && invoice.debtAmount > 0 ? "bg-destructive/5" : ""}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{invoice.id.substring(0, 8)}...</TableCell>
                        <TableCell>{invoiceDate.toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell>{invoiceDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</TableCell>
                        <TableCell className="text-right">{invoice.total.toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell>{invoice.paymentMethod}</TableCell>
                        <TableCell className="text-right text-destructive">
                          {(invoice.debtAmount ?? 0).toLocaleString('vi-VN')} VNĐ
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80" onClick={() => openInvoiceItemDetailsDialog(invoice)}>
                              <ListChecks className="h-4 w-4"/>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {invoiceForDetailedView && (
        <Dialog open={isInvoiceDetailModalOpen} onOpenChange={closeInvoiceItemDetailsDialog}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Chi tiết sản phẩm Hóa đơn #{invoiceForDetailedView.id.substring(0,6)}...</DialogTitle>
              <DialogDescription asChild>
                <div>
                  <p>Khách hàng: {invoiceForDetailedView.customerName}</p>
                  <p>Ngày: {new Date(invoiceForDetailedView.date).toLocaleDateString('vi-VN')}</p>
                  <p>Giờ: {new Date(invoiceForDetailedView.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-3" />
            <ScrollArea className="max-h-[50vh] no-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Tên Sản phẩm</TableHead>
                    <TableHead>Màu</TableHead>
                    <TableHead>Chất lượng</TableHead>
                    <TableHead>K.Thước</TableHead>
                    <TableHead>ĐV</TableHead>
                    <TableHead className="text-right">SL</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">GG SP</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceForDetailedView.items.map((item: InvoiceCartItem, idx: number) => (
                    <TableRow key={`${item.id}-${idx}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.color || 'N/A'}</TableCell>
                      <TableCell>{item.quality || 'N/A'}</TableCell>
                      <TableCell>{item.size || 'N/A'}</TableCell>
                      <TableCell>{item.unit || 'N/A'}</TableCell>
                      <TableCell className="text-right">{item.quantityInCart}</TableCell>
                      <TableCell className="text-right">{item.price.toLocaleString('vi-VN')}</TableCell>
                      <TableCell className="text-right text-destructive">{(item.itemDiscount || 0).toLocaleString('vi-VN')}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {(item.price * item.quantityInCart - (item.itemDiscount || 0)).toLocaleString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <Separator className="my-3" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Tổng tiền hàng (trước GG chung):</span>
                <span>
                  {invoiceForDetailedView.items.reduce((sum, item) => sum + (item.price * item.quantityInCart) - (item.itemDiscount || 0), 0).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              {invoiceForDetailedView.discount && invoiceForDetailedView.discount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Giảm giá chung Hóa đơn:</span>
                  <span>-{invoiceForDetailedView.discount.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-primary">
                <span>Tổng thanh toán Hóa đơn:</span>
                <span>{invoiceForDetailedView.total.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between">
                <span>Đã thanh toán ({invoiceForDetailedView.paymentMethod}):</span>
                <span>{(invoiceForDetailedView.amountPaid ?? 0).toLocaleString('vi-VN')} VNĐ</span>
              </div>
              {invoiceForDetailedView.debtAmount && invoiceForDetailedView.debtAmount > 0 && (
                <div className="flex justify-between text-destructive font-semibold">
                  <span>Tiền nợ của Hóa đơn này:</span>
                  <span>{invoiceForDetailedView.debtAmount.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={closeInvoiceItemDetailsDialog}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

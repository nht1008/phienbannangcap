"use client";

import React, { useState } from 'react';
import type { Invoice, CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface InvoiceTabProps {
  invoices: Invoice[];
}

export function InvoiceTab({ invoices }: InvoiceTabProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách hóa đơn</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-muted-foreground">Chưa có hóa đơn nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Tổng tiền (VNĐ)</TableHead>
                  <TableHead>Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.id}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleString('vi-VN')}</TableCell>
                    <TableCell>{invoice.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="link" className="p-0 h-auto text-blue-500 hover:text-blue-700" onClick={() => setSelectedInvoice(invoice)}>Xem</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedInvoice && (
          <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl">Chi tiết hóa đơn #{selectedInvoice.id}</DialogTitle>
                <DialogDescription>
                  <strong>Khách hàng:</strong> {selectedInvoice.customerName} <br />
                  <strong>Ngày:</strong> {new Date(selectedInvoice.date).toLocaleString('vi-VN')}
                </DialogDescription>
              </DialogHeader>
              <Separator className="my-4" />
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Sản phẩm đã mua:</h4>
                <ul className="space-y-1 max-h-60 overflow-y-auto">
                  {selectedInvoice.items.map((item: CartItem) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.name} ({item.color}, {item.size}) x {item.quantityInCart} {item.unit}</span>
                      <span className="text-foreground">{(item.price * item.quantityInCart).toLocaleString()} VNĐ</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-xl text-foreground">
                <span>Tổng cộng:</span>
                <span>{selectedInvoice.total.toLocaleString()} VNĐ</span>
              </div>
              <DialogFooter>
                <Button onClick={() => setSelectedInvoice(null)} variant="outline" className="w-full">Đóng</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

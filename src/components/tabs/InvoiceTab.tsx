
"use client";

import React, { useState } from 'react';
import type { Invoice, CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Undo2 } from 'lucide-react';

interface InvoiceTabProps {
  invoices: Invoice[];
  onProcessInvoiceCancellationOrReturn: (invoiceId: string, operationType: 'delete' | 'return') => Promise<boolean>;
}

export function InvoiceTab({ invoices, onProcessInvoiceCancellationOrReturn }: InvoiceTabProps) {
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<Invoice | null>(null);
  const [operationTarget, setOperationTarget] = useState<{ invoice: Invoice | null; type: 'delete' | 'return' } | null>(null);

  const openConfirmDialog = (invoice: Invoice, type: 'delete' | 'return') => {
    setOperationTarget({ invoice, type });
  };

  const handleConfirmOperation = async () => {
    if (operationTarget && operationTarget.invoice) {
      await onProcessInvoiceCancellationOrReturn(operationTarget.invoice.id, operationTarget.type);
      setOperationTarget(null); 
    }
  };

  const invoiceIdDisplay = operationTarget?.invoice?.id ? operationTarget.invoice.id.substring(0,6) : '...';

  const dialogTitle = operationTarget?.type === 'delete' ? "Xác nhận xóa hóa đơn?" : "Xác nhận hoàn trả hóa đơn?";
  
  const dialogDescription = operationTarget?.type === 'delete'
    ? `Bạn có chắc chắn muốn xóa hóa đơn #${invoiceIdDisplay}...? Các sản phẩm trong hóa đơn này sẽ được hoàn trả lại vào kho.`
    : `Bạn có chắc chắn muốn xử lý hoàn trả cho hóa đơn #${invoiceIdDisplay}...? Các sản phẩm sẽ được hoàn trả lại vào kho và hóa đơn sẽ được coi như đã hủy.`;
  
  const actionButtonText = operationTarget?.type === 'delete' ? "Xóa hóa đơn" : "Xác nhận hoàn trả";


  return (
    <>
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
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Chi tiết</TableHead>
                    <TableHead className="text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.id.substring(0,6)}...</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleString('vi-VN')}</TableCell>
                      <TableCell>{invoice.total.toLocaleString('vi-VN')} VNĐ</TableCell>
                      <TableCell>
                        <Button variant="link" className="p-0 h-auto text-blue-500 hover:text-blue-700" onClick={() => setSelectedInvoiceDetails(invoice)}>Xem</Button>
                      </TableCell>
                      <TableCell className="text-center space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-600 hover:text-yellow-700" onClick={() => openConfirmDialog(invoice, 'return')}>
                          <Undo2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => openConfirmDialog(invoice, 'delete')}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {selectedInvoiceDetails && (
            <Dialog open={!!selectedInvoiceDetails} onOpenChange={(open) => !open && setSelectedInvoiceDetails(null)}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Chi tiết hóa đơn #{selectedInvoiceDetails.id.substring(0,6)}...</DialogTitle>
                  <DialogDescription>
                    <strong>Khách hàng:</strong> {selectedInvoiceDetails.customerName} <br />
                    <strong>Ngày:</strong> {new Date(selectedInvoiceDetails.date).toLocaleString('vi-VN')}
                  </DialogDescription>
                </DialogHeader>
                <Separator className="my-4" />
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Sản phẩm đã mua:</h4>
                  <ul className="space-y-1 max-h-60 overflow-y-auto">
                    {selectedInvoiceDetails.items.map((item: CartItem, index: number) => (
                      <li key={`${item.id}-${index}`} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.name} ({item.color}, {item.size}) x {item.quantityInCart} {item.unit}</span>
                        <span className="text-foreground">{(item.price * item.quantityInCart).toLocaleString('vi-VN')} VNĐ</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator className="my-4" />
                {selectedInvoiceDetails.discount && selectedInvoiceDetails.discount > 0 && (
                    <>
                        <div className="flex justify-between text-sm">
                            <span>Giảm giá:</span>
                            <span>-{selectedInvoiceDetails.discount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <Separator className="my-2" />
                    </>
                )}
                <div className="flex justify-between font-bold text-xl text-foreground">
                  <span>Tổng cộng:</span>
                  <span>{selectedInvoiceDetails.total.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                 {selectedInvoiceDetails.amountPaid !== undefined && (
                     <>
                        <Separator className="my-2" />
                        <div className="flex justify-between text-sm">
                            <span>Đã thanh toán ({selectedInvoiceDetails.paymentMethod}):</span>
                            <span>{selectedInvoiceDetails.amountPaid.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        {(selectedInvoiceDetails.amountPaid - selectedInvoiceDetails.total) > 0 && (
                             <div className="flex justify-between text-sm text-green-600">
                                <span>Tiền thừa:</span>
                                <span>{(selectedInvoiceDetails.amountPaid - selectedInvoiceDetails.total).toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                        )}
                     </>
                )}
                <DialogFooter className="mt-4">
                  <Button onClick={() => setSelectedInvoiceDetails(null)} variant="outline" className="w-full">Đóng</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {operationTarget?.invoice && (
        <AlertDialog open={!!operationTarget} onOpenChange={(open) => !open && setOperationTarget(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                    {dialogDescription}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setOperationTarget(null)}>Hủy</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={handleConfirmOperation} 
                    className={operationTarget.type === 'delete' ? "bg-destructive hover:bg-destructive/90" : "bg-yellow-500 hover:bg-yellow-600 text-white"}
                >
                    {actionButtonText}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}


"use client";

import React, { useState } from 'react';
import type { Invoice, CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ScrollArea } from '@/components/ui/scroll-area';

interface InvoiceTabProps {
  invoices: Invoice[];
  onProcessInvoiceCancellationOrReturn: (
    invoiceId: string, 
    operationType: 'delete' | 'return',
    itemsToReturn?: Array<{ productId: string; name: string; quantityToReturn: number }>
  ) => Promise<boolean>;
}

type ReturnItemDetail = {
  originalQuantityInCart: number;
  quantityToReturn: string;
  name: string;
  color: string;
  size: string;
  unit: string;
  price: number; 
};

export function InvoiceTab({ invoices, onProcessInvoiceCancellationOrReturn }: InvoiceTabProps) {
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const [isReturnItemsDialogOpen, setIsReturnItemsDialogOpen] = useState(false);
  const [currentInvoiceForReturnDialog, setCurrentInvoiceForReturnDialog] = useState<Invoice | null>(null);
  const [returnItemsState, setReturnItemsState] = useState<Record<string, ReturnItemDetail>>({});


  const openDeleteConfirmDialog = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
  };

  const handleConfirmDelete = async () => {
    if (invoiceToDelete) {
      await onProcessInvoiceCancellationOrReturn(invoiceToDelete.id, 'delete');
      setInvoiceToDelete(null); 
    }
  };

  const openReturnItemsDialog = (invoice: Invoice) => {
    setCurrentInvoiceForReturnDialog(invoice);
    const initialReturnItems: Record<string, ReturnItemDetail> = {};
    invoice.items.forEach(item => {
      initialReturnItems[item.id] = { // item.id is Product.id, unique within invoice.items
        originalQuantityInCart: item.quantityInCart,
        quantityToReturn: "0",
        name: item.name,
        color: item.color,
        size: item.size,
        unit: item.unit,
        price: item.price,
      };
    });
    setReturnItemsState(initialReturnItems);
    setIsReturnItemsDialogOpen(true);
  };

  const handleReturnItemQuantityChange = (productId: string, value: string) => {
    const itemDetail = returnItemsState[productId];
    if (!itemDetail) return;

    let numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      numValue = 0;
    } else if (numValue > itemDetail.originalQuantityInCart) {
      numValue = itemDetail.originalQuantityInCart;
    }
    
    setReturnItemsState(prev => ({
      ...prev,
      [productId]: { ...prev[productId], quantityToReturn: numValue.toString() }
    }));
  };

  const handleConfirmSelectiveReturn = async () => {
    if (!currentInvoiceForReturnDialog) return;

    const itemsToReturnForApi = Object.entries(returnItemsState)
      .map(([productId, detail]) => ({
        productId,
        name: detail.name,
        quantityToReturn: parseInt(detail.quantityToReturn) || 0,
      }))
      .filter(item => item.quantityToReturn > 0);

    if (itemsToReturnForApi.length === 0) {
      // Optionally show a toast that no items were selected for return
      setIsReturnItemsDialogOpen(false);
      return;
    }
    
    await onProcessInvoiceCancellationOrReturn(currentInvoiceForReturnDialog.id, 'return', itemsToReturnForApi);
    setIsReturnItemsDialogOpen(false);
    setCurrentInvoiceForReturnDialog(null);
    setReturnItemsState({});
  };


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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-600 hover:text-yellow-700" onClick={() => openReturnItemsDialog(invoice)}>
                          <Undo2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => openDeleteConfirmDialog(invoice)}>
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
                <ScrollArea className="max-h-60">
                  <h4 className="font-semibold mb-2 text-foreground">Sản phẩm đã mua:</h4>
                  <ul className="space-y-1 pr-3">
                    {selectedInvoiceDetails.items.map((item: CartItem, index: number) => (
                      <li key={`${item.id}-${index}`} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.name} ({item.color}, {item.size}) x {item.quantityInCart} {item.unit}</span>
                        <span className="text-foreground">{(item.price * item.quantityInCart).toLocaleString('vi-VN')} VNĐ</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
                <Separator className="my-4" />
                {selectedInvoiceDetails.discount !== undefined && selectedInvoiceDetails.discount > 0 && (
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

      {invoiceToDelete && (
        <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa hóa đơn?</AlertDialogTitle>
                <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa hóa đơn #{invoiceToDelete.id.substring(0,6)}...? Các sản phẩm trong hóa đơn này sẽ được hoàn trả lại vào kho.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>Hủy</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={handleConfirmDelete} 
                    className="bg-destructive hover:bg-destructive/90"
                >
                    Xóa hóa đơn
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {isReturnItemsDialogOpen && currentInvoiceForReturnDialog && (
        <Dialog open={isReturnItemsDialogOpen} onOpenChange={setIsReturnItemsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Hoàn trả sản phẩm cho HĐ #{currentInvoiceForReturnDialog.id.substring(0,6)}</DialogTitle>
              <DialogDescription>Chọn sản phẩm và số lượng muốn hoàn trả. Các sản phẩm sẽ được cộng lại vào kho.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1">
              <div className="space-y-4 py-2 pr-3">
                {Object.entries(returnItemsState).map(([productId, itemData]) => (
                  <Card key={productId} className="p-3 bg-muted/30">
                    <p className="font-semibold">{itemData.name} <span className="text-xs text-muted-foreground">({itemData.color}, {itemData.size})</span></p>
                    <p className="text-sm text-muted-foreground">Đơn vị: {itemData.unit} - Giá: {itemData.price.toLocaleString('vi-VN')} VNĐ</p>
                    <p className="text-sm text-muted-foreground">Đã mua: {itemData.originalQuantityInCart}</p>
                    <div className="mt-2">
                      <Label htmlFor={`return-qty-${productId}`} className="text-sm">Số lượng hoàn trả:</Label>
                      <Input
                        id={`return-qty-${productId}`}
                        type="number"
                        value={itemData.quantityToReturn}
                        onChange={(e) => handleReturnItemQuantityChange(productId, e.target.value)}
                        min="0"
                        max={itemData.originalQuantityInCart.toString()}
                        className="w-24 h-8 mt-1 bg-card"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsReturnItemsDialogOpen(false)}>Hủy</Button>
              <Button 
                onClick={handleConfirmSelectiveReturn}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                disabled={Object.values(returnItemsState).every(item => (parseInt(item.quantityToReturn) || 0) === 0)}
              >
                Xác nhận hoàn trả
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

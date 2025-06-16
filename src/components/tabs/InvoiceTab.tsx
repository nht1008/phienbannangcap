
"use client";

import React, { useState } from 'react';
import type { Invoice, CartItem, InvoiceCartItem } from '@/types';
import type { DateFilter } from '@/app/page';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Undo2, Eye, Plus, Minus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface InvoiceTabProps {
  invoices: Invoice[];
  onProcessInvoiceCancellationOrReturn: (
    invoiceId: string,
    operationType: 'delete' | 'return',
    itemsToReturn?: Array<{ productId: string; name: string; quantityToReturn: number }>
  ) => Promise<boolean>;
  filter: DateFilter;
  onFilterChange: (newFilter: DateFilter) => void;
  availableYears: string[];
}

type ReturnItemDetail = {
  originalQuantityInCart: number;
  quantityToReturn: string;
  name: string;
  color: string;
  quality?: string;
  size: string;
  unit: string;
  price: number;
  itemDiscount?: number;
};

export function InvoiceTab({ invoices, onProcessInvoiceCancellationOrReturn, filter: filterProp, onFilterChange, availableYears }: InvoiceTabProps) {
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const [isReturnItemsDialogOpen, setIsReturnItemsDialogOpen] = useState(false);
  const [currentInvoiceForReturnDialog, setCurrentInvoiceForReturnDialog] = useState<Invoice | null>(null);
  const [returnItemsState, setReturnItemsState] = useState<Record<string, ReturnItemDetail>>({});

  const { day: currentDay, month: currentMonth, year: currentYear } = filterProp;

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
      initialReturnItems[item.id] = {
        originalQuantityInCart: item.quantityInCart,
        quantityToReturn: "0",
        name: item.name,
        color: item.color,
        quality: item.quality,
        size: item.size,
        unit: item.unit,
        price: item.price,
        itemDiscount: item.itemDiscount,
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
          <CardTitle className="text-4xl font-bold">Danh sách hóa đơn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6 p-4 bg-muted/30 rounded-lg items-end">
            <div>
              <Label htmlFor="invoice-filter-day" className="text-sm">Ngày</Label>
              <Select
                value={currentDay}
                onValueChange={(value) => onFilterChange({ day: value, month: currentMonth, year: currentYear })}
              >
                <SelectTrigger id="invoice-filter-day" className="w-full sm:w-28 bg-card h-9">
                  <SelectValue placeholder="Ngày" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="invoice-filter-month" className="text-sm">Tháng</Label>
              <Select
                value={currentMonth}
                onValueChange={(value) => onFilterChange({ day: currentDay, month: value, year: currentYear })}
              >
                <SelectTrigger id="invoice-filter-month" className="w-full sm:w-32 bg-card h-9">
                  <SelectValue placeholder="Tháng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      Tháng {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="invoice-filter-year" className="text-sm">Năm</Label>
              <Select
                value={currentYear}
                onValueChange={(value) => onFilterChange({ day: currentDay, month: currentMonth, year: value })}
              >
                <SelectTrigger id="invoice-filter-year" className="w-full sm:w-32 bg-card h-9">
                  <SelectValue placeholder="Năm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                const now = new Date();
                onFilterChange({
                  day: now.getDate().toString(),
                  month: (now.getMonth() + 1).toString(),
                  year: now.getFullYear().toString(),
                });
              }}
              variant="outline"
              className="h-9"
            >
              Hôm nay
            </Button>
          </div>

          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Không có hóa đơn nào phù hợp với bộ lọc.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Đã thanh toán</TableHead>
                    <TableHead className="text-[hsl(var(--destructive))]">Giảm giá</TableHead>
                    <TableHead className="text-[hsl(var(--destructive))]">Tiền nợ</TableHead>
                    <TableHead>Chi tiết</TableHead>
                    <TableHead className="text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(invoice => {
                    const hasDebt = invoice.debtAmount && invoice.debtAmount > 0;
                    const displayedAmount = (!hasDebt ? invoice.total : (invoice.amountPaid ?? 0));
                    const isCashPayment = invoice.paymentMethod === 'Tiền mặt';
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleString('vi-VN')}</TableCell>
                        <TableCell className={cn(isCashPayment && displayedAmount > 0 ? 'text-[hsl(var(--success))]' : '')}>
                          {displayedAmount.toLocaleString('vi-VN')} VNĐ
                        </TableCell>
                        <TableCell className="text-[hsl(var(--destructive))]">
                          {(invoice.discount ?? 0).toLocaleString('vi-VN')} VNĐ
                        </TableCell>
                        <TableCell className="text-[hsl(var(--destructive))]">
                          {(invoice.debtAmount ?? 0).toLocaleString('vi-VN')} VNĐ
                        </TableCell>
                        <TableCell>
                          <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80" onClick={() => setSelectedInvoiceDetails(invoice)}>
                            <Eye className="h-4 w-4 mr-1" /> Xem
                          </Button>
                        </TableCell>
                        <TableCell className="text-center space-x-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-accent hover:text-accent/80" onClick={() => openReturnItemsDialog(invoice)} title="Hoàn trả sản phẩm">
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => openDeleteConfirmDialog(invoice)} title="Xóa hóa đơn">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {selectedInvoiceDetails && (
            <Dialog open={!!selectedInvoiceDetails} onOpenChange={(open) => !open && setSelectedInvoiceDetails(null)}>
              <DialogContent className="sm:max-w-3xl">
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
                      {selectedInvoiceDetails.items.map((item: InvoiceCartItem, index: number) => (
                        <TableRow key={`${item.id}-${index}`}>
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
                <Separator className="my-4" />
                {selectedInvoiceDetails.discount !== undefined && selectedInvoiceDetails.discount > 0 && (
                    <>
                        <div className="flex justify-between text-sm text-[hsl(var(--destructive))]">
                            <span>Giảm giá:</span>
                            <span>-{selectedInvoiceDetails.discount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    </>
                )}
                <div className="flex justify-between font-bold text-lg text-foreground">
                  <span>Tổng thanh toán HĐ:</span>
                  <span>{selectedInvoiceDetails.total.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                 {selectedInvoiceDetails.amountPaid !== undefined && (
                     <>
                        <Separator className="my-2" />
                        <div className={cn(
                          "flex justify-between text-sm",
                           selectedInvoiceDetails.paymentMethod === 'Tiền mặt' &&
                           ((!selectedInvoiceDetails.debtAmount || selectedInvoiceDetails.debtAmount === 0) ? selectedInvoiceDetails.total : (selectedInvoiceDetails.amountPaid ?? 0)) > 0
                           ? 'text-[hsl(var(--success))]' : 'text-foreground'
                        )}>
                            <span>Đã thanh toán ({selectedInvoiceDetails.paymentMethod}):</span>
                            <span>
                              {((!selectedInvoiceDetails.debtAmount || selectedInvoiceDetails.debtAmount === 0)
                                ? selectedInvoiceDetails.total
                                : (selectedInvoiceDetails.amountPaid ?? 0)
                              ).toLocaleString('vi-VN')} VNĐ
                            </span>
                        </div>
                        {((!selectedInvoiceDetails.debtAmount || selectedInvoiceDetails.debtAmount === 0) ? selectedInvoiceDetails.total : (selectedInvoiceDetails.amountPaid ?? 0)) - selectedInvoiceDetails.total > 0 && (
                             <div className="flex justify-between text-sm text-[hsl(var(--success))]">
                                <span>Tiền thừa:</span>
                                <span>{((( !selectedInvoiceDetails.debtAmount || selectedInvoiceDetails.debtAmount === 0) ? selectedInvoiceDetails.total : (selectedInvoiceDetails.amountPaid ?? 0)) - selectedInvoiceDetails.total).toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                        )}
                        {selectedInvoiceDetails.debtAmount && selectedInvoiceDetails.debtAmount > 0 && (
                             <div className="flex justify-between text-sm text-[hsl(var(--destructive))]">
                                <span>Số tiền nợ của HĐ này:</span>
                                <span>{selectedInvoiceDetails.debtAmount.toLocaleString('vi-VN')} VNĐ</span>
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
                    Bạn có chắc chắn muốn xóa hóa đơn #{invoiceToDelete.id.substring(0,6)}...? Các sản phẩm trong hóa đơn này sẽ được hoàn trả lại vào kho. Công nợ liên quan (nếu có) cũng sẽ được xóa.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>Hủy</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleConfirmDelete}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                    Xóa hóa đơn
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {isReturnItemsDialogOpen && currentInvoiceForReturnDialog && (
        <Dialog open={isReturnItemsDialogOpen} onOpenChange={setIsReturnItemsDialogOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Hoàn trả sản phẩm cho HĐ #{currentInvoiceForReturnDialog.id.substring(0,6)}</DialogTitle>
              <DialogDescription>Chọn sản phẩm và số lượng muốn hoàn trả. Các sản phẩm sẽ được cộng lại vào kho.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Sản phẩm</TableHead>
                    <TableHead>Màu</TableHead>
                    <TableHead>Chất lượng</TableHead>
                    <TableHead>Kích thước</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-center">Số lượng mua</TableHead>
                    <TableHead className="text-center w-40">Số lượng hoàn trả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(returnItemsState).map(([productId, itemData]) => (
                    <TableRow key={productId}>
                      <TableCell className="font-medium">{itemData.name}</TableCell>
                      <TableCell className="text-xs">{itemData.color}</TableCell>
                      <TableCell className="text-xs">{itemData.quality || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{itemData.size}</TableCell>
                      <TableCell className="text-xs">{itemData.unit}</TableCell>
                      <TableCell className="text-right text-xs">{itemData.price.toLocaleString('vi-VN')} VNĐ</TableCell>
                      <TableCell className="text-center text-xs">{itemData.originalQuantityInCart}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleReturnItemQuantityChange(productId, (parseInt(itemData.quantityToReturn) - 1).toString())}
                            disabled={parseInt(itemData.quantityToReturn) <= 0}
                            aria-label="Giảm số lượng hoàn trả"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            id={`return-qty-${productId}`}
                            type="number"
                            value={itemData.quantityToReturn}
                            onChange={(e) => handleReturnItemQuantityChange(productId, e.target.value)}
                            min="0"
                            max={itemData.originalQuantityInCart.toString()}
                            className="w-12 h-7 text-center text-sm hide-number-spinners px-1 bg-card"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleReturnItemQuantityChange(productId, (parseInt(itemData.quantityToReturn) + 1).toString())}
                            disabled={parseInt(itemData.quantityToReturn) >= itemData.originalQuantityInCart}
                            aria-label="Tăng số lượng hoàn trả"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsReturnItemsDialogOpen(false)}>Hủy</Button>
              <Button
                onClick={handleConfirmSelectiveReturn}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
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


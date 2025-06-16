
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Customer, Invoice, InvoiceCartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from '@/components/ui/textarea';
import { formatPhoneNumber, cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Pencil, Trash2, Eye, ListChecks } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface CustomerTabProps {
  customers: Customer[];
  invoices: Invoice[];
  onAddCustomer: (newCustomerData: Omit<Customer, 'id'>) => Promise<void>;
  onUpdateCustomer: (customerId: string, updatedCustomerData: Omit<Customer, 'id'>) => Promise<void>;
  onDeleteCustomer: (customerId: string) => Promise<void>;
}

const initialFormState: Omit<Customer, 'id'> = { name: '', phone: '', address: '' };

export function CustomerTab({ customers, invoices, onAddCustomer, onUpdateCustomer, onDeleteCustomer }: CustomerTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id'>>(initialFormState);

  const [isEditing, setIsEditing] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [editedCustomer, setEditedCustomer] = useState<Omit<Customer, 'id'>>(initialFormState);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { toast } = useToast();

  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);
  const [isCustomerDetailsModalOpen, setIsCustomerDetailsModalOpen] = useState(false);

  const [invoiceForDetailedView, setInvoiceForDetailedView] = useState<Invoice | null>(null);
  const [isInvoiceDetailModalOpen, setIsInvoiceDetailModalOpen] = useState(false);


  useEffect(() => {
    if (customerToEdit) {
      setEditedCustomer({
        name: customerToEdit.name,
        phone: customerToEdit.phone,
        address: customerToEdit.address || '',
      });
    } else {
      setEditedCustomer(initialFormState);
    }
  }, [customerToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formSetter: React.Dispatch<React.SetStateAction<Omit<Customer, 'id'>>>) => {
    const { name, value } = e.target;
    formSetter(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      toast({ title: "Lỗi", description: "Vui lòng điền tên và số điện thoại khách hàng.", variant: "destructive" });
      return;
    }
    if (customers.some(c => c.phone === newCustomer.phone)) {
      toast({ title: "Lỗi", description: "Số điện thoại đã tồn tại cho khách hàng khác.", variant: "destructive" });
      return;
    }
    await onAddCustomer(newCustomer);
    setNewCustomer(initialFormState);
    setIsAdding(false);
  };

  const openEditDialog = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToEdit || !editedCustomer.name || !editedCustomer.phone) {
      toast({ title: "Lỗi", description: "Vui lòng điền tên và số điện thoại khách hàng.", variant: "destructive" });
      return;
    }
    if (customers.some(c => c.id !== customerToEdit.id && c.phone === editedCustomer.phone)) {
      toast({ title: "Lỗi", description: "Số điện thoại đã tồn tại cho khách hàng khác.", variant: "destructive" });
      return;
    }
    await onUpdateCustomer(customerToEdit.id, editedCustomer);
    setIsEditing(false);
    setCustomerToEdit(null);
  };

  const openDeleteConfirmDialog = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (customerToDelete) {
      await onDeleteCustomer(customerToDelete.id);
      setIsConfirmingDelete(false);
      setCustomerToDelete(null);
    }
  };

  const openCustomerDetailsDialog = (customer: Customer) => {
    setSelectedCustomerForDetails(customer);
    setIsCustomerDetailsModalOpen(true);
  };

  const closeCustomerDetailsDialog = () => {
    setSelectedCustomerForDetails(null);
    setIsCustomerDetailsModalOpen(false);
  };

  const openInvoiceItemDetailsDialog = (invoice: Invoice) => {
    setInvoiceForDetailedView(invoice);
    setIsInvoiceDetailModalOpen(true);
  };

  const closeInvoiceItemDetailsDialog = () => {
    setInvoiceForDetailedView(null);
    setIsInvoiceDetailModalOpen(false);
  };

  const customerInvoices = useMemo(() => {
    if (!selectedCustomerForDetails) return [];
    return invoices
      .filter(invoice => invoice.customerName === selectedCustomerForDetails.name)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCustomerForDetails, invoices]);

  const renderCustomerForm = (
    formState: Omit<Customer, 'id'>,
    formSetter: React.Dispatch<React.SetStateAction<Omit<Customer, 'id'>>>,
    handleSubmit: (e: React.FormEvent) => Promise<void>,
    isEditMode: boolean,
    onCancel?: () => void
  ) => (
     <form onSubmit={handleSubmit} className="mb-6 p-4 bg-muted/50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <Input
            type="text"
            name="name"
            placeholder="Tên khách hàng (*)"
            value={formState.name}
            onChange={(e) => handleInputChange(e, formSetter)}
            required
            className="md:col-span-1 bg-card"
        />
        <Input
            type="tel"
            name="phone"
            placeholder="Số điện thoại (*)"
            value={formState.phone}
            onChange={(e) => handleInputChange(e, formSetter)}
            required
            className="md:col-span-1 bg-card"
        />
        <Textarea
            name="address"
            placeholder="Địa chỉ"
            value={formState.address}
            onChange={(e) => handleInputChange(e, formSetter)}
            className="md:col-span-3 h-44 resize-none bg-card"
        />
        <div className="md:col-span-3 flex justify-end gap-2">
            {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>}
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isEditMode ? 'Lưu thay đổi' : 'Lưu khách hàng'}
            </Button>
        </div>
    </form>
  );


  return (
    <>
      <Card>
        <CardHeader className="p-6">
          <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">Danh sách khách hàng</CardTitle>
              <Button
                onClick={() => { setIsAdding(!isAdding); if (isEditing) setIsEditing(false); setNewCustomer(initialFormState); }}
                variant="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                  <PlusCircle className="mr-2 h-4 w-4" /> {isAdding ? 'Hủy thêm mới' : 'Thêm khách hàng'}
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAdding && renderCustomerForm(newCustomer, setNewCustomer, handleAdd, false, () => setIsAdding(false))}

          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{formatPhoneNumber(customer.phone)}</TableCell>
                    <TableCell>{customer.address || 'N/A'}</TableCell>
                    <TableCell className="text-center space-x-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openCustomerDetailsDialog(customer)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditDialog(customer)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => openDeleteConfirmDialog(customer)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && !isAdding && !isEditing && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">Chưa có khách hàng nào.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isEditing && customerToEdit && (
        <Dialog open={isEditing} onOpenChange={(open) => { if (!open) { setIsEditing(false); setCustomerToEdit(null); }}}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa thông tin khách hàng</DialogTitle>
              <DialogDescription>Cập nhật thông tin cho {customerToEdit.name}.</DialogDescription>
            </DialogHeader>
            {renderCustomerForm(editedCustomer, setEditedCustomer, handleUpdate, true, () => { setIsEditing(false); setCustomerToEdit(null); })}
          </DialogContent>
        </Dialog>
      )}

      {customerToDelete && (
        <AlertDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa khách hàng?</AlertDialogTitle>
                <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa khách hàng "{customerToDelete.name}" không? Hành động này không thể hoàn tác.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setIsConfirmingDelete(false); setCustomerToDelete(null); }}>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Xóa</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {selectedCustomerForDetails && (
        <Dialog open={isCustomerDetailsModalOpen} onOpenChange={closeCustomerDetailsDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Lịch sử giao dịch của: {selectedCustomerForDetails.name}</DialogTitle>
              <DialogDescription>
                Số điện thoại: {formatPhoneNumber(selectedCustomerForDetails.phone)}
                {selectedCustomerForDetails.address && ` | Địa chỉ: ${selectedCustomerForDetails.address}`}
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            {customerInvoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Khách hàng này chưa có giao dịch nào.</p>
            ) : (
              <ScrollArea className="max-h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Hóa đơn</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead>PT Thanh toán</TableHead>
                      <TableHead className="text-right text-destructive">Tiền nợ</TableHead>
                      <TableHead className="text-center">Chi tiết Hóa đơn</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerInvoices.map(invoice => (
                      <TableRow key={invoice.id} className={invoice.debtAmount && invoice.debtAmount > 0 ? "bg-destructive/5" : ""}>
                        <TableCell>{invoice.id.substring(0, 8)}...</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString('vi-VN')}</TableCell>
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
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={closeCustomerDetailsDialog}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {invoiceForDetailedView && (
        <Dialog open={isInvoiceDetailModalOpen} onOpenChange={closeInvoiceItemDetailsDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">Chi tiết sản phẩm Hóa đơn #{invoiceForDetailedView.id.substring(0,6)}...</DialogTitle>
              <DialogDescription>
                Khách hàng: {invoiceForDetailedView.customerName} <br />
                Ngày: {new Date(invoiceForDetailedView.date).toLocaleString('vi-VN')}
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-3" />
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-3 pr-2">
                {invoiceForDetailedView.items.map((item: InvoiceCartItem, index: number) => (
                  <Card key={`${item.id}-${index}`} className="p-3 bg-muted/40">
                    <p className="font-bold text-base text-primary mb-1.5">{item.name}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                        <p><span className="font-medium text-foreground/80">Màu sắc:</span> {item.color || 'N/A'}</p>
                        <p><span className="font-medium text-foreground/80">Chất lượng:</span> {item.quality || 'N/A'}</p> {/* Added */}
                        <p><span className="font-medium text-foreground/80">Kích thước:</span> {item.size || 'N/A'}</p>
                        <p><span className="font-medium text-foreground/80">Đơn vị:</span> {item.unit || 'N/A'}</p>
                    </div>
                    <div className="text-sm space-y-0.5">
                        <p><span className="font-medium">Số lượng:</span> {item.quantityInCart}</p>
                        <p><span className="font-medium">Đơn giá:</span> {item.price.toLocaleString('vi-VN')} VNĐ</p>
                        {item.itemDiscount && item.itemDiscount > 0 && (
                           <p className="text-destructive"><span className="font-medium">Đã giảm (SP):</span> {item.itemDiscount.toLocaleString('vi-VN')} VNĐ</p>
                        )}
                        <p className="font-semibold text-accent">Thành tiền (SP): {(item.price * item.quantityInCart - (item.itemDiscount || 0)).toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                  </Card>
                ))}
              </div>
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


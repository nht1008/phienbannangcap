
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Customer, Invoice, InvoiceCartItem, UserAccessRequest } from '@/types';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from '@/components/ui/textarea';
import { formatPhoneNumber, cn, normalizeStringForSearch } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertDialogTitleComponent } from "@/components/ui/alert-dialog";
import { PlusCircle, Pencil, Trash2, Eye, ListChecks, Users, CheckCircle, XCircle, Mail, MessageSquare } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/firebase';
import { ref, onValue, update, set, serverTimestamp, remove } from "firebase/database";

interface CustomerTabProps {
  customers: Customer[];
  invoices: Invoice[];
  onAddCustomer: (newCustomerData: Omit<Customer, 'id' | 'email'>) => Promise<void>;
  onUpdateCustomer: (customerId: string, updatedCustomerData: Omit<Customer, 'id' | 'email'>) => Promise<void>;
  onDeleteCustomer: (customerId: string) => Promise<void>;
  hasFullAccessRights: boolean;
  currentUser: User | null;
}

const initialFormState: Omit<Customer, 'id' | 'email'> = { name: '', phone: '', address: '', zaloName: '' };

export function CustomerTab({ customers, invoices, onAddCustomer, onUpdateCustomer, onDeleteCustomer, hasFullAccessRights, currentUser }: CustomerTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id' | 'email'>>(initialFormState);

  const [isEditing, setIsEditing] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [editedCustomer, setEditedCustomer] = useState<Omit<Customer, 'id' | 'email'>>(initialFormState);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { toast } = useToast();

  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);
  const [isCustomerDetailsModalOpen, setIsCustomerDetailsModalOpen] = useState(false);

  const [invoiceForDetailedView, setInvoiceForDetailedView] = useState<Invoice | null>(null);
  const [isInvoiceDetailModalOpen, setIsInvoiceDetailModalOpen] = useState(false);

  const [customerAccessRequests, setCustomerAccessRequests] = useState<UserAccessRequest[]>([]);
  const [isLoadingCustomerRequests, setIsLoadingCustomerRequests] = useState(false);
  const [isReviewCustomerDialogOpen, setIsReviewCustomerDialogOpen] = useState(false);
  const [customerRejectionReason, setCustomerRejectionReason] = useState("");
  const [customerRequestToReject, setCustomerRequestToReject] = useState<UserAccessRequest | null>(null);


  useEffect(() => {
    if (hasFullAccessRights) {
      setIsLoadingCustomerRequests(true);
      const requestsRef = ref(db, 'khach_hang_cho_duyet'); 
      const unsubscribe = onValue(requestsRef, (snapshot) => {
        const requestsData = snapshot.val();
        const loadedRequests: UserAccessRequest[] = [];
        if (requestsData) {
          Object.keys(requestsData).forEach(userId => {
            const requestDetails = requestsData[userId];
            loadedRequests.push({
              id: userId,
              fullName: requestDetails.fullName || 'Chưa có tên',
              email: requestDetails.email || '',
              phone: requestDetails.phone || '',
              address: requestDetails.address || '',
              zaloName: requestDetails.zaloName || '',
              requestedRole: 'customer', 
              status: 'pending', 
              requestDate: requestDetails.requestDate || new Date().toISOString(),
            });
          });
        }
        setCustomerAccessRequests(loadedRequests.sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()));
        setIsLoadingCustomerRequests(false);
      }, (error) => {
        console.error("Error fetching customer approval requests from khach_hang_cho_duyet:", error);
        toast({ title: "Lỗi tải yêu cầu", description: "Không thể tải danh sách yêu cầu từ 'khach_hang_cho_duyet'.", variant: "destructive" });
        setIsLoadingCustomerRequests(false);
      });
      return () => unsubscribe();
    }
  }, [hasFullAccessRights, toast]);

  const handleApproveCustomerRequest = async (request: UserAccessRequest) => {
    if (!hasFullAccessRights || !currentUser) return;
    try {
      const updates: Record<string, any> = {};
      
      updates[`users/${request.id}/approvalStatus`] = 'approved';
      updates[`users/${request.id}/reviewedBy`] = currentUser.uid;
      updates[`users/${request.id}/reviewDate`] = new Date().toISOString();
      updates[`users/${request.id}/displayName`] = request.fullName;
      updates[`users/${request.id}/email`] = request.email;
      updates[`users/${request.id}/phone`] = request.phone || '';
      updates[`users/${request.id}/address`] = request.address || '';
      updates[`users/${request.id}/zaloName`] = request.zaloName || '';
      updates[`users/${request.id}/profileCompletionDate`] = request.requestDate;


      updates[`customers/${request.id}`] = {
        name: request.fullName, 
        email: request.email, 
        phone: request.phone || '',
        address: request.address || '',
        zaloName: request.zaloName || '',
      };
      
      updates[`khach_hang_cho_duyet/${request.id}`] = null;
      
      await update(ref(db), updates);
      toast({ title: "Thành công", description: `Đã duyệt yêu cầu của khách hàng ${request.fullName}.`, variant: "default" });
    } catch (error) {
      console.error("Error approving customer request:", error);
      toast({ title: "Lỗi", description: "Không thể duyệt yêu cầu khách hàng.", variant: "destructive" });
    }
  };

  const openRejectCustomerDialog = (request: UserAccessRequest) => {
    setCustomerRequestToReject(request);
    setCustomerRejectionReason(""); 
  };

  const handleConfirmRejectCustomerRequest = async () => {
    if (!hasFullAccessRights || !currentUser || !customerRequestToReject) return;
    try {
      const updates: Record<string, any> = {};
      updates[`users/${customerRequestToReject.id}/approvalStatus`] = 'rejected';
      updates[`users/${customerRequestToReject.id}/reviewedBy`] = currentUser.uid;
      updates[`users/${customerRequestToReject.id}/reviewDate`] = new Date().toISOString();
      updates[`users/${customerRequestToReject.id}/rejectionReason`] = customerRejectionReason.trim() || "Không có lý do cụ thể.";

      updates[`khach_hang_cho_duyet/${customerRequestToReject.id}`] = null;

      await update(ref(db), updates);

      toast({ title: "Thành công", description: `Đã từ chối yêu cầu của ${customerRequestToReject.fullName}.`, variant: "default" });
      setCustomerRequestToReject(null);
      setCustomerRejectionReason("");
    } catch (error) {
      console.error("Error rejecting customer request:", error);
      toast({ title: "Lỗi", description: "Không thể từ chối yêu cầu khách hàng.", variant: "destructive" });
    }
  };


  useEffect(() => {
    if (customerToEdit) {
      setEditedCustomer({
        name: customerToEdit.name,
        phone: customerToEdit.phone,
        address: customerToEdit.address || '',
        zaloName: customerToEdit.zaloName || '',
      });
    } else {
      setEditedCustomer(initialFormState);
    }
  }, [customerToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formSetter: React.Dispatch<React.SetStateAction<Omit<Customer, 'id' | 'email'>>>) => {
    const { name, value } = e.target;
    formSetter(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.zaloName?.trim() || !newCustomer.address?.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng điền tên, số điện thoại, tên Zalo và địa chỉ khách hàng.", variant: "destructive" });
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
    if (!customerToEdit || !editedCustomer.name || !editedCustomer.phone || !editedCustomer.zaloName?.trim() || !editedCustomer.address?.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng điền tên, số điện thoại, tên Zalo và địa chỉ khách hàng.", variant: "destructive" });
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

  const renderCustomerForm = (
    formState: Omit<Customer, 'id' | 'email'>,
    formSetter: React.Dispatch<React.SetStateAction<Omit<Customer, 'id' | 'email'>>>,
    handleSubmit: (e: React.FormEvent) => Promise<void>,
    isEditMode: boolean,
    onCancel?: () => void
  ) => (
     <form onSubmit={handleSubmit} className="mb-6 p-4 bg-muted/50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="space-y-1">
            <Label htmlFor="form-name">Tên khách hàng (*)</Label>
            <Input
                type="text"
                name="name"
                id="form-name"
                placeholder="Tên khách hàng"
                value={formState.name}
                onChange={(e) => handleInputChange(e, formSetter)}
                required
                className="bg-card"
            />
        </div>
        <div className="space-y-1">
            <Label htmlFor="form-phone">Số điện thoại (*)</Label>
            <Input
                type="tel"
                name="phone"
                id="form-phone"
                placeholder="Số điện thoại"
                value={formState.phone}
                onChange={(e) => handleInputChange(e, formSetter)}
                required
                className="bg-card"
            />
        </div>
        <div className="space-y-1">
            <Label htmlFor="form-zaloName">Tên Zalo (*)</Label>
            <Input
                type="text"
                name="zaloName"
                id="form-zaloName"
                placeholder="Tên Zalo"
                value={formState.zaloName || ''}
                onChange={(e) => handleInputChange(e, formSetter)}
                required
                className="bg-card"
            />
        </div>
        <div className="space-y-1 md:col-span-2">
            <Label htmlFor="form-address">Địa chỉ (*)</Label>
            <Textarea
                name="address"
                id="form-address"
                placeholder="Địa chỉ"
                value={formState.address || ''}
                onChange={(e) => handleInputChange(e, formSetter)}
                required
                className="min-h-[80px] bg-card"
            />
        </div>
        <div className="md:col-span-2 flex justify-end gap-2">
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
              {hasFullAccessRights && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsReviewCustomerDialogOpen(true)}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    <Users className="mr-2 h-4 w-4" /> Xét duyệt khách hàng ({customerAccessRequests.length})
                  </Button>
                  <Button
                    onClick={() => { setIsAdding(!isAdding); if (isEditing) setIsEditing(false); setNewCustomer(initialFormState); }}
                    variant="default"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                      <PlusCircle className="mr-2 h-4 w-4" /> {isAdding ? 'Hủy thêm mới' : 'Thêm khách hàng'}
                  </Button>
                </div>
              )}
          </div>
        </CardHeader>
        <CardContent>
          {isAdding && hasFullAccessRights && renderCustomerForm(newCustomer, setNewCustomer, handleAdd, false, () => setIsAdding(false))}

          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tên Zalo</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer, index) => (
                  <TableRow key={customer.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{formatPhoneNumber(customer.phone)}</TableCell>
                    <TableCell>{customer.email || 'N/A'}</TableCell>
                    <TableCell>{customer.zaloName || 'N/A'}</TableCell>
                    <TableCell>{customer.address || 'N/A'}</TableCell>
                    <TableCell className="text-center space-x-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openCustomerDetailsDialog(customer)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        {hasFullAccessRights && (
                          <>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditDialog(customer)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => openDeleteConfirmDialog(customer)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && !isAdding && !isEditing && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Chưa có khách hàng nào.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isEditing && customerToEdit && hasFullAccessRights && (
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

      {customerToDelete && hasFullAccessRights && (
        <AlertDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitleComponent>Xác nhận xóa khách hàng?</AlertDialogTitleComponent>
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
              <DialogDescription asChild>
                <div>
                  <p><strong>Số điện thoại:</strong> {formatPhoneNumber(selectedCustomerForDetails.phone)}</p>
                  <p><strong>Email:</strong> {selectedCustomerForDetails.email || 'N/A'}</p>
                  <p><strong>Tên Zalo:</strong> {selectedCustomerForDetails.zaloName || 'N/A'}</p>
                  {selectedCustomerForDetails.address && <p><strong>Địa chỉ:</strong> {selectedCustomerForDetails.address}</p>}
                </div>
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            {invoices
              .filter(invoice => normalizeStringForSearch(invoice.customerName) === normalizeStringForSearch(selectedCustomerForDetails.name))
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Khách hàng này chưa có giao dịch nào.</p>
            ) : (
              <ScrollArea className="max-h-[60vh]">
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
                      <TableHead className="text-center">Chi tiết Hóa đơn</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices
                      .filter(invoice => normalizeStringForSearch(invoice.customerName) === normalizeStringForSearch(selectedCustomerForDetails.name))
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((invoice, index) => {
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
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={closeCustomerDetailsDialog}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
            <ScrollArea className="max-h-[50vh]">
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

      {hasFullAccessRights && (
        <Dialog open={isReviewCustomerDialogOpen} onOpenChange={setIsReviewCustomerDialogOpen}>
          <DialogContent className="sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>Xét duyệt yêu cầu khách hàng ({customerAccessRequests.length})</DialogTitle>
              <DialogDescription>
                Duyệt hoặc từ chối các yêu cầu truy cập với vai trò khách hàng.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {isLoadingCustomerRequests ? (
                <p className="text-center text-muted-foreground">Đang tải danh sách yêu cầu...</p>
              ) : customerAccessRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Không có yêu cầu nào đang chờ xử lý.</p>
              ) : (
                <ScrollArea className="max-h-[60vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Họ và tên</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>SĐT</TableHead>
                        <TableHead>Tên Zalo</TableHead>
                        <TableHead>Địa chỉ</TableHead>
                        <TableHead>Ngày yêu cầu</TableHead>
                        <TableHead className="text-center">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerAccessRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>{req.fullName}</TableCell>
                          <TableCell>{req.email}</TableCell>
                          <TableCell>{formatPhoneNumber(req.phone)}</TableCell>
                          <TableCell>{req.zaloName || 'N/A'}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate" title={req.address}>{req.address || 'N/A'}</TableCell>
                          <TableCell>{new Date(req.requestDate).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell className="text-center space-x-2">
                            <Button
                              size="sm"
                              className="bg-success hover:bg-success/90 h-7 px-2"
                              onClick={() => handleApproveCustomerRequest(req)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2"
                              onClick={() => openRejectCustomerDialog(req)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />Từ chối
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsReviewCustomerDialogOpen(false)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {customerRequestToReject && (
        <Dialog open={!!customerRequestToReject} onOpenChange={() => setCustomerRequestToReject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Từ chối yêu cầu của {customerRequestToReject.fullName}?</DialogTitle>
              <DialogDescription>
                Nhập lý do từ chối (nếu có). Lý do này sẽ được hiển thị cho người dùng.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={customerRejectionReason}
              onChange={(e) => setCustomerRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối (tùy chọn)..."
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCustomerRequestToReject(null)}>Hủy</Button>
              <Button variant="destructive" onClick={handleConfirmRejectCustomerRequest}>Xác nhận từ chối</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}


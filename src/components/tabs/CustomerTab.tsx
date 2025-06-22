
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Customer, Invoice, InvoiceCartItem, UserAccessRequest, Employee } from '@/types';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from '@/components/ui/textarea';
import { formatPhoneNumber, cn, normalizeStringForSearch } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertDialogTitleComponent } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Pencil, Trash2, Eye, ListChecks, CheckCircle, XCircle, Users } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/firebase';
import { ref, onValue, set, remove } from "firebase/database";

interface CustomerTabProps {
  customers: Customer[];
  invoices: Invoice[];
  onAddCustomer: (newCustomerData: Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string }) => Promise<void>;
  onUpdateCustomer: (customerId: string, updatedCustomerData: Omit<Customer, 'id' | 'email'| 'zaloName'> & { zaloName?: string }) => Promise<void>;
  onDeleteCustomer: (customerId: string) => Promise<void>;
  hasFullAccessRights: boolean;
  currentUser: User | null;
}

const initialFormState: Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string } = { name: '', phone: '', address: '', zaloName: '' };


export function CustomerTab({ customers, invoices, onAddCustomer, onUpdateCustomer, onDeleteCustomer, hasFullAccessRights, currentUser }: CustomerTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string }>(initialFormState);

  const [isEditing, setIsEditing] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [editedCustomer, setEditedCustomer] = useState<Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string }>(initialFormState);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { toast } = useToast();

  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);
  const [isCustomerDetailsModalOpen, setIsCustomerDetailsModalOpen] = useState(false);

  const [invoiceForDetailedView, setInvoiceForDetailedView] = useState<Invoice | null>(null);
  const [isInvoiceDetailModalOpen, setIsInvoiceDetailModalOpen] = useState(false);

  const [customerRequests, setCustomerRequests] = useState<UserAccessRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  useEffect(() => {
    if (hasFullAccessRights) {
      setIsLoadingRequests(true);
      const requestsRef = ref(db, 'khach_hang_cho_duyet');
      const unsubscribe = onValue(requestsRef, (snapshot) => {
        const data = snapshot.val();
        const loadedRequests: UserAccessRequest[] = [];
        if (data) {
          Object.keys(data).forEach(key => {
            loadedRequests.push({ id: key, ...data[key] });
          });
        }
        setCustomerRequests(loadedRequests.sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()));
        setIsLoadingRequests(false);
      }, (error) => {
        console.error("Error fetching customer requests:", error);
        toast({ title: "Lỗi tải yêu cầu", description: "Không thể tải danh sách yêu cầu khách hàng.", variant: "destructive" });
        setIsLoadingRequests(false);
      });
      return () => unsubscribe();
    }
  }, [hasFullAccessRights, toast]);

  const handleApproveRequest = async (request: UserAccessRequest) => {
    if (!currentUser) return;
    try {
      if (request.requestedRole === 'customer') {
        const newCustomerData: Omit<Customer, 'id'> = {
            name: request.fullName,
            phone: request.phone,
            address: request.address,
            email: request.email,
            zaloName: request.zaloName,
        };
        await set(ref(db, `customers/${request.id}`), newCustomerData);
        toast({ title: "Thành công", description: `Đã duyệt khách hàng ${request.fullName}.` });
      } else if (request.requestedRole === 'employee') {
        const newEmployeeData: Omit<Employee, 'id'> = {
            name: request.fullName,
            email: request.email,
            position: 'Nhân viên',
            phone: request.phone,
            zaloName: request.zaloName,
        };
        await set(ref(db, `employees/${request.id}`), newEmployeeData);
        toast({ title: "Thành công", description: `Đã duyệt nhân viên ${request.fullName}.` });
      } else {
        throw new Error('Vai trò yêu cầu không hợp lệ.');
      }
      await remove(ref(db, `khach_hang_cho_duyet/${request.id}`));
    } catch (error: any) {
        console.error("Error approving request:", error);
        toast({ title: "Lỗi", description: `Không thể duyệt yêu cầu: ${error.message}`, variant: "destructive" });
    }
  };

  const handleRejectRequest = async (request: UserAccessRequest) => {
     try {
        await remove(ref(db, `khach_hang_cho_duyet/${request.id}`));
        toast({ title: "Đã từ chối", description: `Đã từ chối yêu cầu của ${request.fullName}.` });
    } catch (error) {
        console.error("Error rejecting customer:", error);
        toast({ title: "Lỗi", description: "Không thể từ chối yêu cầu.", variant: "destructive" });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formSetter: React.Dispatch<React.SetStateAction<Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string }>>) => {
    const { name, value } = e.target;
    formSetter(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.zaloName) {
      toast({ title: "Lỗi", description: "Vui lòng điền tên, số điện thoại và tên Zalo khách hàng.", variant: "destructive" });
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
    if (!customerToEdit || !editedCustomer.name || !editedCustomer.phone || !editedCustomer.zaloName) {
      toast({ title: "Lỗi", description: "Vui lòng điền tên, số điện thoại và tên Zalo khách hàng.", variant: "destructive" });
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
    formState: Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string },
    formSetter: React.Dispatch<React.SetStateAction<Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string }>>,
    handleSubmit: (e: React.FormEvent) => Promise<void>,
    isEditMode: boolean,
    onCancel?: () => void
  ) => (
     <form onSubmit={handleSubmit} className="mb-6 p-4 bg-muted/50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="space-y-1">
            <Label htmlFor="form-name">Tên khách hàng (*)</Label>
            <Input
                id="form-name"
                type="text"
                name="name"
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
                id="form-phone"
                type="tel"
                name="phone"
                placeholder="Số điện thoại"
                value={formState.phone}
                onChange={(e) => handleInputChange(e, formSetter)}
                required
                className="bg-card"
            />
        </div>
        <div className="space-y-1 md:col-span-2">
            <Label htmlFor="form-zaloName">Tên Zalo (*)</Label>
            <Input
                id="form-zaloName"
                type="text"
                name="zaloName"
                placeholder="Tên Zalo"
                value={formState.zaloName || ''}
                onChange={(e) => handleInputChange(e, formSetter)}
                required
                className="bg-card"
            />
        </div>
        <div className="space-y-1 md:col-span-2">
            <Label htmlFor="form-address">Địa chỉ</Label>
            <Textarea
                id="form-address"
                name="address"
                placeholder="Địa chỉ"
                value={formState.address || ''}
                onChange={(e) => handleInputChange(e, formSetter)}
                className="h-24 resize-none bg-card"
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
          <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <CardTitle className="text-2xl font-bold">Danh sách khách hàng</CardTitle>
                <CardDescription>Quản lý và xem lịch sử giao dịch của khách hàng.</CardDescription>
              </div>
              <div className="flex gap-2">
                {hasFullAccessRights && (
                    <Button onClick={() => setIsReviewDialogOpen(true)} variant="outline" className="border-primary text-primary hover:bg-primary/10">
                        <Users className="mr-2 h-4 w-4" /> Xét duyệt yêu cầu ({customerRequests.length})
                    </Button>
                )}
                {hasFullAccessRights && (
                  <Button
                    onClick={() => { setIsAdding(!isAdding); if (isEditing) setIsEditing(false); setNewCustomer(initialFormState); }}
                    variant="default"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                      <PlusCircle className="mr-2 h-4 w-4" /> {isAdding ? 'Hủy thêm mới' : 'Thêm khách hàng'}
                  </Button>
                )}
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {isAdding && hasFullAccessRights && renderCustomerForm(newCustomer, setNewCustomer, handleAdd, false, () => setIsAdding(false))}

          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tên Zalo</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(customer => (
                  <TableRow key={customer.id}>
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
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Chưa có khách hàng nào.</TableCell></TableRow>
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

       {hasFullAccessRights && (
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Xét duyệt yêu cầu truy cập ({customerRequests.length})</DialogTitle>
                    <DialogDescription>
                        Duyệt hoặc từ chối các yêu cầu đăng ký tài khoản.
                    </DialogDescription>
                </DialogHeader>
                 <div className="mt-4">
                    {isLoadingRequests ? (
                        <p className="text-center text-muted-foreground">Đang tải danh sách yêu cầu...</p>
                    ) : customerRequests.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">Không có yêu cầu nào đang chờ xử lý.</p>
                    ) : (
                        <ScrollArea className="max-h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Họ và tên</TableHead>
                                        <TableHead>Vai trò YC</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>SĐT</TableHead>
                                        <TableHead>Tên Zalo</TableHead>
                                        <TableHead>Địa chỉ</TableHead>
                                        <TableHead>Ngày YC</TableHead>
                                        <TableHead className="text-center">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customerRequests.map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell>{req.fullName}</TableCell>
                                            <TableCell>
                                              <span className={cn(
                                                'px-2 py-1 text-xs font-semibold rounded-full',
                                                req.requestedRole === 'customer' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                                              )}>
                                                {req.requestedRole === 'customer' ? 'Khách hàng' : 'Nhân viên'}
                                              </span>
                                            </TableCell>
                                            <TableCell>{req.email}</TableCell>
                                            <TableCell>{formatPhoneNumber(req.phone)}</TableCell>
                                            <TableCell>{req.zaloName || 'N/A'}</TableCell>
                                            <TableCell className="text-xs max-w-[150px] truncate" title={req.address || 'N/A'}>{req.address || 'N/A'}</TableCell>
                                            <TableCell>{new Date(req.requestDate).toLocaleDateString('vi-VN')}</TableCell>
                                            <TableCell className="text-center space-x-1">
                                                <Button size="sm" className="bg-success hover:bg-success/90 h-7 px-2" onClick={() => handleApproveRequest(req)}>
                                                    <CheckCircle className="h-4 w-4 mr-1"/>Duyệt
                                                </Button>
                                                <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => handleRejectRequest(req)}>
                                                    <XCircle className="h-4 w-4 mr-1"/>Từ chối
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
                    <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>Đóng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      {selectedCustomerForDetails && (
        <Dialog open={isCustomerDetailsModalOpen} onOpenChange={closeCustomerDetailsDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Lịch sử giao dịch của: {selectedCustomerForDetails.name}</DialogTitle>
              <DialogDescription asChild>
                <div>
                  <p>Số điện thoại: {formatPhoneNumber(selectedCustomerForDetails.phone)}</p>
                  {selectedCustomerForDetails.email && <p>Email: {selectedCustomerForDetails.email}</p>}
                  {selectedCustomerForDetails.zaloName && <p>Tên Zalo: {selectedCustomerForDetails.zaloName}</p>}
                  {selectedCustomerForDetails.address && <p>Địa chỉ: {selectedCustomerForDetails.address}</p>}
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
    </>
  );
}

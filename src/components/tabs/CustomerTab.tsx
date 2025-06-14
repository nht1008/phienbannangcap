
"use client";

import React, { useState, useEffect } from 'react';
import type { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from '@/components/ui/textarea';
import { formatPhoneNumber } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface CustomerTabProps {
  customers: Customer[];
  onAddCustomer: (newCustomerData: Omit<Customer, 'id'>) => Promise<void>;
  onUpdateCustomer: (customerId: string, updatedCustomerData: Omit<Customer, 'id'>) => Promise<void>;
  onDeleteCustomer: (customerId: string) => Promise<void>;
}

const initialFormState: Omit<Customer, 'id'> = { name: '', phone: '', address: '' };

export function CustomerTab({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer }: CustomerTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id'>>(initialFormState);

  const [isEditing, setIsEditing] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [editedCustomer, setEditedCustomer] = useState<Omit<Customer, 'id'>>(initialFormState);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { toast } = useToast();

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
            className="md:col-span-3 h-20 resize-none bg-card" 
        />
        <div className="md:col-span-3 flex justify-end gap-2">
            {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>}
            <Button type="submit" className="bg-green-500 text-white hover:bg-green-600">
                {isEditMode ? 'Lưu thay đổi' : 'Lưu khách hàng'}
            </Button>
        </div>
    </form>
  );


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
              <CardTitle className="text-4xl font-bold">Danh sách khách hàng</CardTitle>
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
                    <TableCell className="text-center space-x-2">
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
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-10">Chưa có khách hàng nào.</TableCell></TableRow>
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
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

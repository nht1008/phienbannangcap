
"use client";

import React, { useState, useEffect } from 'react';
import type { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from '@/lib/utils';
import type { User } from 'firebase/auth';
import { Label } from '@/components/ui/label';

interface EmployeeTabProps {
  employees: Employee[];
  currentUser: User | null;
  onAddEmployee: (newEmployeeData: Omit<Employee, 'id'>) => Promise<void>;
  onUpdateEmployee: (employeeId: string, updatedEmployeeData: Partial<Omit<Employee, 'id'>>) => Promise<void>;
  onDeleteEmployee: (employeeId: string) => Promise<void>;
}

const initialAddFormState: Omit<Employee, 'id' | 'userId'> = { name: '', position: 'Nhân viên', phone: '', email: '' };
const initialEditFormState: Partial<Omit<Employee, 'id' | 'userId'>> = { name: '', position: '', phone: '', email: '' };


export function EmployeeTab({ employees, currentUser, onAddEmployee, onUpdateEmployee, onDeleteEmployee }: EmployeeTabProps) {
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployeeData, setNewEmployeeData] = useState<Omit<Employee, 'id' | 'userId'>>(initialAddFormState);

  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [editedEmployeeData, setEditedEmployeeData] = useState<Partial<Omit<Employee, 'id' | 'userId'>>>(initialEditFormState);

  const [isConfirmingDeleteEmployee, setIsConfirmingDeleteEmployee] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const { toast } = useToast();

  const isAdmin = currentUser?.email === 'nthe1008@gmail.com';

  useEffect(() => {
    if (employeeToEdit) {
      setEditedEmployeeData({
        name: employeeToEdit.name,
        position: employeeToEdit.position,
        phone: employeeToEdit.phone,
        email: employeeToEdit.email || '',
      });
    } else {
      setEditedEmployeeData(initialEditFormState);
    }
  }, [employeeToEdit]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    formSetter: React.Dispatch<React.SetStateAction<any>> // Use any for flexibility with different form states
  ) => {
    const { name, value } = e.target;
    formSetter(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeData.name || !newEmployeeData.position || !newEmployeeData.phone || !newEmployeeData.email) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin nhân viên (Tên, Chức vụ, SĐT, Email).", variant: "destructive" });
      return;
    }
    if (employees.some(emp => emp.email === newEmployeeData.email)) {
      toast({ title: "Lỗi", description: "Email đã tồn tại cho nhân viên khác.", variant: "destructive" });
      return;
    }
    if (employees.some(emp => emp.phone === newEmployeeData.phone)) {
      toast({ title: "Lỗi", description: "Số điện thoại đã tồn tại cho nhân viên khác.", variant: "destructive" });
      return;
    }
    await onAddEmployee({ ...newEmployeeData, userId: currentUser!.uid }); // Admin creating employee will use Admin's UID as creator/owner
    setNewEmployeeData(initialAddFormState);
    setIsAddingEmployee(false);
  };

  const openEditDialog = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setIsEditingEmployee(true);
    setIsAddingEmployee(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeToEdit) return;

    const dataToUpdate: Partial<Omit<Employee, 'id'>> = {};

    if (isAdmin) { // Admin can edit name, position, phone, email (unless it's their own admin record)
        if (!editedEmployeeData.name || !editedEmployeeData.position || !editedEmployeeData.phone || !editedEmployeeData.email) {
            toast({ title: "Lỗi", description: "Admin: Vui lòng điền đầy đủ Tên, Chức vụ, SĐT, Email.", variant: "destructive" });
            return;
        }
        if (employeeToEdit.email !== editedEmployeeData.email && employees.some(emp => emp.id !== employeeToEdit.id && emp.email === editedEmployeeData.email)) {
            toast({ title: "Lỗi", description: "Email đã tồn tại cho nhân viên khác.", variant: "destructive" });
            return;
        }
         if (employeeToEdit.phone !== editedEmployeeData.phone && employees.some(emp => emp.id !== employeeToEdit.id && emp.phone === editedEmployeeData.phone)) {
            toast({ title: "Lỗi", description: "Số điện thoại đã tồn tại cho nhân viên khác.", variant: "destructive" });
            return;
        }

        dataToUpdate.name = editedEmployeeData.name;
        dataToUpdate.position = editedEmployeeData.position;
        dataToUpdate.phone = editedEmployeeData.phone;
        dataToUpdate.email = editedEmployeeData.email;

        // Admin cannot change their own email or position directly if they are the "Chủ cửa hàng"
        if (employeeToEdit.email === 'nthe1008@gmail.com') {
            dataToUpdate.email = 'nthe1008@gmail.com'; // Keep admin email fixed
            dataToUpdate.position = 'Chủ cửa hàng'; // Keep admin position fixed
            // Admin name can be updated through profile sync from AuthContext if it matches displayName
            if(currentUser?.displayName && employeeToEdit.name !== currentUser.displayName) {
                 dataToUpdate.name = currentUser.displayName;
            }
        }

    } else if (currentUser?.uid === employeeToEdit.userId) { // Regular employee editing their own record
        if (!editedEmployeeData.phone) {
            toast({ title: "Lỗi", description: "Vui lòng nhập số điện thoại.", variant: "destructive" });
            return;
        }
         if (employeeToEdit.phone !== editedEmployeeData.phone && employees.some(emp => emp.id !== employeeToEdit.id && emp.phone === editedEmployeeData.phone)) {
            toast({ title: "Lỗi", description: "Số điện thoại đã tồn tại cho nhân viên khác.", variant: "destructive" });
            return;
        }
        dataToUpdate.phone = editedEmployeeData.phone;
        // Name and email for regular employees are synced from Auth profile
        if(currentUser?.displayName) dataToUpdate.name = currentUser.displayName;
        if(currentUser?.email) dataToUpdate.email = currentUser.email;
        dataToUpdate.position = "Nhân viên"; // Keep position fixed for non-admin
    } else {
        toast({ title: "Lỗi", description: "Bạn không có quyền cập nhật thông tin này.", variant: "destructive" });
        return;
    }

    await onUpdateEmployee(employeeToEdit.id, dataToUpdate);
    setIsEditingEmployee(false);
    setEmployeeToEdit(null);
  };

  const openDeleteConfirmDialog = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsConfirmingDeleteEmployee(true);
  };

  const handleConfirmDelete = async () => {
    if (employeeToDelete) {
      await onDeleteEmployee(employeeToDelete.id);
      setIsConfirmingDeleteEmployee(false);
      setEmployeeToDelete(null);
    }
  };
  
 const renderEmployeeForm = (
    formState: Partial<Omit<Employee, 'id' | 'userId'>>, // Partial for edit, full for add
    formSetter: React.Dispatch<React.SetStateAction<any>>,
    handleSubmit: (e: React.FormEvent) => Promise<void>,
    isEditMode: boolean,
    onCancel?: () => void
  ) => {
    const isOwnRecord = isEditMode && employeeToEdit?.userId === currentUser?.uid;
    const isEditingAdminOwnRecord = isOwnRecord && isAdmin && employeeToEdit?.email === 'nthe1008@gmail.com';
    const canEditName = isAdmin && (!isOwnRecord || !isEditingAdminOwnRecord); // Admin can edit others' names, or their own if not the main admin record (e.g. if they added themselves as another role by mistake)
    const canEditPosition = isAdmin && (!isOwnRecord || !isEditingAdminOwnRecord);
    const canEditEmail = isAdmin && (!isOwnRecord || !isEditingAdminOwnRecord);

    return (
     <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div>
            <Label htmlFor="name">Tên nhân viên (*)</Label>
            <Input
                id="name"
                type="text"
                name="name"
                placeholder="Tên nhân viên"
                value={formState.name || ''}
                onChange={(e) => handleInputChange(e, formSetter)}
                required
                className="bg-card"
                disabled={!isEditMode ? false : (isOwnRecord && !isAdmin ? true : !canEditName)} // Disabled for own record if not admin
            />
        </div>
        <div>
            <Label htmlFor="position">Chức vụ (*)</Label>
            <Input
                id="position"
                type="text"
                name="position"
                placeholder="Chức vụ"
                value={formState.position || ''}
                onChange={(e) => handleInputChange(e, formSetter)}
                required
                className="bg-card"
                disabled={!isEditMode ? false : (isOwnRecord && !isAdmin ? true : !canEditPosition)}
            />
        </div>
        <div>
            <Label htmlFor="phone">Số điện thoại (*)</Label>
            <Input
                id="phone"
                type="tel"
                name="phone"
                placeholder="Số điện thoại"
                value={formState.phone || ''}
                onChange={(e) => handleInputChange(e, formSetter)}
                required
                className="bg-card"
                // Everyone can edit their phone, or admin can edit anyone's phone
            />
        </div>
         <div>
            <Label htmlFor="email">Email (*)</Label>
            <Input
                id="email"
                type="email"
                name="email"
                placeholder="Email"
                value={formState.email || ''}
                onChange={(e) => handleInputChange(e, formSetter)}
                required={isAdmin || !isEditMode} // Required for admin adding or if it's a new employee
                className="bg-card"
                disabled={!isEditMode ? false : (isOwnRecord && !isAdmin ? true : !canEditEmail)}
            />
        </div>
        <DialogFooter className="sm:justify-end gap-2">
            {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="h-10">Hủy</Button>}
            <Button type="submit" className="bg-green-500 text-white hover:bg-green-600 h-10">
                {isEditMode ? 'Lưu thay đổi' : 'Thêm nhân viên'}
            </Button>
        </DialogFooter>
    </form>
   );
  };


  return (
    <>
      <Card>
        <CardHeader className="p-4">
          <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">Danh sách nhân viên</CardTitle>
              {isAdmin && (
                <Button 
                  onClick={() => { setIsAddingEmployee(!isAddingEmployee); if (isEditingEmployee) setIsEditingEmployee(false); setNewEmployeeData(initialAddFormState); }} 
                  variant="default" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> {isAddingEmployee ? 'Hủy thêm mới' : 'Thêm nhân viên'}
                </Button>
              )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isAddingEmployee && isAdmin && renderEmployeeForm(newEmployeeData, setNewEmployeeData, handleAdd, false, () => setIsAddingEmployee(false))}
          
          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>{formatPhoneNumber(emp.phone)}</TableCell>
                    <TableCell>{emp.email || 'N/A'}</TableCell>
                    <TableCell className="text-center space-x-2">
                        { (isAdmin || emp.userId === currentUser?.uid) && ( 
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditDialog(emp)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                        { isAdmin && (
                            <Button 
                                variant="destructive" 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={() => openDeleteConfirmDialog(emp)}
                                // Admin cannot delete their own "Chủ cửa hàng" record
                                disabled={emp.email === 'nthe1008@gmail.com' && emp.position === 'Chủ cửa hàng'} 
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && !isAddingEmployee && !isEditingEmployee && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Chưa có nhân viên nào.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isEditingEmployee && employeeToEdit && (
        <Dialog open={isEditingEmployee} onOpenChange={(open) => { if (!open) { setIsEditingEmployee(false); setEmployeeToEdit(null); }}}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa thông tin nhân viên</DialogTitle>
              <DialogDescription>
                Chỉnh sửa thông tin cho {employeeToEdit.name}.
                {(employeeToEdit.userId === currentUser?.uid && !isAdmin) && " Bạn chỉ có thể sửa số điện thoại."}
                {(employeeToEdit.email === 'nthe1008@gmail.com' && isAdmin) && " Email và Chức vụ của Chủ cửa hàng không thể thay đổi."}
              </DialogDescription>
            </DialogHeader>
            {renderEmployeeForm(editedEmployeeData, setEditedEmployeeData, handleUpdate, true, () => { setIsEditingEmployee(false); setEmployeeToEdit(null); })}
          </DialogContent>
        </Dialog>
      )}

      {employeeToDelete && (
        <AlertDialog open={isConfirmingDeleteEmployee} onOpenChange={setIsConfirmingDeleteEmployee}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa nhân viên?</AlertDialogTitle>
                <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa nhân viên "{employeeToDelete.name}" không? Hành động này không thể hoàn tác.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setIsConfirmingDeleteEmployee(false); setEmployeeToDelete(null); }}>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

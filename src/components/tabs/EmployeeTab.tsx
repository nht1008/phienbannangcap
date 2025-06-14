
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


interface EmployeeTabProps {
  employees: Employee[];
  currentUser: User | null;
  onAddEmployee: (newEmployeeData: Omit<Employee, 'id' | 'userId'>) => Promise<void>;
  onUpdateEmployee: (employeeId: string, updatedEmployeeData: Omit<Employee, 'id' | 'userId'>) => Promise<void>;
  onDeleteEmployee: (employeeId: string) => Promise<void>;
}

const initialFormState: Omit<Employee, 'id' | 'userId'> = { name: '', position: '', phone: '', email: '' };


export function EmployeeTab({ employees, currentUser, onAddEmployee, onUpdateEmployee, onDeleteEmployee }: EmployeeTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id' | 'userId'>>(initialFormState);

  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [editedEmployeeData, setEditedEmployeeData] = useState<Omit<Employee, 'id' | 'userId'>>(initialFormState);

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
      setEditedEmployeeData(initialFormState);
    }
  }, [employeeToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, formSetter: React.Dispatch<React.SetStateAction<Omit<Employee, 'id' | 'userId'>>>) => {
    const { name, value } = e.target;
    formSetter(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.position || !newEmployee.phone || !newEmployee.email) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin nhân viên (bao gồm email).", variant: "destructive" });
      return;
    }
    if (employees.some(emp => emp.phone === newEmployee.phone)) {
        toast({ title: "Lỗi", description: "Số điện thoại đã tồn tại cho nhân viên khác.", variant: "destructive"});
        return;
    }
    if (newEmployee.email && employees.some(emp => emp.email === newEmployee.email)) {
        toast({ title: "Lỗi", description: "Email đã tồn tại cho nhân viên khác.", variant: "destructive"});
        return;
    }
    await onAddEmployee(newEmployee);
    setNewEmployee(initialFormState);
    setIsAdding(false);
  };

  const openEditDialog = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setIsEditingEmployee(true);
    setIsAdding(false); 
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeToEdit || !editedEmployeeData.name || !editedEmployeeData.position || !editedEmployeeData.phone ) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin nhân viên (Tên, Chức vụ, SĐT).", variant: "destructive" });
      return;
    }
     // Email validation for admin editing other employees
    if (isAdmin && employeeToEdit.email !== currentUser?.email && !editedEmployeeData.email) {
      toast({ title: "Lỗi", description: "Email không được để trống khi Admin sửa thông tin nhân viên khác.", variant: "destructive" });
      return;
    }

    if (employees.some(emp => emp.id !== employeeToEdit.id && emp.phone === editedEmployeeData.phone)) {
        toast({ title: "Lỗi", description: "Số điện thoại đã tồn tại cho nhân viên khác.", variant: "destructive"});
        return;
    }
    // Check for email uniqueness only if admin is editing an employee (not themselves) and email has changed
    if (isAdmin && editedEmployeeData.email && employeeToEdit.email !== editedEmployeeData.email && employees.some(emp => emp.id !== employeeToEdit.id && emp.email === editedEmployeeData.email)) {
        toast({ title: "Lỗi", description: "Email đã tồn tại cho nhân viên khác.", variant: "destructive"});
        return;
    }
    
    // If Admin is editing their own record, ensure email isn't changed through this form
    let finalEditedData = { ...editedEmployeeData };
    if (isAdmin && employeeToEdit.email === currentUser?.email) {
        finalEditedData.email = currentUser.email; // Keep admin's own email fixed
    }


    await onUpdateEmployee(employeeToEdit.id, finalEditedData);
    setIsEditingEmployee(false);
    setEmployeeToEdit(null);
  };

  const openDeleteConfirmDialog = (employee: Employee) => {
    // Admin cannot delete their own primary record
    if (isAdmin && employee.email === 'nthe1008@gmail.com' && employee.userId === currentUser?.uid) {
        toast({ title: "Không thể xóa", description: "Không thể xóa tài khoản Chủ cửa hàng của chính bạn.", variant: "destructive" });
        return;
    }
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
    formState: Omit<Employee, 'id' | 'userId'>,
    formSetter: React.Dispatch<React.SetStateAction<Omit<Employee, 'id' | 'userId'>>>,
    handleSubmit: (e: React.FormEvent) => Promise<void>,
    isEditMode: boolean,
    onCancel?: () => void
  ) => {
    // Determine if the form is for the admin editing their own "Chủ cửa hàng" record
    const isEditingOwnAdminRecord = isEditMode && employeeToEdit?.email === currentUser?.email && employeeToEdit?.position === 'Chủ cửa hàng';
    // Determine if the form is for a regular user editing their own record
    const isEditingOwnRegularRecord = isEditMode && employeeToEdit?.userId === currentUser?.uid && !isAdmin;


    return (
     <form onSubmit={handleSubmit} className="mb-6 p-4 bg-muted/50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <Input
            type="text"
            name="name"
            placeholder="Tên nhân viên (*)"
            value={formState.name}
            onChange={(e) => handleInputChange(e, formSetter)}
            required
            className="bg-card"
            disabled={isEditingOwnAdminRecord || isEditingOwnRegularRecord} // Name is from Auth for self
        />
        <Input
            type="text"
            name="position"
            placeholder="Chức vụ (*)"
            value={formState.position}
            onChange={(e) => handleInputChange(e, formSetter)}
            required
            className="bg-card"
            disabled={isEditingOwnAdminRecord || isEditingOwnRegularRecord} // Position fixed for self
        />
        <Input
            type="tel"
            name="phone"
            placeholder="Số điện thoại (*)"
            value={formState.phone}
            onChange={(e) => handleInputChange(e, formSetter)}
            required
            className="bg-card"
            // Phone is editable
        />
        <Input
            type="email"
            name="email"
            placeholder="Email (*)"
            value={formState.email || ''}
            onChange={(e) => handleInputChange(e, formSetter)}
            className="bg-card"
            disabled={isEditingOwnAdminRecord || isEditingOwnRegularRecord} // Email is from Auth for self
            required={!isEditMode && isAdmin} // Email required for admin adding new employee
        />
        <div className="md:col-span-2 flex justify-end gap-2">
            {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="h-10">Hủy</Button>}
            <Button type="submit" className="bg-green-500 text-white hover:bg-green-600 h-10 flex-grow">
                {isEditMode ? 'Lưu thay đổi' : 'Lưu nhân viên'}
            </Button>
        </div>
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
                    onClick={() => { setIsAdding(!isAdding); if (isEditingEmployee) setIsEditingEmployee(false); setNewEmployee(initialFormState); }} 
                    variant="default" 
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> {isAdding ? 'Hủy thêm' : 'Thêm nhân viên'}
                </Button>
              )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isAdding && isAdmin && renderEmployeeForm(newEmployee, setNewEmployee, handleAdd, false, () => setIsAdding(false))}
          
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
                        { (isAdmin || emp.userId === currentUser?.uid) && ( // Edit is available if admin OR if it's user's own record
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditDialog(emp)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                        { isAdmin && emp.userId === currentUser?.uid && emp.email === 'nthe1008@gmail.com' && ( // Admin's own record delete button (disabled)
                            <Button variant="destructive" size="icon" className="h-8 w-8" disabled>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        { isAdmin && emp.userId === currentUser?.uid && emp.email !== 'nthe1008@gmail.com' && ( // Admin can delete other employees they manage
                             <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => openDeleteConfirmDialog(emp)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && !isAdding && !isEditingEmployee && (
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
                {(employeeToEdit.userId === currentUser?.uid && (employeeToEdit.position === 'Chủ cửa hàng' || !isAdmin)) && " Tên, email và chức vụ của bạn được quản lý qua hệ thống."}
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


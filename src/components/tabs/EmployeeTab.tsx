
"use client";

import React, { useState, useEffect } from 'react';
import type { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from '@/lib/utils';


interface EmployeeTabProps {
  employees: Employee[];
  onAddEmployee: (newEmployeeData: Omit<Employee, 'id' | 'userId'>) => Promise<void>;
  onUpdateEmployee: (employeeId: string, updatedEmployeeData: Omit<Employee, 'id' | 'userId'>) => Promise<void>;
  onDeleteEmployee: (employeeId: string) => Promise<void>;
}

// Form state does not include userId as it's handled by the parent
const initialFormState: Omit<Employee, 'id' | 'userId'> = { name: '', position: '', phone: '' };


export function EmployeeTab({ employees, onAddEmployee, onUpdateEmployee, onDeleteEmployee }: EmployeeTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id' | 'userId'>>(initialFormState);

  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [editedEmployeeData, setEditedEmployeeData] = useState<Omit<Employee, 'id' | 'userId'>>(initialFormState);

  const [isConfirmingDeleteEmployee, setIsConfirmingDeleteEmployee] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (employeeToEdit) {
      setEditedEmployeeData({
        name: employeeToEdit.name,
        position: employeeToEdit.position,
        phone: employeeToEdit.phone,
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
    if (!newEmployee.name || !newEmployee.position || !newEmployee.phone) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin nhân viên.", variant: "destructive" });
      return;
    }
    if (employees.some(emp => emp.phone === newEmployee.phone)) {
        toast({ title: "Lỗi", description: "Số điện thoại đã tồn tại cho nhân viên khác.", variant: "destructive"});
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
    if (!employeeToEdit || !editedEmployeeData.name || !editedEmployeeData.position || !editedEmployeeData.phone) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin nhân viên.", variant: "destructive" });
      return;
    }
    if (employees.some(emp => emp.id !== employeeToEdit.id && emp.phone === editedEmployeeData.phone)) {
        toast({ title: "Lỗi", description: "Số điện thoại đã tồn tại cho nhân viên khác.", variant: "destructive"});
        return;
    }
    await onUpdateEmployee(employeeToEdit.id, editedEmployeeData);
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
    formState: Omit<Employee, 'id' | 'userId'>,
    formSetter: React.Dispatch<React.SetStateAction<Omit<Employee, 'id' | 'userId'>>>,
    handleSubmit: (e: React.FormEvent) => Promise<void>,
    isEditMode: boolean,
    onCancel?: () => void
  ) => (
     <form onSubmit={handleSubmit} className="mb-6 p-4 bg-muted/50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <Input 
            type="text" 
            name="name" 
            placeholder="Tên nhân viên (*)" 
            value={formState.name} 
            onChange={(e) => handleInputChange(e, formSetter)} 
            required 
            className="md:col-span-1 bg-card" 
        />
        <Input 
            type="text" 
            name="position" 
            placeholder="Chức vụ (*)" 
            value={formState.position} 
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
        <div className="md:col-span-1 flex justify-end gap-2">
            {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="h-10">Hủy</Button>}
            <Button type="submit" className="bg-green-500 text-white hover:bg-green-600 h-10 flex-grow">
                {isEditMode ? 'Lưu thay đổi' : 'Lưu'}
            </Button>
        </div>
    </form>
  );


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">Danh sách nhân viên</CardTitle>
              <Button 
                onClick={() => { setIsAdding(!isAdding); if (isEditingEmployee) setIsEditingEmployee(false); setNewEmployee(initialFormState); }} 
                variant="default" 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                  <PlusCircle className="mr-2 h-4 w-4" /> {isAdding ? 'Hủy thêm mới' : 'Thêm nhân viên'}
              </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isAdding && renderEmployeeForm(newEmployee, setNewEmployee, handleAdd, false, () => setIsAdding(false))}
          
          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>{formatPhoneNumber(emp.phone)}</TableCell>
                    <TableCell className="text-center space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditDialog(emp)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => openDeleteConfirmDialog(emp)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && !isAdding && !isEditingEmployee && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">Chưa có nhân viên nào.</TableCell></TableRow>
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
              <DialogDescription>Cập nhật thông tin cho {employeeToEdit.name}.</DialogDescription>
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


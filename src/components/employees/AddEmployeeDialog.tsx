
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { EmployeePosition } from '@/types';

interface AddEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: {
    name: string;
    email: string;
    password: string;
    position: EmployeePosition;
    phone?: string;
    zaloName?: string;
  }) => Promise<void>;
}

export function AddEmployeeDialog({
  isOpen,
  onClose,
  onSubmit,
}: AddEmployeeDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState<EmployeePosition>('Nhân viên');
  const [phone, setPhone] = useState('');
  const [zaloName, setZaloName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPosition('Nhân viên');
    setPhone('');
    setZaloName('');
    setIsLoading(false);
  };

  const handleDialogClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !name.trim()) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng điền đầy đủ Tên, Email và Mật khẩu.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Mật khẩu yếu", description: "Mật khẩu phải có ít nhất 6 ký tự.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    await onSubmit({
      email: email.trim(),
      password,
      name: name.trim(),
      position,
      phone: phone.trim() || undefined,
      zaloName: zaloName.trim() || undefined,
    });
    // We don't reset the form here because the parent component will close the dialog on success, which triggers resetForm.
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Thêm nhân viên mới</DialogTitle>
          <DialogDescription>
            Tạo tài khoản đăng nhập cho nhân viên mới. Họ sẽ có thể đăng nhập ngay lập tức.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="add-name">Tên nhân viên (*)</Label>
            <Input id="add-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="add-email">Email (*)</Label>
            <Input id="add-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
           <div className="space-y-1">
            <Label htmlFor="add-password">Mật khẩu (*)</Label>
            <Input id="add-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Ít nhất 6 ký tự" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="add-position">Chức vụ (*)</Label>
            <Select value={position} onValueChange={(value: EmployeePosition) => setPosition(value)}>
                <SelectTrigger id="add-position">
                    <SelectValue placeholder="Chọn chức vụ" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Nhân viên">Nhân viên</SelectItem>
                    <SelectItem value="Quản lý">Quản lý</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="add-phone">Số điện thoại</Label>
            <Input id="add-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
           <div className="space-y-1">
            <Label htmlFor="add-zaloName">Tên Zalo</Label>
            <Input id="add-zaloName" value={zaloName} onChange={(e) => setZaloName(e.target.value)} />
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isLoading}>Hủy</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? <><LoadingSpinner className="mr-2" />Đang tạo...</> : 'Tạo nhân viên'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

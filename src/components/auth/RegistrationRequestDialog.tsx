
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Re-added
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import type { UserAccessRequest } from '@/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

type RequestedRole = UserAccessRequest['requestedRole']; // Re-added

interface RegistrationRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRegistration: (details: Omit<UserAccessRequest, 'id' | 'status' | 'requestDate' | 'reviewedBy' | 'reviewDate' | 'rejectionReason'> & { password: string }) => Promise<boolean>;
}

export function RegistrationRequestDialog({
  isOpen,
  onClose,
  onSubmitRegistration,
}: RegistrationRequestDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [zaloName, setZaloName] = useState('');
  const [address, setAddress] = useState('');
  const [requestedRole, setRequestedRole] = useState<RequestedRole>('employee'); // Default to employee
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
    setZaloName('');
    setAddress('');
    setRequestedRole('employee'); // Reset role
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim() || !phone.trim() || !zaloName.trim() || !requestedRole) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng điền đầy đủ các trường bắt buộc (*), bao gồm cả vai trò.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Lỗi mật khẩu", description: "Mật khẩu và xác nhận mật khẩu không khớp.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Lỗi mật khẩu", description: "Mật khẩu phải có ít nhất 6 ký tự.", variant: "destructive" });
      return;
    }
    if (requestedRole === 'customer' && !address.trim()) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập địa chỉ cho khách hàng.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const success = await onSubmitRegistration({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      zaloName: zaloName.trim(),
      requestedRole, // Pass the selected role
    });
    setIsLoading(false);
    if (success) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Đăng ký tài khoản</DialogTitle>
          <DialogDescription>
            Vui lòng điền thông tin bên dưới để tạo tài khoản và gửi yêu cầu truy cập.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-1">
            <Label htmlFor="reg-fullName">Họ và tên (*)</Label>
            <Input id="reg-fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="text-base" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reg-email">Email (*)</Label>
            <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="text-base" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="reg-password">Mật khẩu (*)</Label>
              <Input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="text-base" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reg-confirmPassword">Xác nhận mật khẩu (*)</Label>
              <Input id="reg-confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="text-base" />
            </div>
          </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="reg-phone">Số điện thoại (*)</Label>
              <Input id="reg-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="text-base" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reg-zaloName">Tên Zalo (*)</Label>
              <Input id="reg-zaloName" value={zaloName} onChange={(e) => setZaloName(e.target.value)} required className="text-base" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="reg-address">Địa chỉ {requestedRole === 'customer' ? '(*)' : '(Tùy chọn cho nhân viên)'}</Label>
            <Textarea id="reg-address" value={address} onChange={(e) => setAddress(e.target.value)} required={requestedRole === 'customer'} className="text-base min-h-[70px]" />
          </div>
          
          <div className="mt-4 pt-3 border-t border-border">
            <Label className="mb-3 block text-lg font-semibold text-primary">Đăng ký với vai trò? (*)</Label>
            <RadioGroup 
              value={requestedRole} 
              onValueChange={(value: string) => setRequestedRole(value as RequestedRole)} 
              className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 p-3 bg-primary/5 rounded-md"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="role-customer-reg" />
                <Label htmlFor="role-customer-reg" className="font-normal text-base">Khách hàng</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employee" id="role-employee-reg" />
                <Label htmlFor="role-employee-reg" className="font-normal text-base">Nhân viên</Label>
              </div>
            </RadioGroup>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }} disabled={isLoading}>Hủy</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? <><LoadingSpinner className="mr-2" />Đang xử lý...</> : 'Đăng ký và Gửi yêu cầu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

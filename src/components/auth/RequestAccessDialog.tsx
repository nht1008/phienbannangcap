
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

type RequestedRole = UserAccessRequest['requestedRole'];

interface RequestAccessDialogProps {
  currentUserName: string | null;
  currentUserEmail: string | null;
  onSubmitRequest: (details: {
    name: string;
    email: string;
    phone: string;
    address: string;
    requestedRole: RequestedRole;
  }) => Promise<void>;
  existingRequestStatus?: UserAccessRequest['status'] | null;
  rejectionReason?: string | null;
}

export function RequestAccessDialog({
  currentUserName,
  currentUserEmail,
  onSubmitRequest,
  existingRequestStatus,
  rejectionReason,
}: RequestAccessDialogProps) {
  const [requestedRole, setRequestedRole] = useState<RequestedRole>('employee');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserName || !currentUserEmail) {
      toast({
        title: "Lỗi người dùng",
        description: "Không thể xác định thông tin người dùng hiện tại.",
        variant: "destructive",
      });
      return;
    }
    if (!phone.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập số điện thoại.",
        variant: "destructive",
      });
      return;
    }
     if (!address.trim() && requestedRole === 'customer') {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập địa chỉ cho khách hàng.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSubmitRequest({
        name: currentUserName,
        email: currentUserEmail,
        phone: phone.trim(),
        address: address.trim(),
        requestedRole,
      });
      // Success toast should be handled by the parent component after status update
    } catch (error) {
      toast({
        title: "Lỗi gửi yêu cầu",
        description: "Đã có lỗi xảy ra. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (existingRequestStatus === 'pending') {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Yêu cầu đang chờ duyệt</DialogTitle>
            <DialogDescription>
              Yêu cầu truy cập của bạn đã được gửi và đang chờ quản trị viên phê duyệt. Vui lòng thử lại sau.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (existingRequestStatus === 'approved') {
     // This case should ideally be handled by parent component by not showing the dialog
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Yêu cầu đã được duyệt</DialogTitle>
            <DialogDescription>
              Yêu cầu của bạn đã được phê duyệt. Ứng dụng sẽ sớm được tải.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }


  return (
    <Dialog open={true} onOpenChange={() => { /* Prevent closing */ }}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Hoàn tất thông tin truy cập</DialogTitle>
          <DialogDescription asChild>
            <div>
              Chào {currentUserName || 'bạn'}, vui lòng chọn vai trò và cung cấp một số thông tin để gửi yêu cầu truy cập.
              {existingRequestStatus === 'rejected' && (
                  <div className="mt-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                      Yêu cầu trước đó của bạn đã bị từ chối.
                      {rejectionReason && ` Lý do: ${rejectionReason}.`}
                      Vui lòng xem lại thông tin và gửi lại yêu cầu nếu cần.
                  </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label className="mb-2 block">Bạn muốn đăng ký với vai trò?</Label>
            <RadioGroup
              value={requestedRole}
              onValueChange={(value: string) => setRequestedRole(value as RequestedRole)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employee" id="role-employee" />
                <Label htmlFor="role-employee">Nhân viên</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="role-customer" />
                <Label htmlFor="role-customer">Khách hàng</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại (*)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Nhập số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ {requestedRole === 'customer' ? '(*)' : '(Tùy chọn cho nhân viên)'}</Label>
            <Textarea
              id="address"
              placeholder="Nhập địa chỉ"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required={requestedRole === 'customer'}
              className="text-base min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

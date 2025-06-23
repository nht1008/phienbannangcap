
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
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

type RequestedRole = UserAccessRequest['requestedRole'];

interface RequestAccessDialogProps {
  currentUserName: string | null;
  currentUserEmail: string | null;
  onSubmitRequest: (details: {
    fullName: string; // Changed from name to fullName
    email: string;
    phone: string;
    address: string;
    zaloName: string; // Added Zalo Name
    requestedRole: RequestedRole;
    zaloName?: string;
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
<<<<<<< HEAD
  const [zaloName, setZaloName] = useState(''); // Added Zalo Name state
=======
  const [zaloName, setZaloName] = useState('');
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740
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
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập số điện thoại.", variant: "destructive" });
      return;
    }
<<<<<<< HEAD
    if (!zaloName.trim()) { // Added Zalo Name validation
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập Tên Zalo.",
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
=======
    if (!address.trim() && requestedRole === 'customer') {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập địa chỉ cho khách hàng.", variant: "destructive" });
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740
      return;
    }
     if (!zaloName.trim() && requestedRole === 'customer') {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên Zalo cho khách hàng.", variant: "destructive"});
      return;
    }


    setIsLoading(true);
    try {
      await onSubmitRequest({
        fullName: currentUserName, // Use fullName
        email: currentUserEmail,
        phone: phone.trim(),
        address: address.trim(),
<<<<<<< HEAD
        zaloName: zaloName.trim(), // Pass Zalo Name
=======
        zaloName: zaloName.trim(),
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740
        requestedRole,
      });
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
          
          <div className="space-y-2"> {/* Added Zalo Name field */}
            <Label htmlFor="zaloName">Tên Zalo (*)</Label>
            <Input
              id="zaloName"
              type="text"
              placeholder="Nhập tên Zalo của bạn"
              value={zaloName}
              onChange={(e) => setZaloName(e.target.value)}
              required
              className="text-base"
            />
          </div>

           <div className="space-y-2">
            <Label htmlFor="zaloName">Tên Zalo {requestedRole === 'customer' ? '(*)' : '(Tùy chọn cho nhân viên)'}</Label>
            <Input
              id="zaloName"
              type="text"
              placeholder="Nhập tên Zalo"
              value={zaloName}
              onChange={(e) => setZaloName(e.target.value)}
              required={requestedRole === 'customer'}
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
<<<<<<< HEAD
              {isLoading ? <><LoadingSpinner className="mr-2" />Đang gửi...</> : 'Gửi yêu cầu'}
=======
              {isLoading ? (
                <>
                  <LoadingSpinner size={20} className="mr-2 text-primary-foreground" />
                  Đang gửi...
                </>
              ) : 'Gửi yêu cầu'}
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

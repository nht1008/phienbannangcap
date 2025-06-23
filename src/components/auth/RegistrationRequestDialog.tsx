"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { UserAccessRequest } from '@/types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Briefcase, Users } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [requestedRole, setRequestedRole] = useState<'employee' | 'customer'>('customer');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsDialogOpen, setIsTermsDialogOpen] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
    setZaloName('');
    setAddress('');
    setIsLoading(false);
    setRequestedRole('customer');
    setAgreedToTerms(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim() || !phone.trim() || !zaloName.trim() || (requestedRole === 'customer' && !address.trim())) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng điền đầy đủ các trường bắt buộc (*).", variant: "destructive" });
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
    if (!agreedToTerms) {
      toast({ title: "Điều khoản dịch vụ", description: "Bạn phải đồng ý với các điều khoản và điều kiện.", variant: "destructive" });
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
      requestedRole,
    });
    setIsLoading(false);
    if (success) {
      resetForm();
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm(); onClose(); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Đăng ký tài khoản</DialogTitle>
            <DialogDescription>
              Vui lòng điền thông tin bên dưới để tạo tài khoản. Yêu cầu của bạn sẽ được gửi đến quản trị viên để xét duyệt.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
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
              <Label htmlFor="reg-address">Địa chỉ {requestedRole === 'customer' ? '(*)' : ''}</Label>
              <Textarea id="reg-address" value={address} onChange={(e) => setAddress(e.target.value)} className="text-base min-h-[70px]" required={requestedRole === 'customer'}/>
            </div>
            
            <div className="space-y-2 rounded-lg border border-primary/50 bg-primary/5 p-4">
              <Label className="text-base font-semibold text-primary">Đăng ký với vai trò (*)</Label>
              <RadioGroup
                value={requestedRole}
                onValueChange={(value) => setRequestedRole(value as 'employee' | 'customer')}
                className="grid grid-cols-2 gap-4 pt-2"
              >
                <Label
                  htmlFor="role-customer"
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 p-4 transition-all hover:bg-accent hover:text-accent-foreground",
                    requestedRole === 'customer' ? "border-primary bg-primary/10 shadow-md" : "border-muted"
                  )}
                >
                  <RadioGroupItem value="customer" id="role-customer" className="sr-only" />
                  <Users className="mb-3 h-8 w-8 text-primary" />
                  <span className="font-semibold">Khách hàng</span>
                </Label>
                <Label
                  htmlFor="role-employee"
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 p-4 transition-all hover:bg-accent hover:text-accent-foreground",
                    requestedRole === 'employee' ? "border-primary bg-primary/10 shadow-md" : "border-muted"
                  )}
                >
                  <RadioGroupItem value="employee" id="role-employee" className="sr-only" />
                  <Briefcase className="mb-3 h-8 w-8 text-primary" />
                  <span className="font-semibold">Nhân viên</span>
                </Label>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Tôi đồng ý với các{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsTermsDialogOpen(true);
                  }}
                  className="underline text-primary hover:text-primary/80"
                >
                  điều khoản và điều kiện
                </button>
                .
              </label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }} disabled={isLoading}>Hủy</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading || !agreedToTerms}>
                {isLoading ? <><LoadingSpinner className="mr-2" />Đang xử lý...</> : 'Đăng ký và Gửi yêu cầu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTermsDialogOpen} onOpenChange={setIsTermsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Điều khoản và Điều kiện</DialogTitle>
            <DialogDescription>
              Vui lòng đọc kỹ các điều khoản dịch vụ trước khi đăng ký.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] my-4 p-4 border rounded-md">
            <div className="space-y-4 text-sm text-foreground">
              <h4 className="font-bold">1. Chấp nhận Điều khoản</h4>
              <p>Bằng cách truy cập hoặc sử dụng Dịch vụ, bạn đồng ý bị ràng buộc bởi các Điều khoản này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản thì bạn không được phép truy cập Dịch vụ.</p>

              <h4 className="font-bold">2. Tài khoản</h4>
              <p>Khi bạn tạo một tài khoản với chúng tôi, bạn phải cung cấp cho chúng tôi thông tin chính xác, đầy đủ và hiện tại tại mọi thời điểm. Việc không làm như vậy cấu thành một hành vi vi phạm các Điều khoản, có thể dẫn đến việc chấm dứt ngay lập tức tài khoản của bạn trên Dịch vụ của chúng tôi.</p>
              <p>Bạn chịu trách nhiệm bảo vệ mật khẩu mà bạn sử dụng để truy cập Dịch vụ và cho bất kỳ hoạt động hoặc hành động nào dưới mật khẩu của bạn, cho dù mật khẩu của bạn là với Dịch vụ của chúng tôi hay dịch vụ của bên thứ ba.</p>

              <h4 className="font-bold">3. Quyền sở hữu trí tuệ</h4>
              <p>Dịch vụ và nội dung gốc, các tính năng và chức năng của nó là và sẽ vẫn là tài sản độc quyền của Công ty và các nhà cấp phép của nó. Dịch vụ được bảo vệ bởi bản quyền, nhãn hiệu và các luật khác của cả Việt Nam và các quốc gia nước ngoài.</p>

              <h4 className="font-bold">4. Chấm dứt</h4>
              <p>Chúng tôi có thể chấm dứt hoặc đình chỉ quyền truy cập vào Dịch vụ của chúng tôi ngay lập tức, mà không cần thông báo trước hoặc chịu trách nhiệm pháp lý, vì bất kỳ lý do gì, bao gồm nhưng không giới hạn nếu bạn vi phạm các Điều khoản.</p>
              <p>Tất cả các điều khoản của Điều khoản mà theo bản chất của chúng sẽ tồn tại sau khi chấm dứt sẽ vẫn tồn tại sau khi chấm dứt, bao gồm, nhưng không giới hạn, các điều khoản về quyền sở hữu, tuyên bố từ chối bảo hành, bồi thường và giới hạn trách nhiệm pháp lý.</p>

              <h4 className="font-bold">5. Thay đổi</h4>
              <p>Chúng tôi có quyền, theo quyết định riêng của mình, sửa đổi hoặc thay thế các Điều khoản này vào bất kỳ lúc nào. Nếu một bản sửa đổi là quan trọng, chúng tôi sẽ cố gắng cung cấp thông báo ít nhất 30 ngày trước khi bất kỳ điều khoản mới nào có hiệu lực. Điều gì cấu thành một thay đổi quan trọng sẽ được xác định theo quyết định riêng của chúng tôi.</p>

              <h4 className="font-bold">6. Liên hệ với chúng tôi</h4>
              <p>Nếu bạn có bất kỳ câu hỏi nào về các Điều khoản này, vui lòng liên hệ với chúng tôi.</p>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setIsTermsDialogOpen(false)} className="bg-primary text-primary-foreground">Đã hiểu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

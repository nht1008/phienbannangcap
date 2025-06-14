
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { ShopInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';

export type OverallFontSize = 'sm' | 'md' | 'lg';
export type NumericDisplaySize = 'text-xl' | 'text-2xl' | 'text-3xl' | 'text-4xl';

const defaultShopInfo: ShopInfo = {
  name: '',
  address: '',
  phone: '',
  logoUrl: '',
  bankAccountName: '',
  bankAccountNumber: '',
  bankName: '',
};

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  overallFontSize: OverallFontSize;
  onOverallFontSizeChange: (size: OverallFontSize) => void;
  numericDisplaySize: NumericDisplaySize;
  onNumericDisplaySizeChange: (size: NumericDisplaySize) => void;
  shopInfo: ShopInfo | null;
  onSaveShopInfo: (newInfo: ShopInfo) => Promise<void>;
  isAdmin: boolean;
  isLoadingShopInfo: boolean;
}

export function SettingsDialog({
  isOpen,
  onClose,
  overallFontSize,
  onOverallFontSizeChange,
  numericDisplaySize,
  onNumericDisplaySizeChange,
  shopInfo,
  onSaveShopInfo,
  isAdmin,
  isLoadingShopInfo
}: SettingsDialogProps) {
  const [currentOverallSize, setCurrentOverallSize] = useState<OverallFontSize>(overallFontSize);
  const [currentNumericSize, setCurrentNumericSize] = useState<NumericDisplaySize>(numericDisplaySize);
  const [editableShopInfo, setEditableShopInfo] = useState<ShopInfo>(shopInfo || defaultShopInfo);
  const [isSavingShopInfo, setIsSavingShopInfo] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentOverallSize(overallFontSize);
  }, [overallFontSize]);

  useEffect(() => {
    setCurrentNumericSize(numericDisplaySize);
  }, [numericDisplaySize]);
  
  useEffect(() => {
    setEditableShopInfo(shopInfo || defaultShopInfo);
  }, [shopInfo]);


  const handleApplySettings = () => {
    onOverallFontSizeChange(currentOverallSize);
    onNumericDisplaySizeChange(currentNumericSize);
    toast({ title: "Cài đặt hiển thị đã được áp dụng.", variant: "default" });
    // onClose(); // Optionally close dialog on apply
  };

  const handleShopInfoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableShopInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveShopInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({ title: "Lỗi", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive" });
      return;
    }
    setIsSavingShopInfo(true);
    try {
      await onSaveShopInfo(editableShopInfo);
      // Success toast is handled by page.tsx after successful save
    } catch (error) {
      // Error toast is handled by page.tsx
    } finally {
      setIsSavingShopInfo(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Cài đặt hiển thị & Thông tin</DialogTitle>
          <DialogDescription>
            Tùy chỉnh giao diện và cập nhật thông tin cửa hàng (nếu bạn là Quản trị viên).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Font Size Settings */}
          <section>
            <h3 className="text-lg font-semibold mb-2 text-primary">Kích thước hiển thị</h3>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Cỡ chữ chung:</Label>
                <RadioGroup value={currentOverallSize} onValueChange={(value) => setCurrentOverallSize(value as OverallFontSize)} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sm" id="fs-sm" />
                    <Label htmlFor="fs-sm">Nhỏ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="md" id="fs-md" />
                    <Label htmlFor="fs-md">Vừa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lg" id="fs-lg" />
                    <Label htmlFor="fs-lg">Lớn</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="mb-2 block">Cỡ chữ số (cho các mục tổng tiền):</Label>
                 <RadioGroup value={currentNumericSize} onValueChange={(value) => setCurrentNumericSize(value as NumericDisplaySize)} className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text-xl" id="ns-xl" />
                    <Label htmlFor="ns-xl">Nhỏ (XL)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text-2xl" id="ns-2xl" />
                    <Label htmlFor="ns-2xl">Vừa (2XL)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text-3xl" id="ns-3xl" />
                    <Label htmlFor="ns-3xl">Lớn (3XL)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text-4xl" id="ns-4xl" />
                    <Label htmlFor="ns-4xl">Rất Lớn (4XL)</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button onClick={handleApplySettings} className="w-full sm:w-auto">Áp dụng cài đặt hiển thị</Button>
            </div>
          </section>

          {isAdmin && (
            <>
              <Separator />
              <section>
                <h3 className="text-lg font-semibold mb-3 text-primary">Thông tin cửa hàng (Quản trị viên)</h3>
                {isLoadingShopInfo ? (
                  <p>Đang tải thông tin cửa hàng...</p>
                ) : (
                <form onSubmit={handleSaveShopInfoSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shopName">Tên cửa hàng</Label>
                      <Input id="shopName" name="name" value={editableShopInfo.name} onChange={handleShopInfoInputChange} placeholder="VD: Cửa Hàng Hoa Tươi ABC" />
                    </div>
                    <div>
                      <Label htmlFor="shopPhone">Số điện thoại cửa hàng</Label>
                      <Input id="shopPhone" name="phone" value={editableShopInfo.phone} onChange={handleShopInfoInputChange} placeholder="VD: 0123 456 789" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="shopAddress">Địa chỉ cửa hàng</Label>
                    <Input id="shopAddress" name="address" value={editableShopInfo.address} onChange={handleShopInfoInputChange} placeholder="VD: 123 Đường Hoa, Phường X, Quận Y, TP. Z" />
                  </div>
                  <div>
                    <Label htmlFor="shopLogoUrl">URL Logo (nếu có)</Label>
                    <Input id="shopLogoUrl" name="logoUrl" value={editableShopInfo.logoUrl} onChange={handleShopInfoInputChange} placeholder="VD: https://example.com/logo.png" />
                  </div>
                  <Separator className="my-3"/>
                   <h4 className="text-md font-medium text-primary/90">Thông tin chuyển khoản</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="bankAccountName">Tên chủ tài khoản</Label>
                        <Input id="bankAccountName" name="bankAccountName" value={editableShopInfo.bankAccountName} onChange={handleShopInfoInputChange} placeholder="VD: NGUYEN VAN A" />
                    </div>
                    <div>
                        <Label htmlFor="bankAccountNumber">Số tài khoản</Label>
                        <Input id="bankAccountNumber" name="bankAccountNumber" value={editableShopInfo.bankAccountNumber} onChange={handleShopInfoInputChange} placeholder="VD: 0123456789" />
                    </div>
                    </div>
                    <div>
                        <Label htmlFor="bankName">Tên ngân hàng</Label>
                        <Input id="bankName" name="bankName" value={editableShopInfo.bankName} onChange={handleShopInfoInputChange} placeholder="VD: Vietcombank - CN ABC" />
                    </div>

                  <Button type="submit" className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white" disabled={isSavingShopInfo}>
                    {isSavingShopInfo ? 'Đang lưu...' : 'Lưu thông tin cửa hàng'}
                  </Button>
                </form>
                )}
              </section>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

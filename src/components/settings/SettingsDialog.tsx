
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
import { UploadCloud } from 'lucide-react';

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
  hasAdminOrManagerRights: boolean; // Changed from isAdmin
  isLoadingShopInfo: boolean;
}

const MAX_LOGO_SIZE_MB = 2;
const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;

export function SettingsDialog({
  isOpen,
  onClose,
  overallFontSize,
  onOverallFontSizeChange,
  numericDisplaySize,
  onNumericDisplaySizeChange,
  shopInfo,
  onSaveShopInfo,
  hasAdminOrManagerRights, // Changed from isAdmin
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
  };

  const handleShopInfoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableShopInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_LOGO_SIZE_BYTES) {
        toast({
          title: "Lỗi tải ảnh",
          description: `Kích thước file không được vượt quá ${MAX_LOGO_SIZE_MB}MB.`,
          variant: "destructive",
        });
        e.target.value = ""; // Clear the input
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditableShopInfo(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.onerror = () => {
        toast({
          title: "Lỗi đọc file",
          description: "Không thể đọc file ảnh đã chọn.",
          variant: "destructive",
        });
      }
      reader.readAsDataURL(file);
    } else {
      // If no file is selected (e.g., user cancels dialog), reset to default or previous if any
       setEditableShopInfo(prev => ({ ...prev, logoUrl: shopInfo?.logoUrl || defaultShopInfo.logoUrl }));
    }
  };

  const handleSaveShopInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAdminOrManagerRights) { // Changed from isAdmin
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
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl">Cài đặt hiển thị & Thông tin</DialogTitle>
          <DialogDescription>
            Tùy chỉnh giao diện và cập nhật thông tin cửa hàng (nếu bạn là Quản trị viên hoặc Quản lý).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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

          {hasAdminOrManagerRights && ( // Changed from isAdmin
            <>
              <Separator />
              <section>
                <h3 className="text-lg font-semibold mb-3 text-primary">Thông tin cửa hàng (Quản trị viên/Quản lý)</h3>
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
                    <Label htmlFor="shopLogoFile" className="mb-1 block">Logo cửa hàng (Tối đa ${MAX_LOGO_SIZE_MB}MB)</Label>
                    <div className="flex items-center gap-4">
                        <Input 
                            id="shopLogoFile" 
                            name="logoUrl" 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoFileChange}
                            className="bg-card flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {editableShopInfo.logoUrl ? (
                            <Image
                                src={editableShopInfo.logoUrl}
                                alt="Xem trước logo"
                                width={60}
                                height={60}
                                className="rounded-md object-contain border aspect-square bg-muted/50"
                                data-ai-hint="shop logo"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none'; // Hide broken image
                                }}
                            />
                        ) : (
                             <div className="w-[60px] h-[60px] flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
                                <UploadCloud className="h-6 w-6" />
                            </div>
                        )}
                    </div>
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

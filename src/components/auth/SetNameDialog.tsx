
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
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface SetNameDialogProps {
  onNameSet: (name: string) => Promise<void>;
}

export function SetNameDialog({ onNameSet }: SetNameDialogProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Tên không hợp lệ",
        description: "Vui lòng nhập tên hiển thị của bạn.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await onNameSet(name.trim());
      // Toast for success will be handled in page.tsx after successful update
    } catch (error) {
      toast({
        title: "Lỗi cập nhật tên",
        description: "Đã có lỗi xảy ra khi lưu tên của bạn. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => { /* Prevent closing via overlay click or Esc */ }}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()} // Prevent closing by clicking outside
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Chào mừng bạn!</DialogTitle>
          <DialogDescription>
            Vui lòng nhập tên hiển thị của bạn để tiếp tục sử dụng ứng dụng.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Tên hiển thị</Label>
            <Input
              id="displayName"
              placeholder="Nhập tên của bạn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="text-base"
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <>
                  <LoadingSpinner size={20} className="mr-2 text-primary-foreground" />
                  Đang lưu...
                </>
              ) : 'Lưu và tiếp tục'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

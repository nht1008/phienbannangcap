"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface NotificationDialogProps {
  message: string | null;
  type?: "success" | "error";
  onClose: () => void;
}

export function NotificationDialog({ message, type = "error", onClose }: NotificationDialogProps) {
  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <AlertDialog open={!!message} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className={cn(
        "border-t-4",
        isSuccess ? "border-green-500" : "border-red-500"
      )}>
        <AlertDialogHeader>
          <AlertDialogTitle className={isSuccess ? "text-green-600" : "text-red-600"}>
            {isSuccess ? "Thành công!" : "Thông báo"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-lg text-foreground">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={onClose}
            className={cn(
              "w-full",
              isSuccess ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
            )}
          >
            Đã hiểu
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

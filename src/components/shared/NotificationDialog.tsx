
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
        isSuccess ? "border-[hsl(var(--success))]" : "border-destructive"
      )}>
        <AlertDialogHeader>
          <AlertDialogTitle className={isSuccess ? "text-[hsl(var(--success))]" : "text-destructive"}>
            {isSuccess ? "Thành công!" : "Cảnh Báo"}
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
              isSuccess ? "bg-success text-success-foreground hover:bg-success/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            Đã hiểu
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}



"use client";

<<<<<<< HEAD
import React, { useState } from 'react';
import type { Order, OrderStatus, User } from '@/types';
import type { ActivityDateTimeFilter } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, Eye, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minuteOptionsStart = ['00', '15', '30', '45'];
const minuteOptionsEnd = ['00', '15', '30', '45', '59'];
const employeeOrderStatusOptions: OrderStatus[] = ['Chờ xác nhận', 'Hoàn thành', 'Đã hủy'];
=======
import React, { useState, useMemo } from 'react';
import type { Order, OrderItem, OrderStatus, PaymentStatus } from '@/types';
import { ALL_ORDER_STATUSES } from '@/types';
import type { User } from 'firebase/auth';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Eye, PackageCheck, ReceiptText, Edit3, Ban, X } from 'lucide-react';
import { formatPhoneNumber, cn, normalizeStringForSearch } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740

interface OrdersTabProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, employeeId: string, employeeName: string) => Promise<void>;
<<<<<<< HEAD
  filter: ActivityDateTimeFilter;
  onFilterChange: (newFilter: ActivityDateTimeFilter) => void;
  currentUser: User | null;
  isCurrentUserCustomer: boolean;
}

export function OrdersTab({ orders, onUpdateStatus, filter: filterProp, onFilterChange, currentUser, isCurrentUserCustomer }: OrdersTabProps) {
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  
  const handleSetTodayFilter = () => {
    const today = new Date();
    onFilterChange({
      startDate: startOfDay(today),
      endDate: endOfDay(today),
      startHour: '00',
      startMinute: '00',
      endHour: '23',
      endMinute: '59',
    });
  };
  
  const handleSetAllTimeFilter = () => {
    onFilterChange({
      startDate: null,
      endDate: null,
      startHour: '00',
      startMinute: '00',
      endHour: '23',
      endMinute: '59',
    });
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    if (!currentUser) return;
    const updaterName = currentUser.displayName || (isCurrentUserCustomer ? "Khách hàng" : "Không rõ");
    onUpdateStatus(orderId, newStatus, currentUser.uid, updaterName);
  };

  const getStatusColorClass = (status: OrderStatus) => {
    switch (status) {
      case 'Hoàn thành': return 'bg-green-500 text-white';
      case 'Đã hủy': return 'bg-red-500 text-white';
      case 'Yêu cầu hủy': return 'bg-orange-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
=======
  currentUser: User | null;
  hasFullAccessRights: boolean;
}

const getStatusBadgeVariant = (status: OrderStatus | PaymentStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Chờ xác nhận':
    case 'Yêu cầu hủy':
      return 'default'; // Primary color (Rose)
    case 'Đã xác nhận':
    case 'Đang chuẩn bị hàng':
      return 'secondary'; // Accent color (Lavender)
    case 'Đang giao hàng':
    case 'Đã giao hàng':
      return 'default'; // Primary color slightly darker shade maybe
    case 'Hoàn thành':
    case 'Đã thanh toán':
      return 'default'; // Success-like, perhaps a custom green or bright primary
    case 'Đã hủy':
      return 'destructive'; // Destructive color (Red)
    case 'Chưa thanh toán':
        return 'destructive';
    case 'Đã thanh toán một phần':
        return 'outline'; // Neutral / warning
    default:
      return 'outline';
  }
};

const getStatusColorClass = (status: OrderStatus | PaymentStatus): string => {
    switch (status) {
        case 'Chờ xác nhận': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500';
        case 'Đã xác nhận': return 'bg-blue-500/20 text-blue-700 border-blue-500';
        case 'Đang chuẩn bị hàng': return 'bg-indigo-500/20 text-indigo-700 border-indigo-500';
        case 'Đang giao hàng': return 'bg-purple-500/20 text-purple-700 border-purple-500';
        case 'Đã giao hàng': return 'bg-teal-500/20 text-teal-700 border-teal-500';
        case 'Hoàn thành': return 'bg-green-500/20 text-green-700 border-green-500';
        case 'Đã hủy': return 'bg-red-500/20 text-red-700 border-red-500';
        case 'Yêu cầu hủy': return 'bg-orange-500/20 text-orange-700 border-orange-500';
        case 'Chưa thanh toán': return 'bg-red-500/20 text-red-700 border-red-500';
        case 'Đã thanh toán': return 'bg-green-500/20 text-green-700 border-green-500';
        case 'Đã thanh toán một phần': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500';
        case 'Đã hoàn tiền': return 'bg-gray-500/20 text-gray-700 border-gray-500';
        default: return 'bg-gray-300/20 text-gray-600 border-gray-400';
    }
};


export function OrdersTab({ orders, onUpdateStatus, currentUser, hasFullAccessRights }: OrdersTabProps) {
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const { toast } = useToast();

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!currentUser) {
      toast({ title: "Lỗi", description: "Vui lòng đăng nhập để thực hiện thao tác này.", variant: "destructive" });
      return;
    }
    if (!hasFullAccessRights && !(newStatus === 'Yêu cầu hủy' || newStatus === 'Chờ xác nhận')) {
        toast({ title: "Không có quyền", description: "Bạn không có quyền thay đổi trạng thái này.", variant: "destructive"});
        return;
    }
    await onUpdateStatus(orderId, newStatus, currentUser.uid, currentUser.displayName || currentUser.email || "Không rõ");
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740
  };


  return (
    <>
<<<<<<< HEAD
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Danh sách Đơn hàng</CardTitle>
          <CardDescription>
            {isCurrentUserCustomer ? 'Xem lại lịch sử và trạng thái các đơn hàng của bạn.' : 'Quản lý và cập nhật trạng thái các đơn hàng của khách.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-lg">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-2 items-end">
                  <div className="space-y-1">
                  <Label htmlFor="order-startDate">Từ ngày</Label>
                  <Popover>
                      <PopoverTrigger asChild>
                      <Button
                          id="order-startDate"
                          variant={"outline"}
                          className={cn(
                          "w-full justify-start text-left font-normal bg-card h-9",
                          !filterProp.startDate && "text-muted-foreground"
                          )}
                      >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filterProp.startDate ? format(filterProp.startDate, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày bắt đầu</span>}
                      </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                      <Calendar
                          mode="single"
                          selected={filterProp.startDate ?? undefined}
                          onSelect={(date) => onFilterChange({ ...filterProp, startDate: date ? startOfDay(date) : null })}
                          disabled={(date) => filterProp.endDate ? date > filterProp.endDate : false}
                          initialFocus
                          locale={vi}
                      />
                      </PopoverContent>
                  </Popover>
                  </div>
                  <div className="space-y-1">
                  <Label htmlFor="order-startHour">Giờ bắt đầu</Label>
                  <Select value={filterProp.startHour} onValueChange={(value) => onFilterChange({...filterProp, startHour: value})}>
                      <SelectTrigger id="order-startHour" className="bg-card h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>{hourOptions.map(hour => <SelectItem key={`start-hr-${hour}`} value={hour}>{hour}</SelectItem>)}</SelectContent>
                  </Select>
                  </div>
                  <div className="space-y-1">
                  <Label htmlFor="order-startMinute">Phút bắt đầu</Label>
                  <Select value={filterProp.startMinute} onValueChange={(value) => onFilterChange({...filterProp, startMinute: value})}>
                      <SelectTrigger id="order-startMinute" className="bg-card h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>{minuteOptionsStart.map(min => <SelectItem key={`start-min-${min}`} value={min}>{min}</SelectItem>)}</SelectContent>
                  </Select>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-2 items-end">
                  <div className="space-y-1">
                  <Label htmlFor="order-endDate">Đến ngày</Label>
                  <Popover>
                      <PopoverTrigger asChild>
                      <Button
                          id="order-endDate"
                          variant={"outline"}
                          className={cn(
                          "w-full justify-start text-left font-normal bg-card h-9",
                          !filterProp.endDate && "text-muted-foreground"
                          )}
                      >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filterProp.endDate ? format(filterProp.endDate, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày kết thúc</span>}
                      </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                      <Calendar
                          mode="single"
                          selected={filterProp.endDate ?? undefined}
                          onSelect={(date) => onFilterChange({ ...filterProp, endDate: date ? endOfDay(date) : null })}
                          disabled={(date) => filterProp.startDate ? date < filterProp.startDate : false}
                          initialFocus
                          locale={vi}
                      />
                      </PopoverContent>
                  </Popover>
                  </div>
                  <div className="space-y-1">
                  <Label htmlFor="order-endHour">Giờ kết thúc</Label>
                  <Select value={filterProp.endHour} onValueChange={(value) => onFilterChange({...filterProp, endHour: value})}>
                      <SelectTrigger id="order-endHour" className="bg-card h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>{hourOptions.map(hour => <SelectItem key={`end-hr-${hour}`} value={hour}>{hour}</SelectItem>)}</SelectContent>
                  </Select>
                  </div>
                  <div className="space-y-1">
                  <Label htmlFor="order-endMinute">Phút kết thúc</Label>
                  <Select value={filterProp.endMinute} onValueChange={(value) => onFilterChange({...filterProp, endMinute: value})}>
                      <SelectTrigger id="order-endMinute" className="bg-card h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>{minuteOptionsEnd.map(min => <SelectItem key={`end-min-${min}`} value={min}>{min}</SelectItem>)}</SelectContent>
                  </Select>
                  </div>
              </div>
               <div className="flex gap-2 mt-2 flex-wrap">
                   <Button onClick={handleSetTodayFilter} variant="outline" className="h-9">Hôm nay</Button>
                   <Button onClick={handleSetAllTimeFilter} variant="secondary" className="h-9">Xem tất cả</Button>
              </div>
          </div>

          <div className="flex-grow overflow-hidden">
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Không có đơn hàng nào phù hợp với bộ lọc.</p>
            ) : (
              <ScrollArea className="h-full no-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã ĐH</TableHead>
                      {!isCurrentUserCustomer && <TableHead>Tên khách hàng</TableHead>}
                      <TableHead>Ngày đặt</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-center">Hành động</TableHead>
                      <TableHead className="text-center">Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium text-xs">{order.orderNumber || order.id.slice(-6)}</TableCell>
                        {!isCurrentUserCustomer && <TableCell>{order.customerName}</TableCell>}
                        <TableCell>{new Date(order.orderDate).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell className="text-right">{order.totalAmount.toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell>
                           <span className={cn("px-2 py-1 text-xs font-semibold rounded-full", getStatusColorClass(order.orderStatus))}>
                             {order.orderStatus}
                           </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {isCurrentUserCustomer ? (
                             (() => {
                                if (order.orderStatus === 'Chờ xác nhận') {
                                  return (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-7 text-xs"
                                      onClick={() => handleStatusChange(order.id, 'Yêu cầu hủy')}
                                    >
                                      Yêu cầu hủy
                                    </Button>
                                  );
                                }
                                
                                if (order.orderStatus === 'Yêu cầu hủy') {
                                  return (
                                     <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => handleStatusChange(order.id, 'Chờ xác nhận')}
                                    >
                                        Hủy yêu cầu hủy
                                    </Button>
                                  );
                                }

                                return <span className="text-xs text-muted-foreground">-</span>;
                              })()
                          ) : (
                            <Select
                              value={order.orderStatus}
                              onValueChange={(newStatus: OrderStatus) => handleStatusChange(order.id, newStatus)}
                            >
                              <SelectTrigger className={cn("h-8 text-xs w-[130px] mx-auto")}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {employeeOrderStatusOptions.map(status => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrderDetails(order)}>
                            <Eye className="h-4 w-4 text-primary" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>
      
      {selectedOrderDetails && (
        <Dialog open={!!selectedOrderDetails} onOpenChange={(open) => !open && setSelectedOrderDetails(null)}>
          <DialogContent className="sm:max-w-5xl">
            <TooltipProvider delayDuration={100}>
              <DialogHeader>
                <DialogTitle>Chi tiết Đơn hàng #{selectedOrderDetails.orderNumber}</DialogTitle>
                <DialogDescription asChild>
                  <div className="text-sm space-y-1">
                    <p><strong>Khách hàng:</strong> {selectedOrderDetails.customerName}</p>
                    <p><strong>SĐT:</strong> {selectedOrderDetails.customerPhone}</p>
                    <p><strong>Địa chỉ:</strong> {selectedOrderDetails.customerAddress}</p>
                    <p><strong>Ngày đặt:</strong> {new Date(selectedOrderDetails.orderDate).toLocaleString('vi-VN')}</p>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <Separator className="my-4" />
              <ScrollArea className="max-h-60 no-scrollbar">
                <h4 className="font-semibold mb-2 text-foreground">Sản phẩm trong đơn hàng:</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Màu</TableHead>
                      <TableHead>Chất lượng</TableHead>
                      <TableHead>Kích thước</TableHead>
                      <TableHead className="text-right">SL</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                      <TableHead className="text-center">Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrderDetails.items.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Image
                              src={item.image || `https://placehold.co/40x40.png`}
                              alt={item.name}
                              width={40}
                              height={40}
                              className="rounded-md object-cover aspect-square"
                              data-ai-hint={`${item.name.split(' ')[0]} flower`}
                          />
                          {item.name}
                        </TableCell>
                        <TableCell className="text-xs">{item.color}</TableCell>
                        <TableCell className="text-xs">{item.quality || 'N/A'}</TableCell>
                        <TableCell className="text-xs">{item.size}</TableCell>
                        <TableCell className="text-right">{item.quantityInCart}</TableCell>
                        <TableCell className="text-right">{item.price.toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {(item.price * item.quantityInCart).toLocaleString('vi-VN')} VNĐ
                        </TableCell>
                        <TableCell className="text-center">
                          {item.notes ? (
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 relative cursor-default">
                                      <MessageSquare className="h-4 w-4 text-primary" />
                                      <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-destructive ring-1 ring-background" />
                                  </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                  <p className="max-w-xs">{item.notes}</p>
                                  </TooltipContent>
                              </Tooltip>
                          ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-lg text-foreground">
                <span>Tổng thanh toán:</span>
                <span>{selectedOrderDetails.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <DialogFooter className="mt-4">
                <Button onClick={() => setSelectedOrderDetails(null)} variant="outline" className="w-full">Đóng</Button>
              </DialogFooter>
            </TooltipProvider>
=======
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Quản lý Đơn hàng ({orders.length})</CardTitle>
          <CardDescription>Xem và quản lý các đơn hàng từ khách hàng.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">Chưa có đơn hàng nào.</p>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-18rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">STT</TableHead>
                    <TableHead>ID ĐH</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Ngày đặt</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Trạng thái ĐH</TableHead>
                    <TableHead>Trạng thái TT</TableHead>
                    <TableHead className="text-center">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, index) => (
                    <TableRow key={order.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{order.id.substring(0, 6)}...</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {order.finalAmount.toLocaleString('vi-VN')} VNĐ
                      </TableCell>
                      <TableCell>
                        {hasFullAccessRights ? (
                            <Select
                                value={order.status}
                                onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                            >
                            <SelectTrigger className={cn("h-8 text-xs w-auto min-w-[140px] border-0 shadow-none focus:ring-0", getStatusColorClass(order.status))}>
                                <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                {ALL_ORDER_STATUSES.map(statusVal => (
                                <SelectItem key={statusVal} value={statusVal} className="text-xs">
                                    {statusVal}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        ) : (
                             <Badge variant={getStatusBadgeVariant(order.status)} className={cn("text-xs", getStatusColorClass(order.status))}>
                                {order.status}
                            </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.paymentStatus)} className={cn("text-xs", getStatusColorClass(order.paymentStatus))}>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary/80"
                          onClick={() => setSelectedOrderDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {selectedOrderDetails && (
        <Dialog open={!!selectedOrderDetails} onOpenChange={() => setSelectedOrderDetails(null)}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <ReceiptText className="mr-2 h-6 w-6 text-primary" />
                Chi tiết Đơn hàng #{selectedOrderDetails.id.substring(0, 6)}...
              </DialogTitle>
              <DialogDescription>
                Ngày đặt: {new Date(selectedOrderDetails.orderDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-3" />
            <ScrollArea className="max-h-[65vh] pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Thông tin Khách hàng</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <p><strong>Tên:</strong> {selectedOrderDetails.customerName}</p>
                            <p><strong>SĐT:</strong> {formatPhoneNumber(selectedOrderDetails.customerPhone) || 'N/A'}</p>
                            <p><strong>Địa chỉ GH:</strong> {selectedOrderDetails.shippingAddress || selectedOrderDetails.customerAddress || 'N/A'}</p>
                             {selectedOrderDetails.notes && <p><strong>Ghi chú KH:</strong> {selectedOrderDetails.notes}</p>}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Thông tin Thanh toán & Vận chuyển</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <p><strong>PT Thanh toán:</strong> {selectedOrderDetails.paymentMethod || 'N/A'}</p>
                            <p>
                                <strong>Trạng thái TT:</strong>&nbsp;
                                <Badge variant={getStatusBadgeVariant(selectedOrderDetails.paymentStatus)} className={cn("text-xs", getStatusColorClass(selectedOrderDetails.paymentStatus))}>
                                    {selectedOrderDetails.paymentStatus}
                                </Badge>
                            </p>
                            <p><strong>Phí vận chuyển:</strong> {selectedOrderDetails.shippingFee.toLocaleString('vi-VN')} VNĐ</p>
                            <p><strong>Mã giảm giá:</strong> {selectedOrderDetails.discountCode || 'Không có'}</p>
                            <p><strong>Tiền giảm giá:</strong> {selectedOrderDetails.discountAmount.toLocaleString('vi-VN')} VNĐ</p>
                        </CardContent>
                    </Card>
                </div>
                
                <h4 className="font-semibold mb-2 text-foreground">Danh sách sản phẩm</h4>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-12">Ảnh</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-right">SL</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {selectedOrderDetails.items.map((item, idx) => (
                    <TableRow key={`${item.productId}-${idx}`}>
                        <TableCell>
                        <Image
                            src={item.image || `https://placehold.co/40x40.png`}
                            alt={item.productName}
                            width={40}
                            height={40}
                            className="rounded-md object-cover aspect-square"
                            data-ai-hint={`${item.productName.split(' ')[0]} flower`}
                             onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40.png'; }}
                        />
                        </TableCell>
                        <TableCell>
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                                {item.color}, {item.quality || 'N/A'}, {item.size}, {item.unit}
                            </p>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.priceAtOrder.toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell className="text-right font-semibold">{(item.priceAtOrder * item.quantity).toLocaleString('vi-VN')} VNĐ</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                </Table>
                <Separator className="my-4" />
                 <div className="space-y-1 text-sm text-right pr-2">
                    <p><strong>Tổng tiền hàng:</strong> {selectedOrderDetails.orderTotal.toLocaleString('vi-VN')} VNĐ</p>
                    <p><strong>Phí vận chuyển:</strong> + {selectedOrderDetails.shippingFee.toLocaleString('vi-VN')} VNĐ</p>
                    {selectedOrderDetails.discountAmount > 0 && (
                      <p className="text-destructive"><strong>Giảm giá:</strong> - {selectedOrderDetails.discountAmount.toLocaleString('vi-VN')} VNĐ</p>
                    )}
                    <p className="text-lg font-bold text-primary"><strong>Tổng cộng:</strong> {selectedOrderDetails.finalAmount.toLocaleString('vi-VN')} VNĐ</p>
                </div>
                {selectedOrderDetails.history && selectedOrderDetails.history.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <h4 className="font-semibold mb-2 text-foreground">Lịch sử trạng thái đơn hàng</h4>
                     <div className="space-y-2 text-xs">
                        {selectedOrderDetails.history.slice().reverse().map((entry, idx) => (
                            <div key={idx} className="p-2 bg-muted/50 rounded-md">
                                <p>
                                    Trạng thái: <span className={cn("font-medium", getStatusColorClass(entry.status).split(' ')[1])}>{entry.status}</span>
                                </p>
                                <p>Thời gian: {new Date(entry.changedAt).toLocaleString('vi-VN')}</p>
                                {entry.changedByEmployeeName && <p>Bởi: {entry.changedByEmployeeName}</p>}
                                {entry.reason && <p>Lý do: {entry.reason}</p>}
                            </div>
                        ))}
                    </div>
                  </>
                )}


            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setSelectedOrderDetails(null)}>
                Đóng
              </Button>
            </DialogFooter>
>>>>>>> f497b674c67425e219da5b3ccf493b1db10fa740
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

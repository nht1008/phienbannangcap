
"use client";

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
import { Calendar as CalendarIcon, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minuteOptionsStart = ['00', '15', '30', '45'];
const minuteOptionsEnd = ['00', '15', '30', '45', '59'];
const employeeOrderStatusOptions: OrderStatus[] = ['Chờ xác nhận', 'Hoàn thành', 'Đã hủy'];

interface OrdersTabProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, employeeId: string, employeeName: string) => Promise<void>;
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
  };


  return (
    <>
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
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã ĐH</TableHead>
                      {!isCurrentUserCustomer && <TableHead>Tên khách hàng</TableHead>}
                      <TableHead>Ngày đặt</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>TT Thanh toán</TableHead>
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
                          {isCurrentUserCustomer ? (
                             (() => {
                                const canCancel = order.orderStatus === 'Chờ xác nhận';
                                const isCancellationRequested = order.orderStatus === 'Yêu cầu hủy';

                                if (isCancellationRequested) {
                                  return (
                                    <span className={cn("px-2 py-1 text-xs font-semibold rounded-full", getStatusColorClass(order.orderStatus))}>
                                      Đã yêu cầu hủy
                                    </span>
                                  );
                                }
                                
                                if (canCancel) {
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

                                return (
                                  <span className={cn("px-2 py-1 text-xs font-semibold rounded-full", getStatusColorClass(order.orderStatus))}>
                                    {order.orderStatus}
                                  </span>
                                );
                              })()
                          ) : (
                            <Select
                              value={order.orderStatus}
                              onValueChange={(newStatus: OrderStatus) => handleStatusChange(order.id, newStatus)}
                            >
                              <SelectTrigger className={cn("h-8 text-xs", getStatusColorClass(order.orderStatus))}>
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
                         <TableCell>
                            <span className={cn("px-2 py-1 text-xs font-semibold rounded-full", order.paymentStatus === 'Đã thanh toán' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800')}>
                               {order.paymentStatus}
                            </span>
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
          <DialogContent className="sm:max-w-4xl">
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
            <ScrollArea className="max-h-60">
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold">Ghi chú cho từng sản phẩm:</h4>
                {selectedOrderDetails.items.filter(item => item.notes).length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {selectedOrderDetails.items.filter(item => item.notes).map((item, index) => (
                      <li key={`note-${item.id}-${index}`}>
                        <strong>{item.name} ({item.color}, {item.size}):</strong> {item.notes}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Không có ghi chú nào cho các sản phẩm trong đơn hàng này.</p>
                )}
              </div>
            </ScrollArea>
            <Separator className="my-4" />
            <div className="flex justify-between font-bold text-lg text-foreground">
              <span>Tổng thanh toán:</span>
              <span>{selectedOrderDetails.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <DialogFooter className="mt-4">
              <Button onClick={() => setSelectedOrderDetails(null)} variant="outline" className="w-full">Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

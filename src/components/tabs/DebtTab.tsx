"use client";

import React, { useMemo } from 'react';
import type { Debt } from '@/types';
import type { ActivityDateTimeFilter } from '@/app/page'; // Updated import
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';

const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minuteOptionsStart = ['00', '15', '30', '45'];
const minuteOptionsEnd = ['00', '15', '30', '45', '59'];

interface DebtTabProps {
  debts: Debt[];
  onUpdateDebtStatus: (
    debtId: string, 
    newStatus: 'Chưa thanh toán' | 'Đã thanh toán',
    employeeId: string,
    employeeName: string,
    isUndoOperation?: boolean 
  ) => Promise<void>;
  filter: ActivityDateTimeFilter; // Updated type
  onFilterChange: (newFilter: ActivityDateTimeFilter) => void; // Updated type
  currentUser: User | null;
}

export function DebtTab({ debts, onUpdateDebtStatus, filter: filterProp, onFilterChange, currentUser }: DebtTabProps) {

  const toggleStatus = (debtId: string, currentStatus: 'Chưa thanh toán' | 'Đã thanh toán') => {
    if (!currentUser) {
      alert("Không thể cập nhật: Người dùng chưa đăng nhập.");
      return;
    }
    const newStatus = currentStatus === 'Đã thanh toán' ? 'Chưa thanh toán' : 'Đã thanh toán';
    const isUndo = newStatus === 'Chưa thanh toán';
    
    onUpdateDebtStatus(
      debtId, 
      newStatus, 
      currentUser.uid, 
      currentUser.displayName || currentUser.email || "Không rõ",
      isUndo
    );
  };

  const totalUnpaid = useMemo(() =>
    debts.reduce((sum, d) => sum + d.amount, 0), 
    [debts]
  );

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


  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-4xl font-bold">Quản lý công nợ</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
         <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-2 items-end">
                <div className="space-y-1">
                <Label htmlFor="debt-startDate">Từ ngày</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="debt-startDate"
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
                <Label htmlFor="debt-startHour">Giờ bắt đầu</Label>
                <Select value={filterProp.startHour} onValueChange={(value) => onFilterChange({...filterProp, startHour: value})}>
                    <SelectTrigger id="debt-startHour" className="bg-card h-9"><SelectValue/></SelectTrigger>
                    <SelectContent>{hourOptions.map(hour => <SelectItem key={`start-hr-${hour}`} value={hour}>{hour}</SelectItem>)}</SelectContent>
                </Select>
                </div>
                <div className="space-y-1">
                <Label htmlFor="debt-startMinute">Phút bắt đầu</Label>
                <Select value={filterProp.startMinute} onValueChange={(value) => onFilterChange({...filterProp, startMinute: value})}>
                    <SelectTrigger id="debt-startMinute" className="bg-card h-9"><SelectValue/></SelectTrigger>
                    <SelectContent>{minuteOptionsStart.map(min => <SelectItem key={`start-min-${min}`} value={min}>{min}</SelectItem>)}</SelectContent>
                </Select>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-2 items-end">
                <div className="space-y-1">
                <Label htmlFor="debt-endDate">Đến ngày</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="debt-endDate"
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
                <Label htmlFor="debt-endHour">Giờ kết thúc</Label>
                <Select value={filterProp.endHour} onValueChange={(value) => onFilterChange({...filterProp, endHour: value})}>
                    <SelectTrigger id="debt-endHour" className="bg-card h-9"><SelectValue/></SelectTrigger>
                    <SelectContent>{hourOptions.map(hour => <SelectItem key={`end-hr-${hour}`} value={hour}>{hour}</SelectItem>)}</SelectContent>
                </Select>
                </div>
                <div className="space-y-1">
                <Label htmlFor="debt-endMinute">Phút kết thúc</Label>
                <Select value={filterProp.endMinute} onValueChange={(value) => onFilterChange({...filterProp, endMinute: value})}>
                    <SelectTrigger id="debt-endMinute" className="bg-card h-9"><SelectValue/></SelectTrigger>
                    <SelectContent>{minuteOptionsEnd.map(min => <SelectItem key={`end-min-${min}`} value={min}>{min}</SelectItem>)}</SelectContent>
                </Select>
                </div>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
                 <Button onClick={handleSetTodayFilter} variant="outline" className="h-9">Hôm nay</Button>
                 <Button onClick={handleSetAllTimeFilter} variant="secondary" className="h-9">Xem tất cả</Button>
            </div>
        </div>

        <div className="mb-6 p-4 bg-destructive/10 border-l-4 border-destructive rounded-md text-[hsl(var(--destructive))]">
          <p className="font-bold">Tổng công nợ chưa thanh toán (theo bộ lọc): {totalUnpaid.toLocaleString('vi-VN')} VNĐ</p>
        </div>
        <div className="flex-grow overflow-hidden">
          {debts.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">Không có công nợ nào phù hợp với bộ lọc.</p>
          ) : (
          <ScrollArea className="h-full"> 
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">STT</TableHead>
                  <TableHead>Nhà cung cấp/Khách hàng</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Giờ</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead className="text-center">Chức năng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((debt, index) => {
                  const debtDate = new Date(debt.date);
                  return (
                    <TableRow key={debt.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{debt.supplier || 'N/A'}</TableCell>
                      <TableCell>{debtDate.toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>{debtDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</TableCell>
                      <TableCell>{debt.amount.toLocaleString('vi-VN')} VNĐ</TableCell>
                      <TableCell className="text-center">
                        <Button
                          onClick={() => toggleStatus(debt.id, debt.status)}
                          variant={'ghost'}
                          size="sm"
                          className={cn(
                            'px-3 py-1 rounded-full text-xs h-auto',
                            debt.status === 'Chưa thanh toán'
                              ? 'bg-success text-success-foreground hover:bg-success/90'
                              : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                          )}
                        >
                          {debt.status === 'Chưa thanh toán' ? 'Thu nợ' : 'Hủy thanh toán'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


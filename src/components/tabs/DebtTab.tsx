
"use client";

import React, { useMemo } from 'react';
import type { Debt } from '@/types';
import type { DateFilter } from '@/app/page';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';

interface DebtTabProps {
  debts: Debt[];
  onUpdateDebtStatus: (
    debtId: string, 
    newStatus: 'Chưa thanh toán' | 'Đã thanh toán',
    employeeId: string,
    employeeName: string
  ) => Promise<void>;
  filter: DateFilter;
  onFilterChange: (newFilter: DateFilter) => void;
  availableYears: string[];
  currentUser: User | null;
}

export function DebtTab({ debts, onUpdateDebtStatus, filter: filterProp, onFilterChange, availableYears, currentUser }: DebtTabProps) {
  const { day: currentDay, month: currentMonth, year: currentYear } = filterProp;

  const toggleStatus = (debtId: string, currentStatus: 'Chưa thanh toán' | 'Đã thanh toán') => {
    if (!currentUser) {
      alert("Không thể cập nhật: Người dùng chưa đăng nhập.");
      return;
    }
    const newStatus = currentStatus === 'Đã thanh toán' ? 'Chưa thanh toán' : 'Đã thanh toán';
    onUpdateDebtStatus(
      debtId, 
      newStatus, 
      currentUser.uid, 
      currentUser.displayName || currentUser.email || "Không rõ"
    );
  };

  const totalUnpaid = useMemo(() =>
    debts.reduce((sum, d) => sum + d.amount, 0), 
    [debts]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-4xl font-bold">Quản lý công nợ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6 p-4 bg-muted/30 rounded-lg items-end">
          <div>
            <Label htmlFor="debt-filter-day" className="text-sm">Ngày</Label>
            <Select
              value={currentDay}
              onValueChange={(value) => onFilterChange({ day: value, month: currentMonth, year: currentYear })}
            >
              <SelectTrigger id="debt-filter-day" className="w-full sm:w-28 bg-card h-9">
                <SelectValue placeholder="Ngày" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Array.from({ length: 31 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="debt-filter-month" className="text-sm">Tháng</Label>
            <Select
              value={currentMonth}
              onValueChange={(value) => onFilterChange({ day: currentDay, month: value, year: currentYear })}
            >
              <SelectTrigger id="debt-filter-month" className="w-full sm:w-32 bg-card h-9">
                <SelectValue placeholder="Tháng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    Tháng {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="debt-filter-year" className="text-sm">Năm</Label>
            <Select
              value={currentYear}
              onValueChange={(value) => onFilterChange({ day: currentDay, month: currentMonth, year: value })}
            >
              <SelectTrigger id="debt-filter-year" className="w-full sm:w-32 bg-card h-9">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              const now = new Date();
              onFilterChange({
                day: now.getDate().toString(),
                month: (now.getMonth() + 1).toString(),
                year: now.getFullYear().toString(),
              });
            }}
            variant="outline"
            className="h-9"
          >
            Hôm nay
          </Button>
          <Button
            onClick={() => onFilterChange({ day: 'all', month: 'all', year: 'all' })}
            variant="outline"
            className="h-9"
          >
            Xóa bộ lọc
          </Button>
        </div>

        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-md text-red-800">
          <p className="font-bold">Tổng công nợ chưa thanh toán (theo bộ lọc): {totalUnpaid.toLocaleString('vi-VN')} VNĐ</p>
        </div>
        {debts.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Không có công nợ nào phù hợp với bộ lọc.</p>
        ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhà cung cấp/Khách hàng</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người tạo</TableHead>
                <TableHead>Người cập nhật cuối</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map(debt => (
                <TableRow key={debt.id}>
                  <TableCell>{debt.supplier || 'N/A'}</TableCell>
                  <TableCell>{new Date(debt.date).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell>{debt.amount.toLocaleString('vi-VN')} VNĐ</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => toggleStatus(debt.id, debt.status)}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "px-3 py-1 rounded-full text-xs h-auto",
                        debt.status === 'Đã thanh toán'
                          ? 'bg-green-200 text-green-800 border-green-400 hover:bg-green-300'
                          : 'bg-red-200 text-red-800 border-red-400 hover:bg-red-300'
                      )}
                    >
                      {debt.status}
                    </Button>
                  </TableCell>
                  <TableCell>{debt.createdEmployeeName || 'Không rõ'}</TableCell>
                  <TableCell>{debt.lastUpdatedEmployeeName || 'Chưa có'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
      </CardContent>
    </Card>
  );
}


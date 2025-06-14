"use client";

import React, { useMemo } from 'react';
import type { Debt } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DebtTabProps {
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
}

export function DebtTab({ debts, setDebts }: DebtTabProps) {
  const toggleStatus = (debtId: number) => {
    setDebts(debts.map(debt =>
      debt.id === debtId ? { ...debt, status: debt.status === 'Đã thanh toán' ? 'Chưa thanh toán' : 'Đã thanh toán' } : debt
    ));
  };

  const totalUnpaid = useMemo(() =>
    debts.filter(d => d.status === 'Chưa thanh toán').reduce((sum, d) => sum + d.amount, 0),
    [debts]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý công nợ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-md text-red-800">
          <p className="font-bold">Tổng công nợ chưa thanh toán: {totalUnpaid.toLocaleString('vi-VN')} VNĐ</p>
        </div>
        {debts.length === 0 ? (
            <p className="text-muted-foreground">Chưa có công nợ nào.</p>
        ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Số tiền (VNĐ)</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map(debt => (
                <TableRow key={debt.id}>
                  <TableCell>{debt.id}</TableCell>
                  <TableCell>{debt.supplier}</TableCell>
                  <TableCell>{new Date(debt.date).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell>{debt.amount.toLocaleString('vi-VN')}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => toggleStatus(debt.id)}
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

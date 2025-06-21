
"use client";

import React, { useMemo } from 'react';
import type { Customer, Invoice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy } from 'lucide-react';
import { cn, normalizeStringForSearch } from '@/lib/utils';

interface LeaderboardTabProps {
  customers: Customer[];
  invoices: Invoice[];
}

interface LeaderboardEntry extends Customer {
  totalSpent: number;
  rank: number;
}

export function LeaderboardTab({ customers, invoices }: LeaderboardTabProps) {
  const leaderboardData = useMemo((): LeaderboardEntry[] => {
    const spendingMap = new Map<string, number>();

    // Aggregate spending by normalized customer name from invoices
    invoices.forEach(invoice => {
      const normalizedName = normalizeStringForSearch(invoice.customerName);
      if (normalizedName && normalizedName !== 'khachle') { // Exclude guest customers
        const currentSpending = spendingMap.get(normalizedName) || 0;
        spendingMap.set(normalizedName, currentSpending + invoice.total);
      }
    });

    // Map spending to customer data and filter out those with no spending
    const rankedCustomers = customers
      .map(customer => {
        const normalizedName = normalizeStringForSearch(customer.name);
        const totalSpent = spendingMap.get(normalizedName) || 0;
        return {
          ...customer,
          totalSpent,
        };
      })
      .filter(customer => customer.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .map((customer, index) => ({
        ...customer,
        rank: index + 1,
      }));

    return rankedCustomers;
  }, [customers, invoices]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-yellow-700";
    return "text-muted-foreground";
  };

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Trophy className="mr-3 h-7 w-7 text-yellow-500" />
            Bảng Xếp Hạng Khách Hàng
          </CardTitle>
          <CardDescription>
            Vinh danh những khách hàng thân thiết có chi tiêu cao nhất.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboardData.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">
              Chưa có dữ liệu chi tiêu của khách hàng để lập bảng xếp hạng.
            </p>
          ) : (
            <ScrollArea className="h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 text-center">Hạng</TableHead>
                    <TableHead>Tên Khách Hàng</TableHead>
                    <TableHead className="text-right">Tổng Chi Tiêu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="text-center font-bold">
                        <div className={cn("flex items-center justify-center gap-2", getRankColor(customer.rank))}>
                          {customer.rank <= 3 && <Trophy className="h-5 w-5" />}
                          <span>{customer.rank}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {customer.totalSpent.toLocaleString('vi-VN')} VNĐ
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

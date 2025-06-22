
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import type { Customer, Invoice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy } from 'lucide-react';
import { cn, normalizeStringForSearch } from '@/lib/utils';
import Confetti from 'react-confetti';

interface LeaderboardTabProps {
  customers: Customer[];
  invoices: Invoice[];
}

interface LeaderboardEntry extends Customer {
  totalSpent: number;
  rank: number;
}

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState<{width: number | undefined, height: number | undefined}>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    window.addEventListener("resize", handleResize);
    
    handleResize();
    
    return () => window.removeEventListener("resize", handleResize);
  }, []); 

  return windowSize;
}

export function LeaderboardTab({ customers, invoices }: LeaderboardTabProps) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 8000); 
    return () => clearTimeout(timer);
  }, []);

  const leaderboardData = useMemo((): LeaderboardEntry[] => {
    const spendingMap = new Map<string, number>();

    invoices.forEach(invoice => {
      const normalizedName = normalizeStringForSearch(invoice.customerName);
      if (normalizedName && normalizedName !== 'khachle') {
        const currentSpending = spendingMap.get(normalizedName) || 0;
        spendingMap.set(normalizedName, currentSpending + invoice.total);
      }
    });

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

  const getRankStyling = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-900 font-bold';
      case 2:
        return 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 text-gray-800 font-semibold';
      case 3:
        return 'bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 text-orange-900 font-semibold';
      default:
        return '';
    }
  };

  return (
    <>
      {showConfetti && width && height && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} />}
      <div className="p-4 md:p-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-3xl font-bold flex items-center">
              <Trophy className="mr-3 h-8 w-8 text-yellow-500" />
              Bảng Vàng Vinh Danh
            </CardTitle>
            <CardDescription className="text-base">
              Vinh danh những khách hàng thân thiết có chi tiêu cao nhất.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {leaderboardData.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                Chưa có dữ liệu chi tiêu của khách hàng để lập bảng xếp hạng.
              </p>
            ) : (
              <ScrollArea className="h-[70vh] no-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24 text-center text-lg">Hạng</TableHead>
                      <TableHead className="text-lg">Tên Khách Hàng</TableHead>
                      <TableHead className="text-right text-lg">Tổng Chi Tiêu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboardData.map((customer, index) => {
                       const isTopThree = customer.rank <= 3;
                      return (
                        <TableRow 
                          key={customer.id} 
                          className={cn(
                            "animate-fadeInUp group",
                            getRankStyling(customer.rank)
                          )}
                          style={{ animationDelay: `${index * 100}ms`, opacity: 0 }}
                        >
                          <TableCell className="text-center">
                            <div className={cn("flex items-center justify-center gap-2", isTopThree && "text-2xl")}>
                              <Trophy className={cn(
                                "h-6 w-6 group-hover:animate-subtlePulse", 
                                customer.rank === 1 && "text-yellow-600 h-8 w-8 animate-subtlePulse",
                                customer.rank === 2 && "text-gray-600 h-8 w-8 animate-subtlePulse",
                                customer.rank === 3 && "text-orange-700 h-8 w-8 animate-subtlePulse",
                              )} />
                              <span>{customer.rank}</span>
                            </div>
                          </TableCell>
                          <TableCell className={cn("text-lg", isTopThree ? "text-xl" : "font-medium")}>
                            {customer.name}
                          </TableCell>
                          <TableCell className={cn("text-right text-lg font-semibold", isTopThree ? "text-xl" : "text-primary")}>
                            {customer.totalSpent.toLocaleString('vi-VN')} VNĐ
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

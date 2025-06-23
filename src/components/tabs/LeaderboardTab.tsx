
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import type { Customer, Invoice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy } from 'lucide-react';
import { cn, normalizeStringForSearch } from '@/lib/utils';
import Confetti from 'react-confetti';
import { Badge } from '@/components/ui/badge';

interface LeaderboardTabProps {
  customers: Customer[];
  invoices: Invoice[];
}

interface LeaderboardEntry extends Customer {
  totalSpent: number;
  rank: number;
  purchaseCount: number;
  firstPurchaseDate: string | null;
  vipTier: string;
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

  const leaderboardData = useMemo((): LeaderboardEntry[] => {
    const spendingMap = new Map<string, { totalSpent: number; purchaseCount: number; firstPurchaseDate: string | null; }>();
    const sortedInvoices = [...invoices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedInvoices.forEach(invoice => {
      const normalizedName = normalizeStringForSearch(invoice.customerName);
      if (normalizedName && normalizedName !== 'khachle') {
        if (!spendingMap.has(normalizedName)) {
          spendingMap.set(normalizedName, {
            totalSpent: 0,
            purchaseCount: 0,
            firstPurchaseDate: invoice.date,
          });
        }
        const customerData = spendingMap.get(normalizedName)!;
        customerData.totalSpent += invoice.total;
        customerData.purchaseCount += 1;
      }
    });

    const getVipTier = (totalSpent: number): string => {
        if (totalSpent > 10000000) return 'Kim Cương';
        if (totalSpent > 5000000) return 'Vàng';
        if (totalSpent > 2000000) return 'Bạc';
        if (totalSpent > 500000) return 'Đồng';
        return 'Thân Thiết';
    }

    const rankedCustomers = customers
      .map(customer => {
        const normalizedName = normalizeStringForSearch(customer.name);
        const customerStats = spendingMap.get(normalizedName) || { totalSpent: 0, purchaseCount: 0, firstPurchaseDate: null };
        
        return {
          ...customer,
          totalSpent: customerStats.totalSpent,
          purchaseCount: customerStats.purchaseCount,
          firstPurchaseDate: customerStats.firstPurchaseDate,
          vipTier: getVipTier(customerStats.totalSpent),
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

  const getVipTierStyling = (tier: string) => {
    switch (tier) {
      case 'Kim Cương':
        return 'bg-gradient-to-r from-blue-400 to-emerald-400 text-white shadow-lg border-sky-300';
      case 'Vàng':
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg border-yellow-300';
      case 'Bạc':
        return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-lg border-slate-300';
      case 'Đồng':
        return 'bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-lg border-orange-300';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <>
      {width && height && leaderboardData.length > 0 && <Confetti width={width} height={height} recycle={true} numberOfPieces={50} />}
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
                      <TableHead>Hạng VIP</TableHead>
                      <TableHead className="text-right text-lg">Tổng Chi Tiêu</TableHead>
                      <TableHead className="text-center">Số Lần Mua</TableHead>
                      <TableHead>Ngày Đầu Mua</TableHead>
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
                                "h-6 w-6 transition-transform duration-300 group-hover:scale-125",
                                customer.rank === 1 && "text-yellow-500 h-8 w-8 animate-trophyPulse",
                                customer.rank === 2 && "text-gray-400 h-8 w-8 animate-trophyPulse",
                                customer.rank === 3 && "text-orange-600 h-8 w-8 animate-trophyPulse",
                              )} />
                              <span>{customer.rank}</span>
                            </div>
                          </TableCell>
                          <TableCell className={cn("text-lg", isTopThree ? "text-xl" : "font-medium")}>
                            {customer.name}
                          </TableCell>
                          <TableCell>
                             <Badge className={cn(
                                "text-xs font-bold transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:shadow-xl", 
                                getVipTierStyling(customer.vipTier)
                              )}>
                              {customer.vipTier}
                            </Badge>
                          </TableCell>
                          <TableCell className={cn("text-right text-lg font-semibold", isTopThree ? "text-xl" : "text-primary")}>
                            {customer.totalSpent.toLocaleString('vi-VN')} VNĐ
                          </TableCell>
                           <TableCell className="text-center">{customer.purchaseCount}</TableCell>
                           <TableCell>
                            {customer.firstPurchaseDate ? new Date(customer.firstPurchaseDate).toLocaleDateString('vi-VN') : 'N/A'}
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

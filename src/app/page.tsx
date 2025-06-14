
"use client";

import React, { useState, useMemo, ReactNode } from 'react';
import type { Product, Employee, Invoice, Debt } from '@/types';
import { initialInventory, initialEmployees } from '@/lib/initial-data';

import { HomeIcon } from '@/components/icons/HomeIcon';
import { WarehouseIcon } from '@/components/icons/WarehouseIcon';
import { SellIcon } from '@/components/icons/SellIcon';
import { ImportIcon } from '@/components/icons/ImportIcon';
import { InvoiceIcon as InvoiceIconSvg } from '@/components/icons/InvoiceIcon';
import { DebtIcon } from '@/components/icons/DebtIcon';
import { RevenueIcon } from '@/components/icons/RevenueIcon';
import { EmployeeIcon } from '@/components/icons/EmployeeIcon';

import { SalesTab } from '@/components/tabs/SalesTab';
import { InventoryTab } from '@/components/tabs/InventoryTab';
import { ImportTab } from '@/components/tabs/ImportTab';
import { InvoiceTab } from '@/components/tabs/InvoiceTab';
import { DebtTab } from '@/components/tabs/DebtTab';
import { RevenueTab } from '@/components/tabs/RevenueTab';
import { EmployeeTab } from '@/components/tabs/EmployeeTab';
import { cn } from '@/lib/utils';

import { 
  SidebarProvider, 
  Sidebar, 
  SidebarTrigger, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarInset,
  SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import { PanelLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';

type TabName = 'Bán hàng' | 'Kho hàng' | 'Nhập hàng' | 'Hóa đơn' | 'Công nợ' | 'Doanh thu' | 'Nhân viên';

interface NavItem {
  name: TabName;
  icon: ReactNode;
}

export default function FleurManagerPage() {
  const [activeTab, setActiveTab] = useState<TabName>('Kho hàng');
  const [inventory, setInventory] = useState<Product[]>(initialInventory);
  const [employeesData, setEmployeesData] = useState<Employee[]>(initialEmployees);
  const [invoicesData, setInvoicesData] = useState<Invoice[]>([]);
  const [debtsData, setDebtsData] = useState<Debt[]>([]);

  const navItems: NavItem[] = [
    { name: 'Bán hàng', icon: <SellIcon /> },
    { name: 'Kho hàng', icon: <WarehouseIcon /> },
    { name: 'Nhập hàng', icon: <ImportIcon /> },
    { name: 'Hóa đơn', icon: <InvoiceIconSvg /> },
    { name: 'Công nợ', icon: <DebtIcon /> },
    { name: 'Doanh thu', icon: <RevenueIcon /> },
    { name: 'Nhân viên', icon: <EmployeeIcon /> },
  ];

  const tabs: Record<TabName, ReactNode> = useMemo(() => ({
    'Bán hàng': <SalesTab inventory={inventory} setInventory={setInventory} invoices={invoicesData} setInvoices={setInvoicesData} />,
    'Kho hàng': <InventoryTab inventory={inventory} setInventory={setInventory} />,
    'Nhập hàng': <ImportTab inventory={inventory} setInventory={setInventory} debts={debtsData} setDebts={setDebtsData} />,
    'Hóa đơn': <InvoiceTab invoices={invoicesData} />,
    'Công nợ': <DebtTab debts={debtsData} setDebts={setDebtsData} />,
    'Doanh thu': <RevenueTab invoices={invoicesData} />,
    'Nhân viên': <EmployeeTab employees={employeesData} setEmployees={setEmployeesData} />,
  }), [inventory, employeesData, invoicesData, debtsData]);

  const SidebarToggleButton = () => {
    const { open, toggleSidebar } = useSidebar();
    return (
      <SidebarMenuButton
        onClick={toggleSidebar}
        className="w-full mt-auto"
      >
        {open ? <ChevronsLeft className="h-5 w-5" /> : <ChevronsRight className="h-5 w-5" />}
        <span>
          {open ? 'Thu gọn' : 'Mở rộng'}
        </span>
      </SidebarMenuButton>
    );
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background font-body">
        <Sidebar collapsible="icon" className="print:hidden shadow-lg" side="left">
          <SidebarHeader className="h-20 p-0 flex items-center justify-center shadow-md bg-primary/5 border-b border-primary/20">
            <HomeIcon className="text-primary" />
            <h1 className="text-2xl font-bold text-primary ml-3 font-headline group-data-[state=collapsed]:hidden">
              Fleur Manager
            </h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => setActiveTab(item.name)}
                    isActive={activeTab === item.name}
                    tooltip={{ children: item.name, side: "right", align: "center" }}
                    className={cn(
                      'rounded-lg', 
                      activeTab === item.name
                        ? 'bg-primary text-primary-foreground shadow-lg' 
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <span className="w-6 h-6">{item.icon}</span>
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border sticky bottom-0 bg-sidebar">
            <SidebarToggleButton />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
            <div className="flex items-center mb-8 print:hidden">
              <SidebarTrigger className="md:hidden mr-4">
                <PanelLeft />
              </SidebarTrigger>
              <h2 className="text-4xl font-bold text-foreground font-headline">{activeTab}</h2>
            </div>
            <div className="bg-card p-6 rounded-xl shadow-xl min-h-[calc(100vh-10rem)]">
               {tabs[activeTab]}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

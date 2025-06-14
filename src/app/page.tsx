"use client";

import React, { useState, useMemo, ReactNode } from 'react';
import type { Product, Employee, Invoice, Debt } from '@/types';
import { initialInventory, initialEmployees } from '@/lib/initial-data';

import { HomeIcon } from '@/components/icons/HomeIcon';
import { WarehouseIcon } from '@/components/icons/WarehouseIcon';
import { SellIcon } from '@/components/icons/SellIcon';
import { ImportIcon } from '@/components/icons/ImportIcon';
import { InvoiceIcon as InvoiceIconSvg } from '@/components/icons/InvoiceIcon'; // Renamed to avoid conflict
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


  return (
    <div className="flex h-screen bg-background font-body">
      <aside className="w-64 bg-card shadow-lg flex flex-col print:hidden">
        <div className="flex items-center justify-center h-20 shadow-md bg-primary/5 border-b border-primary/20">
          <HomeIcon className="text-primary" />
          <h1 className="text-2xl font-bold text-primary ml-3 font-headline">Fleur Manager</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map(item => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "flex items-center w-full px-4 py-3 text-left rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50",
                activeTab === item.name
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-foreground hover:bg-primary/10 hover:text-primary'
              )}
              aria-current={activeTab === item.name ? "page" : undefined}
            >
              <span className="w-6 h-6">{item.icon}</span>
              <span className="ml-4 text-base font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <h2 className="text-4xl font-bold text-foreground mb-8 font-headline">{activeTab}</h2>
        <div className="bg-card p-6 rounded-xl shadow-xl min-h-[calc(100vh-10rem)]"> {/* Adjust min-height as needed */}
           {tabs[activeTab]}
        </div>
      </main>
    </div>
  );
}

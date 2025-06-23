
"use client";

import React, { useState, useMemo, ReactNode, useEffect, useCallback } from 'react';
import type { Product, Invoice, Debt, CartItem, ProductOptionType, Customer, Employee, ShopInfo, EmployeePosition, DisposalLogEntry, UserAccessRequest, UserAccessRequestStatus, ProductFormData, Order, OrderStatus, PaymentStatus, OrderItem } from '@/types';
import { initialProductFormData as defaultProductFormData } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuth, type AuthContextType } from '@/contexts/AuthContext';
import type { User } from 'firebase/auth';
import Image from 'next/image';
import { startOfDay, endOfDay } from 'date-fns';

import { WarehouseIcon } from '@/components/icons/WarehouseIcon';
import { SellIcon } from '@/components/icons/SellIcon';
import { ImportIcon } from '@/components/icons/ImportIcon';
import { InvoiceIcon as InvoiceIconSvg } from '@/components/icons/InvoiceIcon';
import { DebtIcon } from '@/components/icons/DebtIcon';
import { RevenueIcon } from '@/components/icons/RevenueIcon';
import { CustomerIcon } from '@/components/icons/CustomerIcon';
import { EmployeeIcon } from '@/components/icons/EmployeeIcon';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';


import { SalesTab } from '@/components/tabs/SalesTab';
import { InventoryTab } from '@/components/tabs/InventoryTab';
import { ImportTab } from '@/components/tabs/ImportTab';
import { InvoiceTab } from '@/components/tabs/InvoiceTab';
import { DebtTab } from '@/components/tabs/DebtTab';
import { RevenueTab } from '@/components/tabs/RevenueTab';
import { CustomerTab } from '@/components/tabs/CustomerTab';
import { EmployeeTab } from '@/components/tabs/EmployeeTab';
import { OrdersTab } from '@/components/tabs/OrdersTab';
import { StorefrontTab } from '@/components/tabs/StorefrontTab';
import { LeaderboardTab } from '@/components/tabs/LeaderboardTab';
import { HistoryTab } from '@/components/tabs/HistoryTab';
import { SetNameDialog } from '@/components/auth/SetNameDialog';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { LockScreen } from '@/components/shared/LockScreen';
import { SettingsDialog, type OverallFontSize, type NumericDisplaySize } from '@/components/settings/SettingsDialog';
import { CustomerCartSheet } from '@/components/orders/CustomerCartSheet';
import { ProductOrderDialog } from '@/components/orders/ProductOrderDialog';
import { cn } from '@/lib/utils';
import { UserX, HelpCircle, Trophy, History } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';


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
import { PanelLeft, ChevronsLeft, ChevronsRight, LogOut, UserCircle, Settings, Lock, ShoppingCart, Store, Pencil, Trash2, PlusCircle, MoreHorizontal } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, push, update, get, child, remove } from "firebase/database";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "nthe1008@gmail.com";
const ADMIN_NAME = "Quản trị viên";


interface SubmitItemToImport {
  productId: string;
  quantity: number;
  cost: number;
}

interface InvoiceCartItem {
  id: string;
  name: string;
  quality?: string;
  quantityInCart: number;
  price: number;
  costPrice?: number;
  image: string;
  color: string;
  size: string;
  unit: string;
  itemDiscount?: number;
  maxDiscountPerUnitVND?: number;
}


type TabName = 'Bán hàng' | 'Gian hàng' | 'Kho hàng' | 'Đơn hàng' | 'Nhập hàng' | 'Hóa đơn' | 'Công nợ' | 'Doanh thu' | 'Khách hàng' | 'Nhân viên' | 'Bảng xếp hạng' | 'Lịch sử mua hàng';

export interface ActivityDateTimeFilter {
  startDate: Date | null;
  endDate: Date | null;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
}

const getInitialActivityDateTimeFilter = (
  setStartOfDayToday: boolean = true,
  setEndOfDayToday: boolean = true
): ActivityDateTimeFilter => {
  const now = new Date();
  return {
    startDate: setStartOfDayToday ? startOfDay(now) : null,
    endDate: setEndOfDayToday ? endOfDay(now) : null,
    startHour: '00',
    startMinute: '00',
    endHour: '23',
    endMinute: '59',
  };
};

const getCombinedDateTime = (dateInput: Date | null, hourStr: string, minuteStr: string): Date | null => {
    if (!dateInput) return null;
    const newDate = new Date(dateInput);
    const hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const isEndMinute = minuteStr === '59';
      const seconds = isEndMinute ? 59 : 0;
      const milliseconds = isEndMinute ? 999 : 0;
      newDate.setHours(hours, minutes, seconds, milliseconds);
    }
    return newDate;
};

const filterActivityByDateTimeRange = <T extends { date: string }>(
  data: T[],
  filter: ActivityDateTimeFilter
): T[] => {
  if (!data) return [];
  const { startDate, endDate, startHour, startMinute, endHour, endMinute } = filter;

  if (!startDate && !endDate) {
    return data;
  }

  let effectiveStartDate: Date | null = null;
  if (startDate) {
    effectiveStartDate = getCombinedDateTime(startDate, startHour, startMinute);
  }

  let effectiveEndDate: Date | null = null;
  if (endDate) {
    effectiveEndDate = getCombinedDateTime(endDate, endHour, endMinute);
    if (effectiveEndDate && endMinute === '59' && endHour === '23') {
        effectiveEndDate = endOfDay(effectiveEndDate);
    } else if (effectiveEndDate && endMinute === '59') {
        effectiveEndDate.setSeconds(59, 999);
    }
  }

  return data.filter(item => {
    const itemDateTime = new Date(item.date);
    const afterStartDate = !effectiveStartDate || itemDateTime >= effectiveStartDate;
    const beforeEndDate = !effectiveEndDate || itemDateTime <= effectiveEndDate;
    return afterStartDate && beforeEndDate;
  });
};


interface FleurManagerLayoutContentProps {
  currentUser: User;
  activeTab: TabName;
  setActiveTab: React.Dispatch<React.SetStateAction<TabName>>;
  inventory: Product[];
  customersData: Customer[];
  ordersData: Order[];
  invoicesData: Invoice[];
  debtsData: Debt[];
  employeesData: Employee[];
  disposalLogEntries: DisposalLogEntry[];
  shopInfo: ShopInfo | null;
  isLoadingShopInfo: boolean;
  cart: CartItem[];
  customerCart: CartItem[];
  productNameOptions: string[];
  colorOptions: string[];
  productQualityOptions: string[];
  sizeOptions: string[];
  unitOptions: string[];
  storefrontProducts: Product[];
  storefrontProductIds: Record<string, boolean>;
  revenueFilter: ActivityDateTimeFilter;
  invoiceFilter: ActivityDateTimeFilter;
  debtFilter: ActivityDateTimeFilter;
  orderFilter: ActivityDateTimeFilter;
  isUserInfoDialogOpen: boolean;
  setIsUserInfoDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isScreenLocked: boolean;
  setIsScreenLocked: React.Dispatch<React.SetStateAction<boolean>>;
  isSettingsDialogOpen: boolean;
  setIsSettingsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  overallFontSize: OverallFontSize;
  setOverallFontSize: React.Dispatch<React.SetStateAction<OverallFontSize>>;
  numericDisplaySize: NumericDisplaySize;
  setNumericDisplaySize: React.Dispatch<React.SetStateAction<NumericDisplaySize>>;
  isCurrentUserAdmin: boolean;
  currentUserEmployeeData: Employee | undefined;
  isCurrentUserCustomer: boolean;
  hasFullAccessRights: boolean;
  filteredInvoicesForRevenue: Invoice[];
  filteredInvoicesForInvoiceTab: Invoice[];
  filteredDebtsForDebtTab: Debt[];
  filteredOrdersForOrderTab: Order[];
  handleCreateInvoice: (customerName: string, invoiceCartItems: CartItem[], subtotalAfterItemDiscounts: number, paymentMethod: string, amountPaid: number, isGuestCustomer: boolean, employeeId: string, employeeName: string) => Promise<boolean>;
  handleAddProductOption: (type: ProductOptionType, name: string) => Promise<void>;
  handleDeleteProductOption: (type: ProductOptionType, name: string) => Promise<void>;
  handleImportProducts: (supplierName: string | undefined, itemsToProcess: SubmitItemToImport[], totalImportCostVND: number, employeeId: string, employeeName: string) => Promise<boolean>;
  handleProcessInvoiceCancellationOrReturn: (invoiceId: string, operationType: "delete" | "return", itemsToReturnArray?: { productId: string; name: string; quantityToReturn: number; }[] | undefined) => Promise<boolean>;
  handleUpdateDebtStatus: (debtId: string, newStatus: "Chưa thanh toán" | "Đã thanh toán", employeeId: string, employeeName: string, isUndoOperation?: boolean) => Promise<void>;
  handleAddCustomer: (newCustomerData: Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string }) => Promise<void>;
  handleUpdateCustomer: (customerId: string, updatedCustomerData: Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string }) => Promise<void>;
  handleDeleteCustomer: (customerId: string) => Promise<void>;
  handleDeleteDebt: (debtId: string) => void;
  handleSaveShopInfo: (newInfo: ShopInfo) => Promise<void>;
  handleSignOut: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<User | null>;
  onAddToCart: (item: Product) => void;
  onUpdateCartQuantity: (itemId: string, newQuantityStr: string) => void;
  onItemDiscountChange: (itemId: string, discountNghinStr: string) => boolean;
  onClearCart: () => void;
  onRemoveFromCart: (itemId: string) => void;
  onAddToCartForCustomer: (product: Product, quantity: number, notes: string) => void;
  handleRevenueFilterChange: (newFilter: ActivityDateTimeFilter) => void;
  handleInvoiceFilterChange: (newFilter: ActivityDateTimeFilter) => void;
  handleDebtFilterChange: (newFilter: ActivityDateTimeFilter) => void;
  handleOrderFilterChange: (newFilter: ActivityDateTimeFilter) => void;
  handleUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, currentEmployeeId: string, currentEmployeeName: string) => Promise<void>;
  handleToggleEmployeeRole: (employeeId: string, currentPosition: EmployeePosition) => Promise<void>;
  handleUpdateEmployeeInfo: (employeeId: string, data: { name: string; phone?: string; zaloName?: string; }) => Promise<void>;
  handleDeleteEmployee: (employeeId: string) => Promise<void>;
  handleDisposeProductItems: (
    productId: string,
    quantityToDecrease: number,
    reason: string,
    productDetails: Pick<Product, 'name' | 'color' | 'quality' | 'size' | 'unit' | 'image'>,
    employeeId: string,
    employeeName: string
  ) => Promise<void>;
  openAddProductDialog: () => void;
  openEditProductDialog: (product: Product) => void;
  handleDeleteProductFromAnywhere: (productId: string) => void;
  handleUpdateProductMaxDiscount: (productId: string, newMaxDiscountVND: number) => Promise<void>;
  handleAddToStorefront: (productId: string) => Promise<void>;
  handleRemoveFromStorefront: (productId: string) => Promise<void>;
  setIsCartSheetOpen: (isOpen: boolean) => void;
  onOpenNoteEditor: (itemId: string) => void;
  onSelectProductGroupForOrder: (productGroup: Product[]) => void;
}

function FleurManagerLayoutContent(props: FleurManagerLayoutContentProps) {
  const {
    currentUser, activeTab, setActiveTab, inventory, customersData, ordersData, invoicesData, debtsData, employeesData, disposalLogEntries,
    shopInfo, isLoadingShopInfo, cart, customerCart, productNameOptions, colorOptions, productQualityOptions, sizeOptions,
    unitOptions, storefrontProducts, storefrontProductIds, revenueFilter, invoiceFilter, debtFilter, orderFilter, isUserInfoDialogOpen, setIsUserInfoDialogOpen,
    isScreenLocked, setIsScreenLocked, isSettingsDialogOpen, setIsSettingsDialogOpen, overallFontSize,
    setOverallFontSize, numericDisplaySize, setNumericDisplaySize, isCurrentUserAdmin, currentUserEmployeeData, isCurrentUserCustomer, hasFullAccessRights,
    filteredInvoicesForRevenue, filteredInvoicesForInvoiceTab, filteredDebtsForDebtTab, filteredOrdersForOrderTab,
    handleCreateInvoice, handleAddProductOption,
    handleDeleteProductOption, handleImportProducts, handleProcessInvoiceCancellationOrReturn,
    handleUpdateDebtStatus, handleAddCustomer, handleUpdateCustomer, handleDeleteCustomer, handleDeleteDebt,
    handleSaveShopInfo, handleSignOut, signIn, onAddToCart, onUpdateCartQuantity, onItemDiscountChange, onClearCart, onRemoveFromCart, onAddToCartForCustomer,
    handleRevenueFilterChange, handleInvoiceFilterChange, handleDebtFilterChange, handleOrderFilterChange, handleUpdateOrderStatus,
    handleToggleEmployeeRole, handleUpdateEmployeeInfo, handleDeleteEmployee, handleDisposeProductItems,
    openAddProductDialog, openEditProductDialog, handleDeleteProductFromAnywhere, handleUpdateProductMaxDiscount, 
    handleAddToStorefront, handleRemoveFromStorefront, onOpenNoteEditor, setIsCartSheetOpen,
    onSelectProductGroupForOrder
  } = props;

  const { open: sidebarStateOpen, toggleSidebar, isMobile } = useSidebar();

  const pendingOrdersCount = useMemo(() => {
    if (isCurrentUserCustomer) return 0; // Customers don't need to see this badge.
    return ordersData.filter(o => o.orderStatus === 'Chờ xác nhận' || o.orderStatus === 'Yêu cầu hủy').length;
  }, [ordersData, isCurrentUserCustomer]);

  const baseNavItems = useMemo(() => [
    { name: 'Bán hàng' as TabName, icon: <SellIcon /> },
    { name: 'Gian hàng' as TabName, icon: <Store /> },
    { name: 'Kho hàng' as TabName, icon: <WarehouseIcon /> },
    { name: 'Đơn hàng' as TabName, icon: <ShoppingCart /> },
    { name: 'Lịch sử mua hàng' as TabName, icon: <History /> },
    { name: 'Bảng xếp hạng' as TabName, icon: <Trophy /> },
    { name: 'Nhập hàng' as TabName, icon: <ImportIcon /> },
    { name: 'Hóa đơn' as TabName, icon: <InvoiceIconSvg /> },
    { name: 'Công nợ' as TabName, icon: <DebtIcon /> },
    { name: 'Doanh thu' as TabName, icon: <RevenueIcon /> },
    { name: 'Khách hàng' as TabName, icon: <CustomerIcon /> },
    { name: 'Nhân viên' as TabName, icon: <EmployeeIcon /> },
  ], []);

  const navItems = useMemo(() => {
    if (isCurrentUserCustomer) {
      return baseNavItems.filter(item => 
        item.name === 'Gian hàng' || 
        item.name === 'Đơn hàng' ||
        item.name === 'Lịch sử mua hàng' ||
        item.name === 'Bảng xếp hạng'
      );
    }
    
    let items = baseNavItems.filter(item => item.name !== 'Lịch sử mua hàng');

    if (currentUserEmployeeData?.position === 'Nhân viên') {
      items = items.filter(item => item.name !== 'Nhân viên' && item.name !== 'Doanh thu');
    }

    return items;
  }, [baseNavItems, currentUserEmployeeData, isCurrentUserCustomer]);

  const tabs: Record<TabName, ReactNode> = useMemo(() => ({
    'Bán hàng': <SalesTab
                    inventory={inventory}
                    customers={customersData}
                    onCreateInvoice={handleCreateInvoice}
                    currentUser={currentUser}
                    numericDisplaySize={numericDisplaySize}
                    cart={cart}
                    onAddToCart={onAddToCart}
                    onUpdateCartQuantity={onUpdateCartQuantity}
                    onRemoveFromCart={onRemoveFromCart}
                    onItemDiscountChange={onItemDiscountChange}
                    onClearCart={onClearCart}
                    productQualityOptions={productQualityOptions}
                  />,
    'Gian hàng': <StorefrontTab
                    products={storefrontProducts}
                    onOpenEditProductDialog={openEditProductDialog}
                    onRemoveFromStorefront={handleRemoveFromStorefront}
                    hasFullAccessRights={hasFullAccessRights}
                    isCurrentUserCustomer={isCurrentUserCustomer}
                    onSelectProduct={onSelectProductGroupForOrder}
                  />,
    'Kho hàng': <InventoryTab
                    inventory={inventory}
                    onOpenAddProductDialog={openAddProductDialog}
                    onOpenEditProductDialog={openEditProductDialog}
                    onDeleteProduct={handleDeleteProductFromAnywhere}
                    onUpdateProductMaxDiscount={handleUpdateProductMaxDiscount}
                    productNameOptions={productNameOptions}
                    colorOptions={colorOptions}
                    productQualityOptions={productQualityOptions}
                    sizeOptions={sizeOptions}
                    unitOptions={unitOptions}
                    onAddOption={handleAddProductOption}
                    onDeleteOption={handleDeleteProductOption}
                    hasFullAccessRights={hasFullAccessRights}
                    onDisposeProductItems={handleDisposeProductItems}
                    currentUser={currentUser}
                    storefrontProductIds={storefrontProductIds}
                    onAddToStorefront={handleAddToStorefront}
                    onRemoveFromStorefront={handleRemoveFromStorefront}
                  />,
    'Đơn hàng': <OrdersTab
                  orders={filteredOrdersForOrderTab}
                  onUpdateStatus={handleUpdateOrderStatus}
                  filter={orderFilter}
                  onFilterChange={handleOrderFilterChange}
                  currentUser={currentUser}
                  isCurrentUserCustomer={isCurrentUserCustomer}
                />,
    'Lịch sử mua hàng': <HistoryTab
                          invoices={invoicesData}
                          currentUser={currentUser}
                         />,
    'Bảng xếp hạng': <LeaderboardTab
                      customers={customersData}
                      invoices={invoicesData}
                     />,
    'Nhập hàng': <ImportTab
                    inventory={inventory}
                    onImportProducts={handleImportProducts}
                    productNameOptions={productNameOptions}
                    colorOptions={colorOptions}
                    productQualityOptions={productQualityOptions}
                    sizeOptions={sizeOptions}
                    unitOptions={unitOptions}
                    currentUser={currentUser}
                  />,
    'Hóa đơn': <InvoiceTab
                  invoices={filteredInvoicesForInvoiceTab || []}
                  onProcessInvoiceCancellationOrReturn={handleProcessInvoiceCancellationOrReturn}
                  filter={invoiceFilter}
                  onFilterChange={handleInvoiceFilterChange}
                  hasFullAccessRights={hasFullAccessRights}
                />,
    'Công nợ': <DebtTab
                  debts={filteredDebtsForDebtTab}
                  onUpdateDebtStatus={handleUpdateDebtStatus}
                  filter={debtFilter}
                  onFilterChange={handleDebtFilterChange}
                  currentUser={currentUser}
                />,
    'Doanh thu': <RevenueTab
                  invoices={filteredInvoicesForRevenue}
                  inventory={inventory}
                  disposalLogEntries={disposalLogEntries}
                  filter={revenueFilter}
                  onFilterChange={handleRevenueFilterChange}
                  numericDisplaySize={numericDisplaySize}
                />,
    'Khách hàng': <CustomerTab
                      customers={customersData}
                      invoices={invoicesData}
                      onAddCustomer={handleAddCustomer}
                      onUpdateCustomer={handleUpdateCustomer}
                      onDeleteCustomer={handleDeleteCustomer}
                      hasFullAccessRights={hasFullAccessRights}
                      currentUser={currentUser}
                      isCurrentUserAdmin={isCurrentUserAdmin}
                      isCurrentUserCustomer={isCurrentUserCustomer}
                    />,
    'Nhân viên': <EmployeeTab
                    employees={employeesData}
                    currentUser={currentUser}
                    invoices={invoicesData}
                    debts={debtsData}
                    numericDisplaySize={numericDisplaySize}
                    onDeleteDebt={handleDeleteDebt}
                    onToggleEmployeeRole={handleToggleEmployeeRole}
                    onUpdateEmployeeInfo={handleUpdateEmployeeInfo}
                    adminEmail={ADMIN_EMAIL}
                    isCurrentUserAdmin={isCurrentUserAdmin}
                    onDeleteEmployee={handleDeleteEmployee}
                  />,
  }), [
      inventory, customersData, ordersData, invoicesData, debtsData, employeesData, disposalLogEntries, cart, currentUser, numericDisplaySize,
      productNameOptions, colorOptions, productQualityOptions, sizeOptions, unitOptions,
      storefrontProducts, storefrontProductIds,
      filteredInvoicesForRevenue, revenueFilter, filteredInvoicesForInvoiceTab, invoiceFilter,
      filteredDebtsForDebtTab, debtFilter, filteredOrdersForOrderTab, orderFilter,
      isCurrentUserAdmin, hasFullAccessRights, isCurrentUserCustomer,
      handleCreateInvoice, handleAddProductOption, handleDeleteProductOption, handleImportProducts,
      handleProcessInvoiceCancellationOrReturn, handleUpdateDebtStatus,
      handleAddCustomer, handleUpdateCustomer, handleDeleteCustomer, handleDeleteDebt,
      onAddToCart, onUpdateCartQuantity, onItemDiscountChange, onClearCart, onRemoveFromCart, onAddToCartForCustomer,
      handleRevenueFilterChange, handleInvoiceFilterChange, handleDebtFilterChange, handleOrderFilterChange, handleUpdateOrderStatus,
      handleToggleEmployeeRole, handleUpdateEmployeeInfo, handleDeleteEmployee, handleDisposeProductItems,
      openAddProductDialog, openEditProductDialog, handleDeleteProductFromAnywhere, handleUpdateProductMaxDiscount,
      handleAddToStorefront, handleRemoveFromStorefront, onSelectProductGroupForOrder
  ]);

  return (
      <div className="flex h-screen bg-background font-body">
        <Sidebar collapsible="icon" className="print:hidden shadow-lg" side="left">
           <SidebarHeader className="h-52 flex items-center justify-center shadow-md bg-primary/5 border-b border-primary/20 group-data-[state=expanded]:px-4 group-data-[state=collapsed]:px-0">
            {shopInfo && shopInfo.logoUrl ? (
                <Image
                    src={shopInfo.logoUrl}
                    alt={shopInfo.name || "Shop Logo"}
                    width={192}
                    height={192}
                    className="object-contain rounded-sm"
                    data-ai-hint="brand logo"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://placehold.co/192x192.png';
                    }}
                />
            ) : null }
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => setActiveTab(item.name as TabName)}
                    isActive={activeTab === item.name}
                    tooltip={{ children: item.name, side: "right", align: "center" }}
                    className={cn(
                      'relative rounded-lg group transition-all duration-200',
                      activeTab === item.name
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'text-sidebar-foreground hover:bg-primary/25 hover:text-primary-foreground hover:scale-105'
                    )}
                  >
                    <span className="w-6 h-6 transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">{isCurrentUserCustomer && item.name === 'Đơn hàng' ? 'Đơn hàng của tôi' : item.name}</span>
                    {item.name === 'Đơn hàng' && pendingOrdersCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                        </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border sticky bottom-0 bg-sidebar">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                        className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        tooltip={{children: "Tùy chọn khác", side: "right", align: "center"}}
                        variant="ghost"
                    >
                        <MoreHorizontal className="h-5 w-5" />
                        <span>Tùy chọn</span>
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                    side="top" 
                    align="start" 
                    className="w-56 mb-2 ml-2 bg-popover text-popover-foreground"
                >
                    {currentUser && (
                        <DropdownMenuItem onClick={() => setIsUserInfoDialogOpen(true)}>
                            <UserCircle className="mr-2 h-4 w-4" />
                            <span>{currentUser.displayName || "Tài khoản"}</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setIsSettingsDialogOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Cài đặt</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/20 focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Đăng xuất</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <main className="flex-1 overflow-y-auto no-scrollbar overflow-x-hidden">
            <div className="flex items-center mb-4 print:hidden px-4 pt-4 lg:px-6 lg:pt-6">
              <SidebarTrigger className="md:hidden mr-4">
                <PanelLeft />
              </SidebarTrigger>
              <h2 className="text-3xl font-bold text-foreground font-headline">{isCurrentUserCustomer && activeTab === 'Đơn hàng' ? 'Đơn hàng của tôi' : activeTab}</h2>
            </div>
            <div className="min-h-[calc(100vh-8rem)] px-0 pb-0 lg:px-0 lg:pb-0">
              <div key={activeTab} className="animate-fadeInUp">
                {tabs[activeTab]}
              </div>
            </div>
          </main>
        </SidebarInset>

      {currentUser && (
        <Dialog open={isUserInfoDialogOpen} onOpenChange={setIsUserInfoDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thông tin tài khoản</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về tài khoản của bạn.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="info-displayName" className="text-right">
                  Tên hiển thị
                </Label>
                <Input id="info-displayName" value={currentUser.displayName || 'Chưa cập nhật'} readOnly className="col-span-3 bg-muted/50" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="info-email" className="text-right">
                  Email
                </Label>
                <Input id="info-email" value={currentUser.email || 'Không có'} readOnly className="col-span-3 bg-muted/50" />
              </div>
              {currentUserEmployeeData && (
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="info-position" className="text-right">
                          Chức vụ
                      </Label>
                      <Input id="info-position" value={currentUserEmployeeData.position} readOnly className="col-span-3 bg-muted/50" />
                  </div>
              )}
               {isCurrentUserCustomer && (
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="info-role" className="text-right">
                          Vai trò
                      </Label>
                      <Input id="info-role" value="Khách hàng" readOnly className="col-span-3 bg-muted/50" />
                  </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsUserInfoDialogOpen(false)} variant="outline">Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <SettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        overallFontSize={overallFontSize}
        onOverallFontSizeChange={setOverallFontSize}
        numericDisplaySize={numericDisplaySize}
        onNumericDisplaySizeChange={setNumericDisplaySize}
        shopInfo={shopInfo}
        onSaveShopInfo={handleSaveShopInfo}
        hasAdminOrManagerRights={hasFullAccessRights}
        isLoadingShopInfo={isLoadingShopInfo}
      />

      {!isMobile && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleSidebar}
                className="fixed top-6 right-6 z-50 h-12 w-12 rounded-full bg-primary/80 text-primary-foreground shadow-lg hover:bg-primary/90 backdrop-blur-sm active:bg-primary/70 transition-all duration-150 ease-in-out hover:scale-105 print:hidden"
                size="icon"
                aria-label={sidebarStateOpen ? "Thu gọn thanh bên" : "Mở rộng thanh bên"}
              >
                {sidebarStateOpen ? <ChevronsLeft className="h-6 w-6" /> : <ChevronsRight className="h-6 w-6" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-card text-card-foreground">
              <p>{sidebarStateOpen ? 'Thu gọn thanh bên' : 'Mở rộng thanh bên'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {isCurrentUserCustomer ? (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => setIsCartSheetOpen(true)}
                        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 active:bg-primary/80 transition-transform duration-150 ease-in-out hover:scale-105 print:hidden"
                        size="icon"
                        aria-label="Xem giỏ hàng"
                    >
                        <ShoppingCart className="h-7 w-7" />
                        {customerCart.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                                {customerCart.reduce((acc, item) => acc + item.quantityInCart, 0)}
                            </span>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-card text-card-foreground">
                    <p>Xem giỏ hàng</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      ) : (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
            <TooltipTrigger asChild>
                <Button
                onClick={() => setIsScreenLocked(true)}
                className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 active:bg-primary/80 transition-transform duration-150 ease-in-out hover:scale-105 print:hidden"
                size="icon"
                aria-label="Khóa màn hình"
                >
                <Lock className="h-7 w-7" />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-card text-card-foreground">
                <p>Khóa màn hình</p>
            </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      )}

      <LockScreen
        isOpen={isScreenLocked}
        onUnlock={() => setIsScreenLocked(false)}
        currentUserEmail={currentUser?.email || null}
        signIn={signIn}
        currentUserName={currentUser?.displayName}
      />
      </div>
  );
}


export default function FleurManagerPage() {
  const { currentUser, loading: authLoading, signOut, updateUserProfileName, signIn } = useAuth() as AuthContextType;
  const router = useRouter();
  const { toast } = useToast();

  const [isSettingName, setIsSettingName] = useState(false);
  const [userAccessRequest, setUserAccessRequest] = useState<UserAccessRequest | null>(null);

  const [activeTab, setActiveTab] = useState<TabName>(() => {
    if (typeof window === 'undefined') return 'Bán hàng';
    try {
      const savedTab = localStorage.getItem('fleur-manager-active-tab') as TabName | null;
      const validTabs: TabName[] = ['Bán hàng', 'Gian hàng', 'Kho hàng', 'Đơn hàng', 'Nhập hàng', 'Hóa đơn', 'Công nợ', 'Doanh thu', 'Khách hàng', 'Nhân viên', 'Bảng xếp hạng', 'Lịch sử mua hàng'];
      return savedTab && validTabs.includes(savedTab) ? savedTab : 'Bán hàng';
    } catch {
      return 'Bán hàng';
    }
  });
  const [inventory, setInventory] = useState<Product[]>([]);
  const [customersData, setCustomersData] = useState<Customer[]>([]);
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [invoicesData, setInvoicesData] = useState<Invoice[]>([]);
  const [debtsData, setDebtsData] = useState<Debt[]>([]);
  const [employeesData, setEmployeesData] = useState<Employee[]>([]);
  const [disposalLogEntries, setDisposalLogEntries] = useState<DisposalLogEntry[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedCart = localStorage.getItem('fleur-manager-cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });
  const [customerCart, setCustomerCart] = useState<CartItem[]>([]);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  
  const [productNameOptions, setProductNameOptions] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [productQualityOptions, setProductQualityOptions] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);
  const [storefrontProductIds, setStorefrontProductIds] = useState<Record<string, boolean>>({});

  const [revenueFilter, setRevenueFilter] = useState<ActivityDateTimeFilter>(getInitialActivityDateTimeFilter());
  const [invoiceFilter, setInvoiceFilter] = useState<ActivityDateTimeFilter>(getInitialActivityDateTimeFilter());
  const [debtFilter, setDebtFilter] = useState<ActivityDateTimeFilter>(getInitialActivityDateTimeFilter(true, false));
  const [orderFilter, setOrderFilter] = useState<ActivityDateTimeFilter>(getInitialActivityDateTimeFilter());


  const [isUserInfoDialogOpen, setIsUserInfoDialogOpen] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [overallFontSize, setOverallFontSize] = useState<OverallFontSize>(() => {
    if (typeof window === 'undefined') return 'md';
    const savedSize = localStorage.getItem('fleur-manager-font-size') as OverallFontSize | null;
    return savedSize && ['sm', 'md', 'lg'].includes(savedSize) ? savedSize : 'md';
  });
  const [numericDisplaySize, setNumericDisplaySize] = useState<NumericDisplaySize>(() => {
    if (typeof window === 'undefined') return 'text-2xl';
    const savedSize = localStorage.getItem('fleur-manager-numeric-size') as NumericDisplaySize | null;
    const validSizes: NumericDisplaySize[] = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
    return savedSize && validSizes.includes(savedSize) ? savedSize : 'text-2xl';
  });
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [isLoadingShopInfo, setIsLoadingShopInfo] = useState(true);

  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);
  const [isConfirmingDebtDelete, setIsConfirmingDebtDelete] = useState(false);

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [currentEditingProduct, setCurrentEditingProduct] = useState<Product | null>(null);
  const [isProductFormEditMode, setIsProductFormEditMode] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);
  const [isConfirmingProductDelete, setIsConfirmingProductDelete] = useState(false);

  const [isCurrentUserCustomer, setIsCurrentUserCustomer] = useState(false);
  const [isLoadingAccessRequest, setIsLoadingAccessRequest] = useState(true);

  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [itemNoteContent, setItemNoteContent] = useState('');

  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedProductGroupForOrder, setSelectedProductGroupForOrder] = useState<Product[] | null>(null);

  const isCurrentUserAdmin = useMemo(() => currentUser?.email === ADMIN_EMAIL, [currentUser]);
  const currentUserEmployeeData = useMemo(() => employeesData.find(emp => emp.id === currentUser?.uid), [employeesData, currentUser]);

  const hasFullAccessRights = useMemo(() => {
    if (isCurrentUserCustomer) return false;
    if (!currentUser) return false;
    if (currentUser.email === ADMIN_EMAIL) return true;
    if (currentUserEmployeeData) {
      return currentUserEmployeeData.position === 'Quản lý' || currentUserEmployeeData.position === 'ADMIN';
    }
    return false;
  }, [currentUser, currentUserEmployeeData, isCurrentUserCustomer]);

  const productFormDefaultState = useMemo<ProductFormData>(() => ({
    ...defaultProductFormData,
    name: productNameOptions.length > 0 ? productNameOptions[0] : '',
    color: colorOptions.length > 0 ? colorOptions[0] : '',
    quality: productQualityOptions.length > 0 ? productQualityOptions[0] : '',
    size: sizeOptions.length > 0 ? sizeOptions[0] : '',
    unit: unitOptions.length > 0 ? unitOptions[0] : '',
    image: `https://placehold.co/100x100.png`,
  }), [productNameOptions, colorOptions, productQualityOptions, sizeOptions, unitOptions]);

  const handleOpenAddProductDialog = () => {
    setCurrentEditingProduct(null);
    setIsProductFormEditMode(false);
    setIsProductFormOpen(true);
  };

  const handleOpenEditProductDialog = (product: Product) => {
    setCurrentEditingProduct(product);
    setIsProductFormEditMode(true);
    setIsProductFormOpen(true);
  };

  const handleCloseProductFormDialog = () => {
    setIsProductFormOpen(false);
    setCurrentEditingProduct(null);
  };

  const handleProductFormSubmit = async (productData: Omit<Product, 'id'>, isEdit: boolean, productId?: string) => {
    try {
      const isDuplicate = inventory.some(p =>
        (isEdit ? p.id !== productId : true) &&
        p.name === productData.name &&
        p.color === productData.color &&
        p.quality === productData.quality &&
        p.size === productData.size &&
        p.unit === productData.unit
      );

      if (isDuplicate) {
        toast({
          title: "Sản phẩm đã tồn tại",
          description: "Trong danh sách sản phẩm đã có sản phẩm với các thuộc tính y hệt.",
          variant: "destructive",
        });
        return;
      }
      
      if (isEdit && productId) {
        await update(ref(db, `inventory/${productId}`), productData);
        toast({ title: "Thành công", description: "Sản phẩm đã được cập nhật." });
      } else {
        const newProductRef = push(ref(db, 'inventory'));
        await set(newProductRef, productData);
        toast({ title: "Thành công", description: "Sản phẩm đã được thêm vào kho." });
      }
      handleCloseProductFormDialog();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({ title: "Lỗi", description: "Không thể lưu sản phẩm. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const handleDeleteProductFromAnywhere = async (productId: string) => {
    if (!hasFullAccessRights) {
      toast({ title: "Không có quyền", description: "Bạn không có quyền xóa sản phẩm.", variant: "destructive" });
      return;
    }
    setProductToDeleteId(productId);
    setIsConfirmingProductDelete(true);
  };

  const confirmDeleteProduct = async () => {
    if (productToDeleteId) {
      try {
        await remove(ref(db, `inventory/${productToDeleteId}`));
        toast({ title: "Thành công", description: "Sản phẩm đã được xóa." });
      } catch (error) {
        console.error("Error deleting product:", error);
        toast({ title: "Lỗi", description: "Không thể xóa sản phẩm. Vui lòng thử lại.", variant: "destructive" });
      } finally {
        setIsConfirmingProductDelete(false);
        setProductToDeleteId(null);
      }
    }
  };

  const handleUpdateProductMaxDiscount = useCallback(async (productId: string, newMaxDiscountVND: number) => {
    if (!hasFullAccessRights) {
        toast({ title: "Không có quyền", description: "Bạn không có quyền cập nhật thông tin sản phẩm.", variant: "destructive" });
        return;
    }
    try {
        await update(ref(db, `inventory/${productId}`), { maxDiscountPerUnitVND: newMaxDiscountVND });
        toast({ title: "Thành công", description: "Giới hạn giảm giá đã được cập nhật." });
    } catch (error) {
        console.error("Error updating product max discount:", error);
        toast({ title: "Lỗi", description: "Không thể cập nhật giới hạn giảm giá.", variant: "destructive" });
    }
  }, [hasFullAccessRights, toast]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-overall-font-size', overallFontSize);
      localStorage.setItem('fleur-manager-font-size', overallFontSize);
    }
  }, [overallFontSize]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fleur-manager-numeric-size', numericDisplaySize);
    }
  }, [numericDisplaySize]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('fleur-manager-cart', JSON.stringify(cart));
      } catch (error: any) {
        // Check for QuotaExceededError (standard) or other quota-related messages
        if (error.name === 'QuotaExceededError' || (error.message && error.message.toLowerCase().includes('quota'))) {
          toast({
            title: "Lỗi lưu giỏ hàng",
            description: "Dung lượng lưu trữ của trình duyệt đã đầy. Giỏ hàng có thể không được lưu nếu bạn tải lại trang.",
            variant: "destructive",
            duration: 5000
          });
        } else {
          console.error("Không thể lưu giỏ hàng vào bộ nhớ cục bộ:", error);
        }
      }
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fleur-manager-active-tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  // Main access control and role determination effect
  useEffect(() => {
    if (authLoading || !currentUser) {
      return;
    }
  
    const checkUserAccess = async () => {
      setIsLoadingAccessRequest(true);
      setIsCurrentUserCustomer(false);
      setUserAccessRequest(null);

      // Path 1: User is Admin (fastest check)
      if (currentUser.email === ADMIN_EMAIL) {
        if (!currentUser.displayName) setIsSettingName(true);
        setIsLoadingAccessRequest(false);
        return;
      }
  
      // Path 2: Check if user is an approved Employee
      const employeeSnapshot = await get(ref(db, `employees/${currentUser.uid}`));
      if (employeeSnapshot.exists()) {
        // We don't set employeesData here, another effect will do that.
        // The existence of currentUserEmployeeData will grant access.
        if (!currentUser.displayName) setIsSettingName(true);
        setIsLoadingAccessRequest(false);
        return;
      }
  
      // Path 3: Check if user is an approved Customer
      const customerSnapshot = await get(ref(db, `customers/${currentUser.uid}`));
      if (customerSnapshot.exists()) {
        setIsCurrentUserCustomer(true);
        if (!currentUser.displayName) setIsSettingName(true);
        setIsLoadingAccessRequest(false);
        return;
      }
  
      // Path 4: Check for a pending/rejected request
      // We check the customer queue as it's the primary registration method now
      const requestSnapshot = await get(ref(db, `khach_hang_cho_duyet/${currentUser.uid}`));
      if (requestSnapshot.exists()) {
        setUserAccessRequest({ id: currentUser.uid, ...requestSnapshot.val() });
        if (!currentUser.displayName) setIsSettingName(true);
        setIsLoadingAccessRequest(false);
        return;
      }
      
      // Path 5: No access rights found
      setIsLoadingAccessRequest(false);
      if (!currentUser.displayName) setIsSettingName(true);
    };
  
    checkUserAccess();
  
  }, [currentUser, authLoading]);
  
  // Data loading effect for Employees (only for admins/employees)
  useEffect(() => {
    if (!currentUser || isCurrentUserCustomer) {
        setEmployeesData([]);
        return;
    }

    const employeesRef = ref(db, 'employees');
    const unsubscribe = onValue(employeesRef, (snapshot) => {
        const data = snapshot.val();
        const loadedEmployees: Employee[] = [];
        if (data) {
            Object.keys(data).forEach(key => {
                loadedEmployees.push({ id: key, ...data[key] });
            });
        }
        setEmployeesData(loadedEmployees.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => {
        console.error("Error fetching employees data:", error);
        toast({ title: "Lỗi tải dữ liệu", description: "Không thể tải danh sách nhân viên.", variant: "destructive" });
    });

    return () => unsubscribe();
  }, [currentUser, isCurrentUserCustomer, toast]); // Reruns when role changes

  // Main data loading effect (real-time for core operations)
  useEffect(() => {
    if (!currentUser) return;

    const inventoryRef = ref(db, 'inventory');
    const unsubInventory = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const inventoryArray: Product[] = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setInventory(inventoryArray.sort((a,b) => b.name.localeCompare(a.name)));
      } else {
        setInventory([]);
      }
    }, (error) => {
      console.error("Error fetching inventory data:", error);
      toast({ title: "Lỗi tải dữ liệu", description: "Không thể tải dữ liệu kho hàng.", variant: "destructive" });
    });

    const customersRef = ref(db, 'customers');
    const unsubCustomers = onValue(customersRef, (snapshot) => {
        const data = snapshot.val(); if (data) { const customersArray: Customer[] = Object.keys(data).map(key => ({ id: key, ...data[key] })); setCustomersData(customersArray.sort((a,b) => a.name.localeCompare(b.name))); } else { setCustomersData([]); }
    });

    const ordersRef = ref(db, 'orders');
    const unsubOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedOrders: Order[] = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setOrdersData(loadedOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
      } else {
        setOrdersData([]);
      }
    });

    const storefrontRef = ref(db, 'storefrontProducts');
    const unsubStorefront = onValue(storefrontRef, (snapshot) => { const data = snapshot.val(); setStorefrontProductIds(data || {}); });
    
    return () => { 
      unsubInventory();
      unsubCustomers(); 
      unsubOrders(); 
      unsubStorefront(); 
    };
  }, [currentUser, toast]);
  
  // Effect for secondary data (for employees/admins) - All real-time
  useEffect(() => {
    if (isCurrentUserCustomer || !currentUser) {
      setInvoicesData([]);
      setDebtsData([]);
      setDisposalLogEntries([]);
      setProductNameOptions([]);
      setColorOptions([]);
      setProductQualityOptions([]);
      setSizeOptions([]);
      setUnitOptions([]);
      return;
    }

    const invoicesRef = ref(db, 'invoices');
    const unsubInvoices = onValue(invoicesRef, (snapshot) => {
        const data = snapshot.val();
        const invoicesArray: Invoice[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        setInvoicesData(invoicesArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => {
      console.error("Error fetching invoices:", error);
      toast({ title: "Lỗi tải dữ liệu", description: "Không thể tải danh sách hóa đơn.", variant: "destructive" });
    });

    const debtsRef = ref(db, 'debts');
    const unsubDebts = onValue(debtsRef, (snapshot) => {
        const data = snapshot.val();
        const debtsArray: Debt[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        setDebtsData(debtsArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => {
        console.error("Error fetching debts:", error);
        toast({ title: "Lỗi tải dữ liệu", description: "Không thể tải danh sách công nợ.", variant: "destructive" });
    });

    const disposalLogRef = ref(db, 'disposalLog');
    const unsubDisposalLog = onValue(disposalLogRef, (snapshot) => {
        const data = snapshot.val();
        const loadedEntries: DisposalLogEntry[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        setDisposalLogEntries(loadedEntries.sort((a, b) => new Date(b.disposalDate).getTime() - new Date(a.disposalDate).getTime()));
    }, (error) => {
        console.error("Error fetching disposal log:", error);
        toast({ title: "Lỗi tải dữ liệu", description: "Không thể tải nhật ký loại bỏ.", variant: "destructive" });
    });

    const productNamesRef = ref(db, 'productOptions/productNames');
    const unsubProductNames = onValue(productNamesRef, (snapshot) => {
        setProductNameOptions(snapshot.exists() ? Object.keys(snapshot.val()).sort((a, b) => a.localeCompare(b)) : []);
    });

    const colorsRef = ref(db, 'productOptions/colors');
    const unsubColors = onValue(colorsRef, (snapshot) => {
        setColorOptions(snapshot.exists() ? Object.keys(snapshot.val()).sort((a, b) => a.localeCompare(b)) : []);
    });

    const qualitiesRef = ref(db, 'productOptions/qualities');
    const unsubQualities = onValue(qualitiesRef, (snapshot) => {
        setProductQualityOptions(snapshot.exists() ? Object.keys(snapshot.val()).sort((a, b) => a.localeCompare(b)) : []);
    });

    const sizesRef = ref(db, 'productOptions/sizes');
    const unsubSizes = onValue(sizesRef, (snapshot) => {
        setSizeOptions(snapshot.exists() ? Object.keys(snapshot.val()).sort((a, b) => a.localeCompare(b)) : []);
    });

    const unitsRef = ref(db, 'productOptions/units');
    const unsubUnits = onValue(unitsRef, (snapshot) => {
        setUnitOptions(snapshot.exists() ? Object.keys(snapshot.val()).sort((a, b) => a.localeCompare(b)) : []);
    });

    return () => {
      unsubInvoices();
      unsubDebts();
      unsubDisposalLog();
      unsubProductNames();
      unsubColors();
      unsubQualities();
      unsubSizes();
      unsubUnits();
    };
  }, [currentUser, isCurrentUserCustomer, toast]);
  
  // Effect for ShopInfo (for all logged-in users)
  useEffect(() => {
    if (!currentUser) return; 

    setIsLoadingShopInfo(true);
    const shopInfoRef = ref(db, 'shopInfo');
    const unsubscribeShopInfo = onValue(shopInfoRef, (snapshot) => {
        const defaultInvoiceSettings = {
            showShopLogoOnInvoice: true,
            showShopAddressOnInvoice: true,
            showShopPhoneOnInvoice: true,
            showShopBankDetailsOnInvoice: true,
            showEmployeeNameOnInvoice: true,
            invoiceThankYouMessage: "Cảm ơn quý khách đã mua hàng!",
        };
        if (snapshot.exists()) {
             const dbShopInfo = snapshot.val() as ShopInfo;
             setShopInfo({ ...defaultInvoiceSettings, ...dbShopInfo });
        } else {
            setShopInfo({ 
                name: 'Fleur Manager', 
                address: '', 
                phone: '', 
                logoUrl: '', 
                bankAccountName: '', 
                bankAccountNumber: '', 
                bankName: '', 
                ...defaultInvoiceSettings 
            });
        }
        setIsLoadingShopInfo(false);
    }, (error) => {
        console.error("Error fetching shop info:", error);
        toast({ title: "Lỗi tải thông tin cửa hàng", description: error.message, variant: "destructive" });
        setIsLoadingShopInfo(false);
    });
    return () => unsubscribeShopInfo();
  }, [currentUser, toast]);

  const handleRevenueFilterChange = useCallback((newFilter: ActivityDateTimeFilter) => setRevenueFilter(newFilter), []);
  const handleInvoiceFilterChange = useCallback((newFilter: ActivityDateTimeFilter) => setInvoiceFilter(newFilter), []);
  const handleDebtFilterChange = useCallback((newFilter: ActivityDateTimeFilter) => setDebtFilter(newFilter), []);
  const handleOrderFilterChange = useCallback((newFilter: ActivityDateTimeFilter) => setOrderFilter(newFilter), []);


  const filteredInvoicesForRevenue = useMemo(() => filterActivityByDateTimeRange(invoicesData, revenueFilter), [invoicesData, revenueFilter]);
  const filteredInvoicesForInvoiceTab = useMemo(() => filterActivityByDateTimeRange(invoicesData, invoiceFilter), [invoicesData, invoiceFilter]);
  const filteredDebtsForDebtTab = useMemo(() => filterActivityByDateTimeRange(debtsData, debtFilter).filter(debt => debt.status === 'Chưa thanh toán'), [debtsData, debtFilter]);
  
  const filteredOrdersForOrderTab = useMemo(() => {
    const userFilteredOrders = isCurrentUserCustomer
      ? ordersData.filter(o => o.customerId === currentUser?.uid)
      : ordersData;
    return filterActivityByDateTimeRange(userFilteredOrders.map(o => ({...o, date: o.orderDate })), orderFilter);
  }, [ordersData, orderFilter, isCurrentUserCustomer, currentUser]);

  const storefrontProducts = useMemo(() => {
    return inventory.filter(p => storefrontProductIds[p.id]);
  }, [inventory, storefrontProductIds]);


  const handleAddCustomer = useCallback(async (newCustomerData: Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string }) => { try { const newCustomerRef = push(ref(db, 'customers')); await set(newCustomerRef, newCustomerData); toast({ title: "Thành công", description: "Khách hàng đã được thêm.", variant: "default" }); } catch (error) { console.error("Error adding customer:", error); toast({ title: "Lỗi", description: "Không thể thêm khách hàng. Vui lòng thử lại.", variant: "destructive" }); } }, [toast]);
  const handleUpdateCustomer = useCallback(async (customerId: string, updatedCustomerData: Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string }) => { try { await update(ref(db, `customers/${customerId}`), updatedCustomerData); toast({ title: "Thành công", description: "Thông tin khách hàng đã được cập nhật.", variant: "default" }); } catch (error) { console.error("Error updating customer:", error); toast({ title: "Lỗi", description: "Không thể cập nhật thông tin khách hàng. Vui lòng thử lại.", variant: "destructive" }); } }, [toast]);
  const handleDeleteCustomer = useCallback(async (customerId: string) => { if (!hasFullAccessRights) { toast({ title: "Không có quyền", description: "Bạn không có quyền xóa khách hàng.", variant: "destructive" }); return; } try { await remove(ref(db, `customers/${customerId}`)); toast({ title: "Thành công", description: "Khách hàng đã được xóa.", variant: "default" }); } catch (error) { console.error("Error deleting customer:", error); toast({ title: "Lỗi", description: "Không thể xóa khách hàng. Vui lòng thử lại.", variant: "destructive" }); } }, [toast, hasFullAccessRights]);

  const onRemoveFromCart = useCallback((itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  }, []);

  const onUpdateCartQuantity = useCallback((itemId: string, newQuantityStr: string) => {
    if (newQuantityStr.trim() === '') {
        setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantityInCart: 0 } : item));
        return;
    }

    const newQuantity = parseInt(newQuantityStr, 10);
    
    if (newQuantity <= 0) {
        onRemoveFromCart(itemId);
        return;
    }

    if (isNaN(newQuantity) || newQuantity < 0) {
        return; 
    }

    const stockItem = inventory.find(i => i.id === itemId);

    if (!stockItem) {
        toast({ title: "Sản phẩm không tồn tại", description: "Sản phẩm này đã bị xóa khỏi kho.", variant: "destructive" });
        onRemoveFromCart(itemId);
        return;
    }

    if (newQuantity > stockItem.quantity) {
      toast({ title: "Số lượng không đủ", description: `Chỉ còn ${stockItem.quantity} ${stockItem.unit} trong kho.`, variant: "destructive" });
      setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantityInCart: stockItem.quantity } : item));
    } else {
      setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantityInCart: newQuantity } : item));
    }
  }, [inventory, toast, onRemoveFromCart]);

  const onAddToCart = useCallback((item: Product) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    const stockItem = inventory.find(i => i.id === item.id);

    if (!stockItem || stockItem.quantity <= 0) {
      toast({ title: "Hết hàng", description: `Sản phẩm "${item.name} ${item.color} ${item.quality} ${item.size} ${item.unit}" đã hết hàng!`, variant: "destructive" });
      return;
    }

    if (existingItem) {
      const newQuantityInCart = existingItem.quantityInCart + 1;
      if (newQuantityInCart <= stockItem.quantity) {
        onUpdateCartQuantity(item.id, newQuantityInCart.toString());
      } else {
        toast({ title: "Số lượng tối đa", description: `Không đủ số lượng "${item.name} ${item.color} ${item.quality} ${item.size} ${item.unit}" trong kho (Còn: ${stockItem.quantity}).`, variant: "destructive" });
      }
    } else {
      setCart(prevCart => [...prevCart, { ...item, quantityInCart: 1, itemDiscount: 0, maxDiscountPerUnitVND: stockItem.maxDiscountPerUnitVND }]);
    }
  }, [cart, inventory, toast, onUpdateCartQuantity]);

  const onItemDiscountChange = useCallback((itemId: string, discountNghinStr: string): boolean => {
    let inputWasInvalid = false;
    const currentItemInCartFromState = cart.find(i => i.id === itemId);

    if (!currentItemInCartFromState) {
        console.error("Item not found in cart for discount change:", itemId);
        return false;
    }

    const discountNghin = parseFloat(discountNghinStr);
    let validatedDiscountForItem = isNaN(discountNghin) ? 0 : discountNghin * 1000;
    const itemOriginalTotal = currentItemInCartFromState.price * currentItemInCartFromState.quantityInCart;

    if (validatedDiscountForItem < 0) {
        toast({ title: "Lỗi giảm giá", description: "Số tiền giảm giá cho sản phẩm không thể âm.", variant: "destructive" });
        validatedDiscountForItem = 0;
        inputWasInvalid = true;
    } else {
        if (currentItemInCartFromState.maxDiscountPerUnitVND !== undefined && currentItemInCartFromState.maxDiscountPerUnitVND !== null && currentItemInCartFromState.maxDiscountPerUnitVND >= 0) {
            const maxAllowedLineItemDiscount = currentItemInCartFromState.maxDiscountPerUnitVND * currentItemInCartFromState.quantityInCart;
            if (validatedDiscountForItem > maxAllowedLineItemDiscount) {
                toast({ title: "Lỗi giảm giá", description: `Giảm giá cho "${currentItemInCartFromState.name}" không thể vượt quá giới hạn cho phép của sản phẩm (${(maxAllowedLineItemDiscount / 1000).toLocaleString('vi-VN')}K).`, variant: "destructive" });
                validatedDiscountForItem = maxAllowedLineItemDiscount;
                inputWasInvalid = true;
            }
        }
         if (validatedDiscountForItem > itemOriginalTotal) {
             toast({ title: "Lỗi giảm giá", description: `Giảm giá cho sản phẩm "${currentItemInCartFromState.name}" không thể lớn hơn tổng tiền của sản phẩm đó (${(itemOriginalTotal / 1000).toLocaleString('vi-VN')}K).`, variant: "destructive" });
            validatedDiscountForItem = itemOriginalTotal;
            inputWasInvalid = true;
        }
    }

    setCart(prevCart =>
        prevCart.map(item =>
            item.id === itemId ? { ...item, itemDiscount: validatedDiscountForItem } : item
        )
    );
    return inputWasInvalid;
  }, [cart, toast]);

  const onClearCart = useCallback(() => { setCart([]); }, []);
  const handleCreateInvoice = useCallback(async (customerName: string, invoiceCartItems: CartItem[], subtotalAfterItemDiscounts: number, paymentMethod: string, amountPaid: number, isGuestCustomer: boolean, employeeId: string, employeeName: string) => {
    try {
      const finalTotal = subtotalAfterItemDiscounts;
      let calculatedDebtAmount = 0;

      if (finalTotal < 0) {
        toast({ title: "Lỗi tính toán", description: "Tổng tiền sau giảm giá không thể âm. Vui lòng kiểm tra lại giảm giá.", variant: "destructive", });
        return false;
      }

      if (finalTotal > amountPaid) {
        calculatedDebtAmount = finalTotal - amountPaid;
        if (isGuestCustomer || paymentMethod === 'Chuyển khoản') {
          toast({ title: "Lỗi thanh toán", description: "Khách lẻ hoặc thanh toán bằng Chuyển khoản không được phép nợ. Vui lòng thanh toán đủ số tiền.", variant: "destructive", });
          return false;
        }
      }
      const newInvoiceRef = push(ref(db, 'invoices'));
      const invoiceId = newInvoiceRef.key;
      if (!invoiceId) {
        throw new Error("Không thể tạo ID cho hóa đơn mới.");
      }
      const itemsForDb: InvoiceCartItem[] = invoiceCartItems.map(item => ({ id: item.id, name: item.name, quality: item.quality, quantityInCart: item.quantityInCart, price: item.price, costPrice: item.costPrice ?? 0, image: item.image, color: item.color, size: item.size, unit: item.unit, itemDiscount: item.itemDiscount || 0, maxDiscountPerUnitVND: item.maxDiscountPerUnitVND }));
      const newInvoiceData: Omit<Invoice, 'id'> = {
        customerName,
        items: itemsForDb,
        total: finalTotal,
        date: new Date().toISOString(),
        paymentMethod,
        discount: 0,
        amountPaid,
        employeeId,
        employeeName: employeeName || 'Không rõ',
        ...(calculatedDebtAmount > 0 && { debtAmount: calculatedDebtAmount }),
      };
      await set(newInvoiceRef, newInvoiceData);
      if (calculatedDebtAmount > 0) {
        const newDebtRef = push(ref(db, 'debts'));
        const newDebt: Omit<Debt, 'id'> = { supplier: customerName, amount: calculatedDebtAmount, date: new Date().toISOString(), status: 'Chưa thanh toán', invoiceId: invoiceId, createdEmployeeId: employeeId, createdEmployeeName: employeeName || 'Không rõ', };
        await set(newDebtRef, newDebt);
      }
      const updates: { [key: string]: any } = {};
      for (const cartItem of invoiceCartItems) {
        const productSnapshot = await get(child(ref(db), `inventory/${cartItem.id}`));
        if (productSnapshot.exists()) {
          const currentQuantity = productSnapshot.val().quantity;
          updates[`inventory/${cartItem.id}/quantity`] = currentQuantity - cartItem.quantityInCart;
        } else {
          throw new Error(`Sản phẩm ID ${cartItem.id} không tồn tại để cập nhật số lượng.`);
        }
      }
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
      toast({ title: "Thành công", description: "Hóa đơn đã được tạo và kho đã cập nhật.", variant: "default" });
      onClearCart();
      return true;
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({ title: "Lỗi", description: `Không thể tạo hóa đơn: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
      return false;
    }
  }, [toast, onClearCart]);

  const handleProcessInvoiceCancellationOrReturn = useCallback(async (invoiceId: string, operationType: 'delete' | 'return', itemsToReturnArray?: Array<{ productId: string; name: string; quantityToReturn: number }>) => {
    const canPerformOperation = operationType === 'delete' ? hasFullAccessRights : true;
    if (!canPerformOperation) {
      toast({ title: "Không có quyền", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive" });
      return false;
    }

    try {
      const invoiceSnapshot = await get(child(ref(db), `invoices/${invoiceId}`));
      if (!invoiceSnapshot.exists()) {
        toast({ title: "Lỗi", description: "Không tìm thấy hóa đơn để xử lý.", variant: "destructive" });
        return false;
      }
      const originalInvoice = { id: invoiceId, ...invoiceSnapshot.val() } as Invoice;
      const updates: { [key: string]: any } = {};
      const deleteAssociatedDebtIfNeeded = async () => {
        if (originalInvoice.debtAmount && originalInvoice.debtAmount > 0) {
          const debtsQueryRef = ref(db, 'debts');
          const debtsSnapshot = await get(debtsQueryRef);
          if (debtsSnapshot.exists()) {
            const allDebts = debtsSnapshot.val();
            for (const debtId in allDebts) {
              if (allDebts[debtId].invoiceId === invoiceId) {
                updates[`debts/${debtId}`] = null;
                break;
              }
            }
          }
        }
      };

      if (operationType === 'delete' || (operationType === 'return' && (!itemsToReturnArray || itemsToReturnArray.length === 0))) {
        for (const invoiceItem of originalInvoice.items) {
          const productRef = child(ref(db), `inventory/${invoiceItem.id}`);
          const productSnapshot = await get(productRef);
          if (productSnapshot.exists()) {
            updates[`inventory/${invoiceItem.id}/quantity`] = productSnapshot.val().quantity + invoiceItem.quantityInCart;
          } else {
            console.warn(`Sản phẩm ID ${invoiceItem.id} (tên: ${invoiceItem.name}) trong hóa đơn ${invoiceId} không còn tồn tại trong kho. Không thể hoàn kho cho sản phẩm này.`);
          }
        }
        updates[`invoices/${invoiceId}`] = null;
        await deleteAssociatedDebtIfNeeded();
        await update(ref(db), updates);
        const message = operationType === 'delete' ? "Hóa đơn đã được xóa và các sản phẩm (nếu còn) đã hoàn kho." : "Hoàn trả toàn bộ hóa đơn thành công, sản phẩm (nếu còn) đã hoàn kho.";
        if (originalInvoice.debtAmount && originalInvoice.debtAmount > 0) {
          toast({ title: "Thành công", description: `${message} Công nợ liên quan (nếu có) đã được xóa.`, variant: "default" });
        } else {
          toast({ title: "Thành công", description: message, variant: "default" });
        }
        return true;
      } else if (operationType === 'return' && itemsToReturnArray && itemsToReturnArray.length > 0) {
        for (const itemToReturn of itemsToReturnArray) {
          if (itemToReturn.quantityToReturn > 0) {
            const productRef = child(ref(db), `inventory/${itemToReturn.productId}`);
            const productSnapshot = await get(productRef);
            if (productSnapshot.exists()) {
              updates[`inventory/${itemToReturn.productId}/quantity`] = productSnapshot.val().quantity + itemToReturn.quantityToReturn;
            } else {
              console.warn(`Sản phẩm ID ${itemToReturn.productId} (tên: ${itemToReturn.name}) dự kiến hoàn trả từ hóa đơn ${invoiceId} không còn tồn tại trong kho. Không thể hoàn kho cho sản phẩm này.`);
            }
          }
        }
        const newInvoiceItems: InvoiceCartItem[] = [];
        let newSubtotalAfterItemDiscounts = 0;
        for (const originalItem of originalInvoice.items) {
          const returnedItemInfo = itemsToReturnArray.find(rt => rt.productId === originalItem.id);
          const quantityReturned = returnedItemInfo ? returnedItemInfo.quantityToReturn : 0;
          const remainingQuantityInCart = originalItem.quantityInCart - quantityReturned;
          if (remainingQuantityInCart > 0) {
            const newItem: InvoiceCartItem = { ...originalItem, quantityInCart: remainingQuantityInCart, };
            newInvoiceItems.push(newItem);
            newSubtotalAfterItemDiscounts += (newItem.price * remainingQuantityInCart) - (newItem.itemDiscount || 0);
          }
        }

        const newFinalTotal = newSubtotalAfterItemDiscounts;

        if (newInvoiceItems.length === 0 || newFinalTotal <= 0) {
          updates[`invoices/${invoiceId}`] = null;
          await deleteAssociatedDebtIfNeeded();
          await update(ref(db), updates);
          toast({ title: "Thành công", description: "Tất cả sản phẩm đã được hoàn trả, hóa đơn và công nợ liên quan (nếu có) đã được xóa.", variant: "default" });
        } else {
          updates[`invoices/${invoiceId}/items`] = newInvoiceItems;
          updates[`invoices/${invoiceId}/total`] = newFinalTotal;
          updates[`invoices/${invoiceId}/discount`] = 0;
          toast({ title: "Thành công", description: "Hoàn trả một phần thành công, kho và hóa đơn đã cập nhật. Công nợ gốc (nếu có) không thay đổi trừ khi được xử lý riêng.", variant: "default" });
        }
        await update(ref(db), updates);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error processing invoice ${operationType} for ID ${invoiceId}:`, error);
      const errorMessage = operationType === 'delete' ? "Không thể xóa hóa đơn." : "Không thể xử lý hoàn trả.";
      toast({ title: "Lỗi", description: `${errorMessage} Vui lòng thử lại. ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
      return false;
    }
  }, [toast, hasFullAccessRights]);

  const handleImportProducts = useCallback(async (supplierName: string | undefined, itemsToProcess: SubmitItemToImport[], totalImportCostVND: number, employeeId: string, employeeName: string) => { try { const newDebtRef = push(ref(db, 'debts')); const newDebt: Omit<Debt, 'id'> = { supplier: supplierName || "Nhà cung cấp không xác định", amount: totalImportCostVND, date: new Date().toISOString(), status: 'Chưa thanh toán', createdEmployeeId: employeeId, createdEmployeeName: employeeName || 'Không rõ', }; await set(newDebtRef, newDebt); const updates: { [key: string]: any } = {}; for (const importItem of itemsToProcess) { const productSnapshot = await get(child(ref(db), `inventory/${importItem.productId}`)); if (productSnapshot.exists()) { const currentProduct = productSnapshot.val(); updates[`inventory/${importItem.productId}/quantity`] = currentProduct.quantity + importItem.quantity; updates[`inventory/${importItem.productId}/costPrice`] = importItem.cost * 1000; } else { console.warn(`Sản phẩm ID ${importItem.productId} không tìm thấy trong kho khi nhập hàng. Bỏ qua cập nhật số lượng và giá vốn cho sản phẩm này.`); } } if (Object.keys(updates).length > 0) { await update(ref(db), updates); } toast({ title: "Thành công", description: "Nhập hàng thành công, công nợ và kho đã cập nhật.", variant: "default" }); return true; } catch (error) { console.error("Error importing products:", error); toast({ title: "Lỗi", description: "Không thể nhập hàng. Vui lòng thử lại.", variant: "destructive" }); return false; } }, [toast]);
  const handleUpdateDebtStatus = useCallback(async (debtId: string, newStatus: 'Chưa thanh toán' | 'Đã thanh toán', employeeId: string, employeeName: string, isUndoOperation: boolean = false) => { try { const debtRef = ref(db, `debts/${debtId}`); const snapshot = await get(debtRef); if (!snapshot.exists()) { toast({ title: "Lỗi", description: "Không tìm thấy công nợ.", variant: "destructive" }); return; } const originalDebt = snapshot.val() as Debt; const originalStatus = originalDebt.status; const updates: { [key: string]: any } = {}; updates[`debts/${debtId}/status`] = newStatus; if (!isUndoOperation) { updates[`debts/${debtId}/lastUpdatedEmployeeId`] = employeeId; updates[`debts/${debtId}/lastUpdatedEmployeeName`] = employeeName || 'Không rõ'; } else { updates[`debts/${debtId}/lastUpdatedEmployeeId`] = employeeId; updates[`debts/${debtId}/lastUpdatedEmployeeName`] = employeeName || 'Không rõ'; } if (originalDebt.invoiceId) { const invoiceRef = ref(db, `invoices/${originalDebt.invoiceId}`); const invoiceSnapshot = await get(invoiceRef); if (invoiceSnapshot.exists()) { const currentInvoice = invoiceSnapshot.val() as Invoice; if (newStatus === 'Đã thanh toán' && !isUndoOperation) { updates[`invoices/${originalDebt.invoiceId}/debtAmount`] = 0; updates[`invoices/${originalDebt.invoiceId}/amountPaid`] = currentInvoice.total; } else if (newStatus === 'Chưa thanh toán' && isUndoOperation) { updates[`invoices/${originalDebt.invoiceId}/debtAmount`] = originalDebt.amount; updates[`invoices/${originalDebt.invoiceId}/amountPaid`] = currentInvoice.total - originalDebt.amount; } } else { console.warn(`Invoice ${originalDebt.invoiceId} not found when updating debt ${debtId}`); } } await update(ref(db), updates); if (!isUndoOperation) { toast({ title: "Thành công", description: "Trạng thái công nợ đã được cập nhật.", variant: "default", }); } else { toast({ title: "Hoàn tác thành công", description: `Trạng thái công nợ đã được đổi lại thành "${originalStatus}".`, variant: "default", }); } } catch (error) { console.error("Error updating debt status:", error); toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái công nợ.", variant: "destructive" }); } }, [toast]);
  const handleAddProductOption = useCallback(async (type: ProductOptionType, name: string) => { if (!name.trim()) { toast({ title: "Lỗi", description: "Tên tùy chọn không được để trống.", variant: "destructive" }); return; } try { const sanitizedName = name.trim().replace(/[.#$[\]]/g, '_'); if (sanitizedName !== name.trim()) { toast({ title: "Cảnh báo", description: "Tên tùy chọn đã được chuẩn hóa để loại bỏ ký tự không hợp lệ.", variant: "default" }); } if (!sanitizedName) { toast({ title: "Lỗi", description: "Tên tùy chọn sau khi chuẩn hóa không hợp lệ.", variant: "destructive" }); return; } await set(ref(db, `productOptions/${type}/${sanitizedName}`), true); toast({ title: "Thành công", description: `Tùy chọn ${sanitizedName} đã được thêm.`, variant: "default" }); } catch (error) { console.error(`Error adding product ${type} option:`, error); toast({ title: "Lỗi", description: `Không thể thêm tùy chọn ${type}.`, variant: "destructive" }); } }, [toast]);
  const handleDeleteProductOption = useCallback(async (type: ProductOptionType, name: string) => { if (!hasFullAccessRights) { toast({ title: "Không có quyền", description: "Bạn không có quyền xóa tùy chọn sản phẩm.", variant: "destructive" }); return; } try { await remove(ref(db, `productOptions/${type}/${name}`)); toast({ title: "Thành công", description: `Tùy chọn ${name} đã được xóa.`, variant: "default" }); } catch (error) { console.error(`Error deleting product ${type} option:`, error); toast({ title: "Lỗi", description: `Không thể xóa tùy chọn ${type}.`, variant: "destructive" }); } }, [toast, hasFullAccessRights]);
  const handleSaveShopInfo = async (newInfo: ShopInfo) => { if (!hasFullAccessRights) { toast({ title: "Lỗi", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive" }); throw new Error("Permission denied"); } try { await set(ref(db, 'shopInfo'), newInfo); toast({ title: "Thành công", description: "Thông tin cửa hàng đã được cập nhật." }); } catch (error: any) { console.error("Error updating shop info:", error); toast({ title: "Lỗi", description: "Không thể cập nhật thông tin cửa hàng: " + error.message, variant: "destructive" }); throw error; } };
  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fleur-manager-cart');
        localStorage.removeItem('fleur-manager-active-tab');
      }
      await signOut();
      router.push('/login');
      toast({ title: "Đã đăng xuất", description: "Bạn đã đăng xuất thành công.", variant: "default" });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ title: "Lỗi đăng xuất", description: "Không thể đăng xuất. Vui lòng thử lại.", variant: "destructive" });
    }
  };
  const handleNameSet = async (inputName: string) => { if (!currentUser) return; const isSuperAdminEmail = currentUser.email === ADMIN_EMAIL; const employeeName = isSuperAdminEmail ? ADMIN_NAME : inputName; try { await updateUserProfileName(employeeName); if (isSuperAdminEmail) { const employeeRef = ref(db, `employees/${currentUser.uid}`); const currentEmployeeSnap = await get(employeeRef); if (!currentEmployeeSnap.exists() || currentEmployeeSnap.val().position !== 'ADMIN') { await set(employeeRef, { name: ADMIN_NAME, email: ADMIN_EMAIL, position: 'ADMIN' }); } } setIsSettingName(false); } catch (error) { console.error("Error in onNameSet:", error); toast({ title: "Lỗi", description: "Không thể cập nhật thông tin.", variant: "destructive" }); } };

  const handleDeleteDebt = (debtId: string) => {
    const debt = debtsData.find(d => d.id === debtId);
    if (debt) {
      setDebtToDelete(debt);
      setIsConfirmingDebtDelete(true);
    } else {
      toast({ title: "Lỗi", description: "Không tìm thấy công nợ để xóa.", variant: "destructive" });
    }
  };

  const handleConfirmDeleteDebt = async () => {
    if (!debtToDelete) return;
     if (!isCurrentUserAdmin) {
      toast({ title: "Không có quyền", description: "Bạn không có quyền xóa công nợ.", variant: "destructive" });
      setIsConfirmingDebtDelete(false);
      setDebtToDelete(null);
      return;
    }
    try {
      if (debtToDelete.invoiceId) {
        const invoiceRef = ref(db, `invoices/${debtToDelete.invoiceId}`);
        const invoiceSnapshot = await get(invoiceRef);
        if (invoiceSnapshot.exists()) {
          const invoiceData = invoiceSnapshot.val() as Invoice;
          if (invoiceData.debtAmount && invoiceData.debtAmount === debtToDelete.amount) {
            await update(invoiceRef, { debtAmount: 0 });
          }
        }
      }
      await remove(ref(db, `debts/${debtToDelete.id}`));
      toast({ title: "Thành công", description: `Công nợ cho "${debtToDelete.supplier}" đã được xóa.`, variant: "default" });
    } catch (error) {
      console.error("Error deleting debt:", error);
      toast({ title: "Lỗi", description: "Không thể xóa công nợ. Vui lòng thử lại.", variant: "destructive" });
    } finally {
      setIsConfirmingDebtDelete(false);
      setDebtToDelete(null);
    }
  };

  const handleUpdateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus, currentEmployeeId: string, currentEmployeeName: string) => {
    try {
        const orderToUpdate = ordersData.find(o => o.id === orderId);
        if (!orderToUpdate) {
            toast({ title: "Lỗi", description: "Không tìm thấy đơn hàng để cập nhật.", variant: "destructive" });
            return;
        }

        const updates: Record<string, any> = {};

        if (newStatus === 'Hoàn thành') {
            if (orderToUpdate.orderStatus === 'Hoàn thành') {
                toast({ title: "Thông báo", description: "Đơn hàng đã được hoàn thành trước đó.", variant: "default" });
                return;
            }

            // 1. Check inventory and prepare updates
            for (const item of orderToUpdate.items) {
                const productRef = ref(db, `inventory/${item.id}`);
                const productSnapshot = await get(productRef);
                if (productSnapshot.exists()) {
                    const currentQuantity = productSnapshot.val().quantity;
                    const newQuantity = currentQuantity - item.quantityInCart;
                    if (newQuantity < 0) {
                        toast({
                            title: "Lỗi tồn kho",
                            description: `Không đủ số lượng cho sản phẩm "${item.name}". Chỉ còn ${currentQuantity} trong kho.`,
                            variant: "destructive",
                            duration: 5000
                        });
                        return; // Stop the process
                    }
                    updates[`inventory/${item.id}/quantity`] = newQuantity;
                } else {
                    toast({
                        title: "Lỗi sản phẩm",
                        description: `Sản phẩm "${item.name}" (ID: ${item.id}) không còn tồn tại trong kho.`,
                        variant: "destructive",
                        duration: 5000
                    });
                    return; // Stop the process
                }
            }
            
            // 2. Create Invoice data
            const newInvoiceRef = push(ref(db, 'invoices'));
            const newInvoiceId = newInvoiceRef.key;
            if (!newInvoiceId) throw new Error("Could not generate new invoice ID.");
            
            const invoiceData: Omit<Invoice, 'id'> = {
                customerName: orderToUpdate.customerName,
                items: orderToUpdate.items.map(item => ({...item, itemDiscount: item.itemDiscount || 0})),
                total: orderToUpdate.totalAmount,
                date: new Date().toISOString(),
                paymentMethod: 'Chuyển khoản', // Defaulting since order doesn't specify payment yet
                discount: orderToUpdate.overallDiscount || 0,
                amountPaid: orderToUpdate.totalAmount, // Assuming fully paid on completion
                debtAmount: 0,
                employeeId: currentEmployeeId,
                employeeName: currentEmployeeName,
            };

            // Add invoice creation to updates
            updates[`invoices/${newInvoiceId}`] = invoiceData;

            // 3. Mark order for deletion
            updates[`orders/${orderId}`] = null;
            
            // 4. Atomically execute all updates
            await update(ref(db), updates);
            toast({ title: "Thành công", description: `Đơn hàng #${orderId.substring(0,6)}... đã được hoàn tất và chuyển thành hóa đơn.` });

        } else { // Handle other statuses: 'Chờ xác nhận', 'Yêu cầu hủy', 'Đã hủy'
            updates[`orders/${orderId}/orderStatus`] = newStatus;
            updates[`orders/${orderId}/updatedBy`] = currentEmployeeId;
            updates[`orders/${orderId}/updatedAt`] = new Date().toISOString();
            
            await update(ref(db), updates);
            toast({ title: "Thành công", description: `Trạng thái đơn hàng #${orderId.substring(0,6)}... đã được cập nhật thành "${newStatus}".` });
        }

    } catch (error) {
        console.error("Error updating order status:", error);
        toast({ title: "Lỗi", description: `Không thể cập nhật trạng thái đơn hàng: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    }
  }, [toast, ordersData]);

  const handleToggleEmployeeRole = async (employeeId: string, currentPosition: EmployeePosition) => {
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      toast({ title: "Lỗi", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive" });
      return;
    }
    const targetEmployee = employeesData.find(emp => emp.id === employeeId);
    if (!targetEmployee || targetEmployee.email === ADMIN_EMAIL) {
      toast({ title: "Lỗi", description: "Không thể thay đổi vai trò của tài khoản này.", variant: "destructive" });
      return;
    }

    let newPosition: EmployeePosition;
    if (currentPosition === 'Nhân viên') {
      newPosition = 'Quản lý';
    } else if (currentPosition === 'Quản lý') {
      newPosition = 'Nhân viên';
    } else {
      toast({ title: "Lỗi", description: "Thao tác không hợp lệ cho vai trò hiện tại.", variant: "destructive" });
      return;
    }

    try {
      await update(ref(db, `employees/${employeeId}`), { position: newPosition });
      toast({
        title: "Thành công",
        description: `Đã cập nhật vai trò của ${targetEmployee.name} thành ${newPosition}.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error toggling employee role:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật vai trò nhân viên.", variant: "destructive" });
    }
  };

  const handleUpdateEmployeeInfo = async (employeeId: string, data: { name: string; phone?: string; zaloName?: string; }) => {
    if (!isCurrentUserAdmin) {
      toast({ title: "Lỗi", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive" });
      return;
    }
    const targetEmployee = employeesData.find(emp => emp.id === employeeId);
    if (!targetEmployee || targetEmployee.email === ADMIN_EMAIL) {
      toast({ title: "Lỗi", description: "Không thể chỉnh sửa thông tin của tài khoản này.", variant: "destructive" });
      return;
    }

    try {
      const updates: Partial<Employee> = { name: data.name };
      if (data.phone !== undefined) updates.phone = data.phone;
      if (data.zaloName !== undefined) updates.zaloName = data.zaloName;

      await update(ref(db, `employees/${employeeId}`), updates);

      if (currentUser && employeeId === currentUser.uid && data.name !== currentUser.displayName) {
         await updateUserProfileName(data.name);
      }

      toast({ title: "Thành công", description: `Thông tin của ${data.name} đã được cập nhật.` });
    } catch (error) {
      console.error("Error updating employee info:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật thông tin nhân viên.", variant: "destructive" });
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!isCurrentUserAdmin) {
      toast({ title: "Lỗi", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive" });
      return;
    }
    const targetEmployee = employeesData.find(emp => emp.id === employeeId);
    if (!targetEmployee || targetEmployee.email === ADMIN_EMAIL) {
      toast({ title: "Lỗi", description: "Không thể xóa tài khoản này.", variant: "destructive" });
      return;
    }

    try {
      const updates: Record<string, any> = {};
      updates[`employees/${employeeId}`] = null;
      updates[`userAccessRequests/${employeeId}`] = null;

      await update(ref(db), updates);
      toast({ title: "Thành công", description: `Nhân viên ${targetEmployee.name} đã được xóa.` });
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({ title: "Lỗi", description: "Không thể xóa nhân viên. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const handleDisposeProductItems = useCallback(async (
    productId: string,
    quantityToDecrease: number,
    reason: string,
    productDetails: Pick<Product, 'name' | 'color' | 'quality' | 'size' | 'unit' | 'image'>,
    employeeId: string,
    employeeName: string
  ) => {
    if (!hasFullAccessRights) {
      toast({ title: "Không có quyền", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive" });
      return;
    }
    try {
      const productRef = ref(db, `inventory/${productId}`);
      const productSnapshot = await get(productRef);
      if (productSnapshot.exists()) {
        const currentProduct = productSnapshot.val() as Product;
        const newQuantity = currentProduct.quantity - quantityToDecrease;
        if (newQuantity < 0) {
          toast({ title: "Lỗi", description: "Số lượng loại bỏ vượt quá tồn kho.", variant: "destructive" });
          return;
        }
        await update(productRef, { quantity: newQuantity });


        const newDisposalLogRef = push(ref(db, 'disposalLog'));
        const logEntry: Omit<DisposalLogEntry, 'id'> = {
          productId,
          productName: productDetails.name,
          color: productDetails.color,
          quality: productDetails.quality,
          size: productDetails.size,
          unit: productDetails.unit,
          image: productDetails.image,
          quantityDisposed: quantityToDecrease,
          reason: reason || 'Không có lý do',
          disposalDate: new Date().toISOString(),
          employeeId,
          employeeName,
        };
        await set(newDisposalLogRef, logEntry);

        toast({ title: "Thành công", description: `Đã loại bỏ ${quantityToDecrease} ${currentProduct.unit} ${currentProduct.name}. Lý do: ${reason || 'Không có lý do'}. Kho và nhật ký đã cập nhật.`, variant: "default" });

      } else {
        throw new Error(`Sản phẩm ID ${productId} không tồn tại để cập nhật số lượng.`);
      }
    } catch (error) {
      console.error("Error disposing product items:", error);
      toast({ title: "Lỗi", description: `Không thể loại bỏ sản phẩm: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    }
  }, [toast, hasFullAccessRights]);

  const onAddToCartForCustomer = useCallback((product: Product, quantity: number, notes: string) => {
      if (product.quantity <= 0) {
          toast({ title: "Hết hàng", description: `Sản phẩm "${product.name}" đã hết hàng!`, variant: "destructive" });
          return;
      }
      setCustomerCart(prevCart => {
          const existingItem = prevCart.find(cartItem => cartItem.id === product.id);
          if (existingItem) {
              const newQuantity = existingItem.quantityInCart + quantity;
              if (newQuantity <= product.quantity) {
                  return prevCart.map(cartItem =>
                      cartItem.id === product.id
                          ? { ...cartItem, quantityInCart: newQuantity, notes: notes || cartItem.notes }
                          : cartItem
                  );
              } else {
                   toast({ title: "Số lượng tối đa", description: `Không đủ số lượng "${product.name}" trong kho (Còn: ${product.quantity}).`, variant: "destructive" });
                   return prevCart;
              }
          }
          return [...prevCart, { ...product, quantityInCart: quantity, itemDiscount: 0, notes }];
      });
      toast({
          title: "Đã thêm vào giỏ",
          description: `Đã thêm ${quantity} "${product.name}" vào giỏ hàng.`,
          variant: 'default',
      });
  }, [toast]);

  const onUpdateCustomerCartQuantity = useCallback((itemId: string, newQuantityStr: string) => {
    if (newQuantityStr.trim() === '') {
      setCustomerCart(prev => prev.map(item => item.id === itemId ? { ...item, quantityInCart: 0 } : item));
      return;
    }
    
    const newQuantity = parseInt(newQuantityStr, 10);
    if (isNaN(newQuantity)) return; // Invalid text like 'abc'

    if (newQuantity <= 0) {
        setCustomerCart(prev => prev.filter(item => item.id !== itemId));
        return;
    }

    const stockItem = inventory.find(i => i.id === itemId);
    const stockQuantity = stockItem?.quantity ?? 0;

    if (newQuantity > stockQuantity) {
        toast({ title: "Số lượng không đủ", description: `Chỉ còn ${stockQuantity} sản phẩm trong kho.`, variant: "destructive" });
        setCustomerCart(prev => prev.map(item => item.id === itemId ? { ...item, quantityInCart: stockQuantity } : item));
    } else {
        setCustomerCart(prev => prev.map(item => item.id === itemId ? { ...item, quantityInCart: newQuantity } : item));
    }
  }, [inventory, toast]);

  const onRemoveFromCustomerCart = useCallback((itemId: string) => {
      setCustomerCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleConfirmOrderFromCart = async () => {
    if (customerCart.length === 0) {
        toast({ title: "Lỗi", description: "Giỏ hàng của bạn đang trống.", variant: "destructive" });
        return;
    }
    for (const item of customerCart) {
        const stockItem = inventory.find(i => i.id === item.id);
        if (!stockItem || item.quantityInCart > stockItem.quantity) {
            toast({ title: "Lỗi tồn kho", description: `Sản phẩm "${item.name}" không đủ số lượng. Vui lòng kiểm tra lại giỏ hàng.`, variant: "destructive" });
            return;
        }
    }

    if (!currentUser || !isCurrentUserCustomer) return;

    const customerData = customersData.find(c => c.id === currentUser.uid);
    if (!customerData) {
        toast({ title: "Lỗi", description: "Không tìm thấy thông tin khách hàng của bạn.", variant: "destructive" });
        return;
    }

    const orderItems: OrderItem[] = customerCart.map(item => ({
        id: item.id,
        name: item.name,
        quality: item.quality,
        price: item.price,
        costPrice: item.costPrice,
        image: item.image,
        color: item.color,
        size: item.size,
        unit: item.unit,
        quantityInCart: item.quantityInCart,
        itemDiscount: 0,
        notes: item.notes,
    }));

    const subTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantityInCart), 0);

    const newOrderData: Omit<Order, 'id'> = {
        orderNumber: `DH-${Date.now().toString().slice(-8)}`,
        customerId: currentUser.uid,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerAddress: customerData.address || '',
        customerZaloName: customerData.zaloName || '',
        items: orderItems,
        subTotal: subTotal,
        shippingFee: 0,
        totalAmount: subTotal,
        paymentMethod: 'Chuyển khoản',
        paymentStatus: 'Chưa thanh toán',
        orderStatus: 'Chờ xác nhận',
        orderDate: new Date().toISOString(),
    };
    
    try {
        const newOrderRef = push(ref(db, 'orders'));
        await set(newOrderRef, newOrderData);

        toast({ title: "Thành công!", description: "Đơn hàng của bạn đã được đặt. Vui lòng chờ nhân viên cửa hàng xác nhận." });
        setIsCartSheetOpen(false);
        setCustomerCart([]);
    } catch (error) {
        console.error("Error placing order:", error);
        toast({ title: "Lỗi", description: "Không thể đặt hàng. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const handleOpenNoteEditor = (itemId: string) => {
    const item = customerCart.find(i => i.id === itemId);
    if (item) {
        setEditingNoteItemId(itemId);
        setItemNoteContent(item.notes || '');
        setIsNoteEditorOpen(true);
    }
  };

  const handleSaveItemNote = () => {
    if (!editingNoteItemId) return;
    setCustomerCart(prevCart => 
        prevCart.map(item => 
            item.id === editingNoteItemId ? { ...item, notes: itemNoteContent.trim() } : item
        )
    );
    setIsNoteEditorOpen(false);
    setEditingNoteItemId(null);
    setItemNoteContent('');
  };

  const handleAddToStorefront = useCallback(async (productId: string) => {
    try {
        await set(ref(db, `storefrontProducts/${productId}`), true);
        toast({ title: "Thành công", description: "Sản phẩm đã được thêm vào gian hàng." });
    } catch (error) {
        toast({ title: "Lỗi", description: "Không thể thêm sản phẩm vào gian hàng.", variant: "destructive" });
    }
  }, [toast]);

  const handleRemoveFromStorefront = useCallback(async (productId: string) => {
      try {
          await remove(ref(db, `storefrontProducts/${productId}`));
          toast({ title: "Thành công", description: "Sản phẩm đã được gỡ khỏi gian hàng." });
      } catch (error) {
          toast({ title: "Lỗi", description: "Không thể gỡ sản phẩm khỏi gian hàng.", variant: "destructive" });
      }
  }, [toast]);


  useEffect(() => {
    if (isCurrentUserCustomer) {
      setActiveTab('Gian hàng');
    }
  }, [isCurrentUserCustomer]);

  useEffect(() => {
    if (currentUserEmployeeData?.position === 'Nhân viên' && (activeTab === 'Nhân viên' || activeTab === 'Doanh thu')) {
        setActiveTab('Bán hàng');
        toast({ title: "Thông báo", description: "Bạn không có quyền truy cập vào tab này.", variant: "default" });
    }
  }, [activeTab, currentUserEmployeeData, toast]);

  const handleOpenOrderDialog = (productGroup: Product[]) => {
    setSelectedProductGroupForOrder(productGroup);
    setIsOrderDialogOpen(true);
  };

  // --- Conditional Rendering Logic ---
  if (authLoading) return <LoadingScreen message="Đang tải ứng dụng..." />;
  if (!currentUser) return <LoadingScreen message="Đang chuyển hướng đến trang đăng nhập..." />;
  if (isSettingName) return <SetNameDialog onNameSet={handleNameSet} />;
  
  if (isLoadingAccessRequest) {
      return <LoadingScreen message="Đang kiểm tra quyền truy cập..." />;
  }

  if (currentUserEmployeeData || isCurrentUserAdmin || isCurrentUserCustomer) {
    return (
      <SidebarProvider>
        <FleurManagerLayoutContent
          currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} inventory={inventory}
          customersData={customersData} ordersData={ordersData} invoicesData={invoicesData} debtsData={debtsData}
          employeesData={employeesData} disposalLogEntries={disposalLogEntries} shopInfo={shopInfo} isLoadingShopInfo={isLoadingShopInfo}
          cart={cart} customerCart={customerCart} productNameOptions={productNameOptions} colorOptions={colorOptions} productQualityOptions={productQualityOptions}
          sizeOptions={sizeOptions} unitOptions={unitOptions} storefrontProducts={storefrontProducts} storefrontProductIds={storefrontProductIds} revenueFilter={revenueFilter} invoiceFilter={invoiceFilter}
          debtFilter={debtFilter} orderFilter={orderFilter} isUserInfoDialogOpen={isUserInfoDialogOpen}
          setIsUserInfoDialogOpen={setIsUserInfoDialogOpen} isScreenLocked={isScreenLocked} setIsScreenLocked={setIsScreenLocked}
          isSettingsDialogOpen={isSettingsDialogOpen} setIsSettingsDialogOpen={setIsSettingsDialogOpen}
          overallFontSize={overallFontSize} setOverallFontSize={setOverallFontSize} numericDisplaySize={numericDisplaySize}
          setNumericDisplaySize={setNumericDisplaySize} isCurrentUserAdmin={isCurrentUserAdmin}
          currentUserEmployeeData={currentUserEmployeeData} isCurrentUserCustomer={isCurrentUserCustomer} hasFullAccessRights={hasFullAccessRights}
          filteredInvoicesForRevenue={filteredInvoicesForRevenue}
          filteredInvoicesForInvoiceTab={filteredInvoicesForInvoiceTab}
          filteredDebtsForDebtTab={filteredDebtsForDebtTab} 
          filteredOrdersForOrderTab={filteredOrdersForOrderTab}
          handleCreateInvoice={handleCreateInvoice} handleAddProductOption={handleAddProductOption}
          handleDeleteProductOption={handleDeleteProductOption} handleImportProducts={handleImportProducts}
          handleProcessInvoiceCancellationOrReturn={handleProcessInvoiceCancellationOrReturn}
          handleUpdateDebtStatus={handleUpdateDebtStatus} handleAddCustomer={handleAddCustomer}
          handleUpdateCustomer={handleUpdateCustomer} handleDeleteCustomer={handleDeleteCustomer}
          handleDeleteDebt={handleDeleteDebt} handleSaveShopInfo={handleSaveShopInfo} handleSignOut={handleSignOut}
          signIn={signIn} onAddToCart={onAddToCart} onUpdateCartQuantity={onUpdateCartQuantity}
          onItemDiscountChange={onItemDiscountChange} onClearCart={onClearCart} onRemoveFromCart={onRemoveFromCart} onAddToCartForCustomer={onAddToCartForCustomer}
          handleRevenueFilterChange={handleRevenueFilterChange} handleInvoiceFilterChange={handleInvoiceFilterChange}
          handleDebtFilterChange={handleDebtFilterChange} handleOrderFilterChange={handleOrderFilterChange}
          handleUpdateOrderStatus={handleUpdateOrderStatus} handleToggleEmployeeRole={handleToggleEmployeeRole}
          handleUpdateEmployeeInfo={handleUpdateEmployeeInfo} handleDeleteEmployee={handleDeleteEmployee}
          handleDisposeProductItems={handleDisposeProductItems} openAddProductDialog={handleOpenAddProductDialog}
          openEditProductDialog={handleOpenEditProductDialog} handleDeleteProductFromAnywhere={handleDeleteProductFromAnywhere}
          handleUpdateProductMaxDiscount={handleUpdateProductMaxDiscount}
          handleAddToStorefront={handleAddToStorefront}
          handleRemoveFromStorefront={handleRemoveFromStorefront}
          setIsCartSheetOpen={setIsCartSheetOpen}
          onOpenNoteEditor={handleOpenNoteEditor}
          onSelectProductGroupForOrder={handleOpenOrderDialog}
        />
        <ProductOrderDialog
          isOpen={isOrderDialogOpen}
          onClose={() => setIsOrderDialogOpen(false)}
          productGroup={selectedProductGroupForOrder}
          onAddToCart={onAddToCartForCustomer}
        />
        <CustomerCartSheet
            isOpen={isCartSheetOpen}
            onOpenChange={setIsCartSheetOpen}
            cart={customerCart}
            onUpdateQuantity={onUpdateCustomerCartQuantity}
            onRemoveItem={onRemoveFromCustomerCart}
            onPlaceOrder={handleConfirmOrderFromCart}
            inventory={inventory}
            onOpenNoteEditor={handleOpenNoteEditor}
        />
        <Dialog open={isNoteEditorOpen} onOpenChange={setIsNoteEditorOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm ghi chú cho sản phẩm</DialogTitle>
              <DialogDescription>
                  Thêm ghi chú riêng cho sản phẩm này. Ghi chú sẽ được gửi kèm trong đơn hàng.
              </DialogDescription>
            </DialogHeader>
            <Textarea 
                value={itemNoteContent} 
                onChange={(e) => setItemNoteContent(e.target.value)}
                placeholder="Ví dụ: Cắm hoa cao, gói giấy màu hồng..."
                className="min-h-[100px]"
            />
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsNoteEditorOpen(false)}>Hủy</Button>
                <Button onClick={handleSaveItemNote} className="bg-primary text-primary-foreground">Lưu ghi chú</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ProductFormDialog isOpen={isProductFormOpen} onClose={handleCloseProductFormDialog} onSubmit={handleProductFormSubmit} initialData={currentEditingProduct} productNameOptions={productNameOptions} colorOptions={colorOptions} productQualityOptions={productQualityOptions} sizeOptions={sizeOptions} unitOptions={unitOptions} isEditMode={isProductFormEditMode} defaultFormState={productFormDefaultState} />
        {productToDeleteId && (<AlertDialog open={isConfirmingProductDelete} onOpenChange={setIsConfirmingProductDelete}><AlertDialogContent><AlertDialogHeader><AlertDialogTitleComponent>Xác nhận xóa sản phẩm?</AlertDialogTitleComponent><AlertDialogDescription>Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setIsConfirmingProductDelete(false)}>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteProduct} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
        {debtToDelete && (<AlertDialog open={isConfirmingDebtDelete} onOpenChange={setIsConfirmingDebtDelete}><AlertDialogContent><AlertDialogHeader><AlertDialogTitleComponent>Xác nhận xóa công nợ?</AlertDialogTitleComponent><AlertDialogDescription>Bạn có chắc chắn muốn xóa công nợ cho "{debtToDelete.supplier}" trị giá {debtToDelete.amount.toLocaleString('vi-VN')} VNĐ không?{debtToDelete.invoiceId && " Nếu công nợ này được tạo từ hóa đơn, nó cũng sẽ được cập nhật trên hóa đơn đó."}Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setIsConfirmingDebtDelete(false)}>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDeleteDebt} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Xóa công nợ</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> )}
      </SidebarProvider>
    );
  }

  if (userAccessRequest) {
    const isRejected = 'status' in userAccessRequest && userAccessRequest.status === 'rejected';
     if (isRejected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <UserX className="w-16 h-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold mb-2 text-foreground">Yêu cầu đã bị từ chối</h1>
                <p className="text-muted-foreground">
                    Yêu cầu đăng ký của bạn đã bị từ chối.
                    {userAccessRequest.rejectionReason && ` Lý do: ${userAccessRequest.rejectionReason}.`}
                </p>
                <p className="text-muted-foreground">Vui lòng liên hệ quản trị viên hoặc đăng ký lại với thông tin chính xác.</p>
                <Button onClick={handleSignOut} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                  Đăng xuất và Đăng ký lại
                </Button>
            </div>
        );
    }
    // Otherwise, assume pending
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
        <HelpCircle className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-foreground">Yêu cầu đang chờ duyệt</h1>
        <p className="text-muted-foreground">Yêu cầu đăng ký của bạn đã được gửi.</p>
        <p className="text-muted-foreground">Vui lòng chờ quản trị viên phê duyệt. Bạn có thể cần phải đăng nhập lại sau khi yêu cầu được duyệt.</p>
        <Button onClick={handleSignOut} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">Đăng xuất</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
        <UserX className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-foreground">Không có quyền truy cập</h1>
        <p className="text-muted-foreground">
            Tài khoản của bạn không có quyền truy cập vào ứng dụng này.
        </p>
        <p className="text-muted-foreground">Vui lòng đăng ký tài khoản từ trang đăng nhập hoặc liên hệ quản trị viên.</p>
        <Button onClick={handleSignOut} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">Về trang đăng nhập</Button>
    </div>
);
}
    

    


    









    





    



    

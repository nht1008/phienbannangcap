
"use client";

import React, { useState, useMemo, ReactNode, useEffect, useCallback } from 'react';
import type { Product, Invoice, Debt, CartItem, ProductOptionType, Customer, Employee, ShopInfo } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuth, type AuthContextType } from '@/contexts/AuthContext';
import type { User } from 'firebase/auth';
import Image from 'next/image';

import { WarehouseIcon } from '@/components/icons/WarehouseIcon';
import { SellIcon } from '@/components/icons/SellIcon';
import { ImportIcon } from '@/components/icons/ImportIcon';
import { InvoiceIcon as InvoiceIconSvg } from '@/components/icons/InvoiceIcon';
import { DebtIcon } from '@/components/icons/DebtIcon';
import { RevenueIcon } from '@/components/icons/RevenueIcon';
import { CustomerIcon } from '@/components/icons/CustomerIcon';
import { EmployeeIcon } from '@/components/icons/EmployeeIcon';

import { SalesTab } from '@/components/tabs/SalesTab';
import { InventoryTab } from '@/components/tabs/InventoryTab';
import { ImportTab } from '@/components/tabs/ImportTab';
import { InvoiceTab } from '@/components/tabs/InvoiceTab';
import { DebtTab } from '@/components/tabs/DebtTab';
import { RevenueTab } from '@/components/tabs/RevenueTab';
import { CustomerTab } from '@/components/tabs/CustomerTab';
import { EmployeeTab } from '@/components/tabs/EmployeeTab';
import { SetNameDialog } from '@/components/auth/SetNameDialog';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { LockScreen } from '@/components/shared/LockScreen';
import { SettingsDialog, type OverallFontSize, type NumericDisplaySize } from '@/components/settings/SettingsDialog';
import { cn } from '@/lib/utils';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
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
import { PanelLeft, ChevronsLeft, ChevronsRight, LogOut, UserCircle, Settings, Lock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, push, update, get, child, remove } from "firebase/database";
import { useToast } from "@/hooks/use-toast";


interface SubmitItemToImport {
  productId: string;
  quantity: number;
  cost: number;
}


type TabName = 'Bán hàng' | 'Kho hàng' | 'Nhập hàng' | 'Hóa đơn' | 'Công nợ' | 'Doanh thu' | 'Khách hàng' | 'Nhân viên';

export interface DateFilter {
  day: string;
  month: string;
  year: string;
}

const getCurrentMonthYearFilter = (): DateFilter => {
  const now = new Date();
  return {
    day: 'all',
    month: (now.getMonth() + 1).toString(),
    year: now.getFullYear().toString(),
  };
};

const initialAllDateFilter: DateFilter = { day: 'all', month: 'all', year: 'all' };

const ADMIN_EMAIL = 'nthe1008@gmail.com';
const ADMIN_NAME = 'Thể';


export default function FleurManagerPage() {
  const { currentUser, loading: authLoading, signOut, updateUserProfileName, signIn } = useAuth() as AuthContextType;
  const router = useRouter();
  const { toast } = useToast();

  const [isSettingName, setIsSettingName] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>('Bán hàng');
  const [inventory, setInventory] = useState<Product[]>([]);
  const [customersData, setCustomersData] = useState<Customer[]>([]);
  const [invoicesData, setInvoicesData] = useState<Invoice[]>([]);
  const [debtsData, setDebtsData] = useState<Debt[]>([]);
  const [employeesData, setEmployeesData] = useState<Employee[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [productNameOptions, setProductNameOptions] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);

  const [revenueFilter, setRevenueFilter] = useState<DateFilter>(getCurrentMonthYearFilter());
  const [invoiceFilter, setInvoiceFilter] = useState<DateFilter>(initialAllDateFilter);
  const [debtFilter, setDebtFilter] = useState<DateFilter>(initialAllDateFilter);
  const [isUserInfoDialogOpen, setIsUserInfoDialogOpen] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);

  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [overallFontSize, setOverallFontSize] = useState<OverallFontSize>('md');
  const [numericDisplaySize, setNumericDisplaySize] = useState<NumericDisplaySize>('text-2xl');
  
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [isLoadingShopInfo, setIsLoadingShopInfo] = useState(false);
  const isAdmin = useMemo(() => currentUser?.email === ADMIN_EMAIL, [currentUser]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-overall-font-size', overallFontSize);
    }
  }, [overallFontSize]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (authLoading || !currentUser) return;

    const employeesRef = ref(db, 'employees');
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
        const data = snapshot.val();
        const loadedEmployees: Employee[] = [];
        if (data) {
            Object.keys(data).forEach(key => {
                loadedEmployees.push({ id: key, ...data[key] });
            });
        }

        const adminUser = loadedEmployees.find(emp => emp.email === ADMIN_EMAIL);
        let otherEmployees = loadedEmployees.filter(emp => emp.email !== ADMIN_EMAIL);
        otherEmployees.sort((a, b) => a.name.localeCompare(b.name));

        let finalSortedEmployees: Employee[] = [];
        if (adminUser) {
            finalSortedEmployees.push(adminUser);
        }
        finalSortedEmployees = [...finalSortedEmployees, ...otherEmployees];
        
        setEmployeesData(finalSortedEmployees);

        const currentUserEmployeeRecord = finalSortedEmployees.find(emp => emp.id === currentUser.uid);
        if (!currentUser.displayName || !currentUserEmployeeRecord) {
            setIsSettingName(true);
        } else {
            setIsSettingName(false);
        }
    });
    
    if (isAdmin) {
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
                 setShopInfo({
                    ...defaultInvoiceSettings,
                    ...dbShopInfo 
                 });
            } else {
                setShopInfo({ 
                    name: '', 
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
        return () => {
          unsubscribeEmployees();
          unsubscribeShopInfo();
        };
    }


    return () => {
      unsubscribeEmployees();
    };
  }, [currentUser, authLoading, isAdmin, toast]);


  useEffect(() => {
    if (!currentUser) return;
    const inventoryRef = ref(db, 'inventory');
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const inventoryArray: Product[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setInventory(inventoryArray.sort((a,b) => b.name.localeCompare(a.name)));
      } else {
        setInventory([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);


  useEffect(() => {
    if (!currentUser) return;
    const customersRef = ref(db, 'customers');
    const unsubscribe = onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const customersArray: Customer[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setCustomersData(customersArray.sort((a,b) => a.name.localeCompare(b.name)));
      } else {
        setCustomersData([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const invoicesRef = ref(db, 'invoices');
    const unsubscribe = onValue(invoicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const invoicesArray: Invoice[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setInvoicesData(invoicesArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        setInvoicesData([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const debtsRef = ref(db, 'debts');
    const unsubscribe = onValue(debtsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const debtsArray: Debt[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setDebtsData(debtsArray.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        setDebtsData([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);


  useEffect(() => {
    if (!currentUser) return;
    const productNamesRef = ref(db, 'productOptions/productNames');
    const colorsRef = ref(db, 'productOptions/colors');
    const sizesRef = ref(db, 'productOptions/sizes');
    const unitsRef = ref(db, 'productOptions/units');

    const unsubProductNames = onValue(productNamesRef, (snapshot) => {
      if (snapshot.exists()) {
        setProductNameOptions(Object.keys(snapshot.val()).sort((a, b) => a.localeCompare(b)));
      } else {
        setProductNameOptions([]);
      }
    });
    const unsubColors = onValue(colorsRef, (snapshot) => {
      if (snapshot.exists()) {
        setColorOptions(Object.keys(snapshot.val()).sort((a, b) => a.localeCompare(b)));
      } else {
        setColorOptions([]);
      }
    });
    const unsubSizes = onValue(sizesRef, (snapshot) => {
      if (snapshot.exists()) {
        setSizeOptions(Object.keys(snapshot.val()).sort((a, b) => a.localeCompare(b)));
      } else {
        setSizeOptions([]);
      }
    });
    const unsubUnits = onValue(unitsRef, (snapshot) => {
       if (snapshot.exists()) {
        setUnitOptions(Object.keys(snapshot.val()).sort((a, b) => a.localeCompare(b)));
      } else {
        setUnitOptions([]);
      }
    });

    return () => {
      unsubProductNames();
      unsubColors();
      unsubSizes();
      unsubUnits();
    };
  }, [currentUser]);

  const handleRevenueFilterChange = (newFilter: DateFilter) => setRevenueFilter(newFilter);
  const handleInvoiceFilterChange = (newFilter: DateFilter) => setInvoiceFilter(newFilter);
  const handleDebtFilterChange = (newFilter: DateFilter) => setDebtFilter(newFilter);

  const filterDataByDateRange = <T extends { date: string }>(
    data: T[],
    filter: DateFilter
  ): T[] => {
    if (!data) return [];
    const {day, month, year} = filter;
    return data.filter(item => {
      const itemDate = new Date(item.date);
      const itemDay = itemDate.getDate().toString();
      const itemMonth = (itemDate.getMonth() + 1).toString();
      const itemYear = itemDate.getFullYear().toString();

      const dayMatch = day === 'all' || day === itemDay;
      const monthMatch = month === 'all' || month === itemMonth;
      const yearMatch = year === 'all' || year === itemYear;

      return dayMatch && monthMatch && yearMatch;
    });
  };

  const availableInvoiceYears = useMemo(() => {
    if (!invoicesData || invoicesData.length === 0) return [new Date().getFullYear().toString()];
    const years = new Set(invoicesData.map(inv => new Date(inv.date).getFullYear().toString()));
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [invoicesData]);

  const availableDebtYears = useMemo(() => {
    if (!debtsData || debtsData.length === 0) return [new Date().getFullYear().toString()];
    const years = new Set(debtsData.map(debt => new Date(debt.date).getFullYear().toString()));
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [debtsData]);


  const filteredInvoicesForRevenue = useMemo(() => {
    return filterDataByDateRange(invoicesData, revenueFilter);
  }, [invoicesData, revenueFilter]);

  const filteredInvoicesForInvoiceTab = useMemo(() => {
    return filterDataByDateRange(invoicesData, invoiceFilter);
  }, [invoicesData, invoiceFilter]);

  const filteredDebtsForDebtTab = useMemo(() => {
    const dateFilteredDebts = filterDataByDateRange(debtsData, debtFilter);
    return dateFilteredDebts.filter(debt => debt.status === 'Chưa thanh toán');
  }, [debtsData, debtFilter]);


  const handleAddProduct = useCallback(async (newProductData: Omit<Product, 'id'>) => {
    try {
      const newProductRef = push(ref(db, 'inventory'));
      await set(newProductRef, {
        ...newProductData,
        price: newProductData.price,
        costPrice: newProductData.costPrice,
      });
      toast({ title: "Thành công", description: "Sản phẩm đã được thêm vào kho.", variant: "default" });
    } catch (error) {
      console.error("Error adding product:", error);
      toast({ title: "Lỗi", description: "Không thể thêm sản phẩm. Vui lòng thử lại.", variant: "destructive" });
    }
  }, [toast]);

  const handleUpdateProduct = useCallback(async (productId: string, updatedProductData: Omit<Product, 'id'>) => {
    try {
      await update(ref(db, `inventory/${productId}`), {
        ...updatedProductData,
        price: updatedProductData.price,
        costPrice: updatedProductData.costPrice,
      });
      toast({ title: "Thành công", description: "Sản phẩm đã được cập nhật.", variant: "default" });
    } catch (error) {
      console.error("Error updating product:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật sản phẩm. Vui lòng thử lại.", variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      await remove(ref(db, `inventory/${productId}`));
      toast({ title: "Thành công", description: "Sản phẩm đã được xóa.", variant: "default" });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ title: "Lỗi", description: "Không thể xóa sản phẩm. Vui lòng thử lại.", variant: "destructive" });
    }
  }, [toast]);


  const handleAddCustomer = useCallback(async (newCustomerData: Omit<Customer, 'id'>) => {
    try {
      const newCustomerRef = push(ref(db, 'customers'));
      await set(newCustomerRef, newCustomerData);
      toast({ title: "Thành công", description: "Khách hàng đã được thêm.", variant: "default" });
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({ title: "Lỗi", description: "Không thể thêm khách hàng. Vui lòng thử lại.", variant: "destructive" });
    }
  }, [toast]);

  const handleUpdateCustomer = useCallback(async (customerId: string, updatedCustomerData: Omit<Customer, 'id'>) => {
    try {
      await update(ref(db, `customers/${customerId}`), updatedCustomerData);
      toast({ title: "Thành công", description: "Thông tin khách hàng đã được cập nhật.", variant: "default" });
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật thông tin khách hàng. Vui lòng thử lại.", variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteCustomer = useCallback(async (customerId: string) => {
    try {
      await remove(ref(db, `customers/${customerId}`));
      toast({ title: "Thành công", description: "Khách hàng đã được xóa.", variant: "default" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({ title: "Lỗi", description: "Không thể xóa khách hàng. Vui lòng thử lại.", variant: "destructive" });
    }
  }, [toast]);

  const handleAddToCart = useCallback((item: Product) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    const stockItem = inventory.find(i => i.id === item.id);

    if (!stockItem || stockItem.quantity <= 0) {
      toast({ title: "Hết hàng", description: `Sản phẩm "${item.name} ${item.color} ${item.size} ${item.unit}" đã hết hàng!`, variant: "destructive" });
      return;
    }

    if (existingItem) {
      if (existingItem.quantityInCart < stockItem.quantity) {
        setCart(prevCart => prevCart.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, quantityInCart: cartItem.quantityInCart + 1 } : cartItem
        ));
      } else {
        toast({ title: "Số lượng tối đa", description: `Không đủ số lượng "${item.name} ${item.color} ${item.size} ${item.unit}" trong kho (Còn: ${stockItem.quantity}).`, variant: "destructive" });
      }
    } else {
      setCart(prevCart => [...prevCart, { ...item, quantityInCart: 1, itemDiscount: 0 }]);
    }
  }, [cart, inventory, toast, setCart]);

  const handleUpdateCartQuantity = useCallback((itemId: string, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr);
    if (isNaN(newQuantity) || newQuantity < 0) return;

    const stockItem = inventory.find(i => i.id === itemId);
    if (!stockItem && newQuantity > 0) return; 

    if (newQuantity === 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    } else if (stockItem && newQuantity > stockItem.quantity) {
      toast({ title: "Số lượng không đủ", description: `Chỉ còn ${stockItem.quantity} ${stockItem.unit} trong kho.`, variant: "destructive" });
      setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantityInCart: stockItem.quantity } : item));
    } else {
      setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantityInCart: newQuantity } : item));
    }
  }, [inventory, toast, setCart]);

  const handleItemDiscountChange = useCallback((itemId: string, discountNghinStr: string) => {
    const discountNghin = parseFloat(discountNghinStr);
    const discountVND = isNaN(discountNghin) ? 0 : discountNghin * 1000;

    setCart(prevCart => prevCart.map(item => {
      if (item.id === itemId) {
        const itemOriginalTotal = item.price * item.quantityInCart;
        if (discountVND < 0) {
          toast({ title: "Lỗi giảm giá", description: "Số tiền giảm giá cho sản phẩm không thể âm.", variant: "destructive" });
          return { ...item, itemDiscount: 0 };
        }
        if (discountVND > itemOriginalTotal) {
          toast({ title: "Lỗi giảm giá", description: `Giảm giá cho sản phẩm "${item.name}" không thể lớn hơn tổng tiền của sản phẩm đó (${itemOriginalTotal.toLocaleString('vi-VN')} VNĐ).`, variant: "destructive" });
          return { ...item, itemDiscount: itemOriginalTotal };
        }
        return { ...item, itemDiscount: discountVND };
      }
      return item;
    }));
  }, [toast, setCart]);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, [setCart]);


  const handleCreateInvoice = useCallback(async (
    customerName: string,
    invoiceCartItems: CartItem[], 
    subtotalAfterItemDiscounts: number,
    paymentMethod: string,
    overallInvoiceDiscount: number,
    amountPaid: number,
    isGuestCustomer: boolean,
    employeeId: string,
    employeeName: string
  ) => {
    try {
      const finalTotal = subtotalAfterItemDiscounts - overallInvoiceDiscount;
      let calculatedDebtAmount = 0;

      if (finalTotal < 0) {
        toast({
          title: "Lỗi tính toán",
          description: "Tổng tiền sau giảm giá không thể âm. Vui lòng kiểm tra lại giảm giá.",
          variant: "destructive",
        });
        return false;
      }

      if (finalTotal > amountPaid) {
        calculatedDebtAmount = finalTotal - amountPaid;
        if (isGuestCustomer || paymentMethod === 'Chuyển khoản') {
          toast({
            title: "Lỗi thanh toán",
            description: "Khách lẻ hoặc thanh toán bằng Chuyển khoản không được phép nợ. Vui lòng thanh toán đủ số tiền.",
            variant: "destructive",
          });
          return false;
        }
      }

      const newInvoiceRef = push(ref(db, 'invoices'));
      const invoiceId = newInvoiceRef.key;

      if (!invoiceId) {
        throw new Error("Không thể tạo ID cho hóa đơn mới.");
      }
      
      const itemsForDb: InvoiceCartItem[] = invoiceCartItems.map(item => ({
        id: item.id,
        name: item.name,
        quantityInCart: item.quantityInCart,
        price: item.price,
        costPrice: item.costPrice ?? 0,
        image: item.image,
        color: item.color,
        size: item.size,
        unit: item.unit,
        itemDiscount: item.itemDiscount || 0,
      }));

      const newInvoiceData: Omit<Invoice, 'id'> = {
        customerName,
        items: itemsForDb,
        total: finalTotal,
        date: new Date().toISOString(),
        paymentMethod,
        discount: overallInvoiceDiscount,
        amountPaid,
        employeeId,
        employeeName: employeeName || 'Không rõ',
        ...(calculatedDebtAmount > 0 && { debtAmount: calculatedDebtAmount }),
      };
      await set(newInvoiceRef, newInvoiceData);

      if (calculatedDebtAmount > 0) {
        const newDebtRef = push(ref(db, 'debts'));
        const newDebt: Omit<Debt, 'id'> = {
          supplier: customerName, 
          amount: calculatedDebtAmount,
          date: new Date().toISOString(),
          status: 'Chưa thanh toán',
          invoiceId: invoiceId,
          createdEmployeeId: employeeId,
          createdEmployeeName: employeeName || 'Không rõ',
        };
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
      handleClearCart(); 
      return true;
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({ title: "Lỗi", description: `Không thể tạo hóa đơn: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
      return false;
    }
  }, [toast, handleClearCart]);

  const handleProcessInvoiceCancellationOrReturn = useCallback(async (
    invoiceId: string,
    operationType: 'delete' | 'return',
    itemsToReturnArray?: Array<{ productId: string; name: string; quantityToReturn: number }>
  ) => {
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
            const newItem: InvoiceCartItem = {
              ...originalItem,
              quantityInCart: remainingQuantityInCart,
            };
            newInvoiceItems.push(newItem);
            newSubtotalAfterItemDiscounts += (newItem.price * remainingQuantityInCart) - (newItem.itemDiscount || 0);
          }
        }
        
        let newOverallInvoiceDiscount = originalInvoice.discount || 0;
        const originalSubtotalBeforeOverallDiscount = originalInvoice.items.reduce(
            (sum, item) => sum + (item.price * item.quantityInCart) - (item.itemDiscount || 0), 0
        );

        if (originalSubtotalBeforeOverallDiscount > 0 && originalInvoice.discount && originalInvoice.discount > 0) {
            const discountRatio = originalInvoice.discount / originalSubtotalBeforeOverallDiscount;
            newOverallInvoiceDiscount = Math.round(newSubtotalAfterItemDiscounts * discountRatio);
        }
        
        const newFinalTotal = newSubtotalAfterItemDiscounts - newOverallInvoiceDiscount;


        if (newInvoiceItems.length === 0 || newFinalTotal <= 0) {
          updates[`invoices/${invoiceId}`] = null;
          await deleteAssociatedDebtIfNeeded(); 
          await update(ref(db), updates);
          toast({ title: "Thành công", description: "Tất cả sản phẩm đã được hoàn trả, hóa đơn và công nợ liên quan (nếu có) đã được xóa.", variant: "default" });
        } else {
          updates[`invoices/${invoiceId}/items`] = newInvoiceItems;
          updates[`invoices/${invoiceId}/total`] = newFinalTotal;
          updates[`invoices/${invoiceId}/discount`] = newOverallInvoiceDiscount; 
          await update(ref(db), updates);
          toast({ title: "Thành công", description: "Hoàn trả một phần thành công, kho và hóa đơn đã cập nhật. Công nợ gốc (nếu có) không thay đổi trừ khi được xử lý riêng.", variant: "default" });
        }
        return true;
      }
      return false;

    } catch (error) {
      console.error(`Error processing invoice ${operationType} for ID ${invoiceId}:`, error);
      const errorMessage = operationType === 'delete' ? "Không thể xóa hóa đơn." : "Không thể xử lý hoàn trả.";
      toast({ title: "Lỗi", description: `${errorMessage} Vui lòng thử lại. ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
      return false;
    }
  }, [toast]);


  const handleImportProducts = useCallback(async (
    supplierName: string | undefined,
    itemsToProcess: SubmitItemToImport[],
    totalImportCostVND: number,
    employeeId: string,
    employeeName: string
  ) => {
    try {
      const newDebtRef = push(ref(db, 'debts'));
      const newDebt: Omit<Debt, 'id'> = {
        supplier: supplierName || "Nhà cung cấp không xác định",
        amount: totalImportCostVND,
        date: new Date().toISOString(),
        status: 'Chưa thanh toán',
        createdEmployeeId: employeeId,
        createdEmployeeName: employeeName || 'Không rõ',
      };
      await set(newDebtRef, newDebt);

      const updates: { [key: string]: any } = {};
      for (const importItem of itemsToProcess) {
        const productSnapshot = await get(child(ref(db), `inventory/${importItem.productId}`));
        if (productSnapshot.exists()) {
          const currentProduct = productSnapshot.val();
          updates[`inventory/${importItem.productId}/quantity`] = currentProduct.quantity + importItem.quantity;
          updates[`inventory/${importItem.productId}/costPrice`] = importItem.cost * 1000;
        } else {
          console.warn(`Sản phẩm ID ${importItem.productId} không tìm thấy trong kho khi nhập hàng. Bỏ qua cập nhật số lượng và giá vốn cho sản phẩm này.`);
        }
      }
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }

      toast({ title: "Thành công", description: "Nhập hàng thành công, công nợ và kho đã cập nhật.", variant: "default" });
      return true;
    } catch (error) {
      console.error("Error importing products:", error);
      toast({ title: "Lỗi", description: "Không thể nhập hàng. Vui lòng thử lại.", variant: "destructive" });
      return false;
    }
  }, [toast]);

  const handleUpdateDebtStatus = useCallback(async (
    debtId: string, 
    newStatus: 'Chưa thanh toán' | 'Đã thanh toán', 
    employeeId: string,
    employeeName: string,
    isUndoOperation: boolean = false
  ) => {
    try {
      const debtRef = ref(db, `debts/${debtId}`);
      const snapshot = await get(debtRef);
      if (!snapshot.exists()) {
        toast({ title: "Lỗi", description: "Không tìm thấy công nợ.", variant: "destructive" });
        return;
      }
      const originalDebt = snapshot.val() as Debt;
      const originalStatus = originalDebt.status;
  
      const updates: { [key: string]: any } = {};
      updates[`debts/${debtId}/status`] = newStatus; 
      if (!isUndoOperation) {
        updates[`debts/${debtId}/lastUpdatedEmployeeId`] = employeeId;
        updates[`debts/${debtId}/lastUpdatedEmployeeName`] = employeeName || 'Không rõ';
      } else {
        updates[`debts/${debtId}/lastUpdatedEmployeeId`] = employeeId; 
        updates[`debts/${debtId}/lastUpdatedEmployeeName`] = employeeName || 'Không rõ';
      }
  
      if (originalDebt.invoiceId) {
        const invoiceRef = ref(db, `invoices/${originalDebt.invoiceId}`);
        const invoiceSnapshot = await get(invoiceRef);
        if (invoiceSnapshot.exists()) {
          const currentInvoice = invoiceSnapshot.val() as Invoice;
          if (newStatus === 'Đã thanh toán' && !isUndoOperation) {
            updates[`invoices/${originalDebt.invoiceId}/debtAmount`] = 0;
            updates[`invoices/${originalDebt.invoiceId}/amountPaid`] = currentInvoice.total; 
          } else if (newStatus === 'Chưa thanh toán' && isUndoOperation) {
             updates[`invoices/${originalDebt.invoiceId}/debtAmount`] = originalDebt.amount;
             updates[`invoices/${originalDebt.invoiceId}/amountPaid`] = currentInvoice.total - originalDebt.amount;
          }
        } else {
          console.warn(`Invoice ${originalDebt.invoiceId} not found when updating debt ${debtId}`);
        }
      }
  
      await update(ref(db), updates);
  
      if (!isUndoOperation) {
        toast({
          title: "Thành công",
          description: "Trạng thái công nợ đã được cập nhật.",
          variant: "default",
        });
      } else {
         toast({
          title: "Hoàn tác thành công",
          description: `Trạng thái công nợ đã được đổi lại thành "${originalStatus}".`,
          variant: "default",
        });
      }
  
    } catch (error) {
      console.error("Error updating debt status:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái công nợ.", variant: "destructive" });
    }
  }, [toast]);

  const handleAddProductOption = useCallback(async (type: ProductOptionType, name: string) => {
    if (!name.trim()) {
      toast({ title: "Lỗi", description: "Tên tùy chọn không được để trống.", variant: "destructive" });
      return;
    }
    try {
      const sanitizedName = name.trim().replace(/[.#$[\]]/g, '_');
      if (sanitizedName !== name.trim()) {
        toast({ title: "Cảnh báo", description: "Tên tùy chọn đã được chuẩn hóa để loại bỏ ký tự không hợp lệ.", variant: "default" });
      }
      if (!sanitizedName) {
        toast({ title: "Lỗi", description: "Tên tùy chọn sau khi chuẩn hóa không hợp lệ.", variant: "destructive" });
        return;
      }
      await set(ref(db, `productOptions/${type}/${sanitizedName}`), true);
      toast({ title: "Thành công", description: `Tùy chọn ${sanitizedName} đã được thêm.`, variant: "default" });
    } catch (error) {
      console.error(`Error adding product ${type} option:`, error);
      toast({ title: "Lỗi", description: `Không thể thêm tùy chọn ${type}.`, variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteProductOption = useCallback(async (type: ProductOptionType, name: string) => {
    try {
      await remove(ref(db, `productOptions/${type}/${name}`));
      toast({ title: "Thành công", description: `Tùy chọn ${name} đã được xóa.`, variant: "default" });
    } catch (error) {
      console.error(`Error deleting product ${type} option:`, error);
      toast({ title: "Lỗi", description: `Không thể xóa tùy chọn ${type}.`, variant: "destructive" });
    }
  }, [toast]);

  const handleSaveShopInfo = async (newInfo: ShopInfo) => {
    if (!isAdmin) {
        toast({ title: "Lỗi", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive" });
        throw new Error("Permission denied");
    }
    try {
        await set(ref(db, 'shopInfo'), newInfo);
        toast({ title: "Thành công", description: "Thông tin cửa hàng đã được cập nhật." });
    } catch (error: any) {
        console.error("Error updating shop info:", error);
        toast({ title: "Lỗi", description: "Không thể cập nhật thông tin cửa hàng: " + error.message, variant: "destructive" });
        throw error;
    }
  };

  const navItems = [
    { name: 'Bán hàng', icon: <SellIcon /> },
    { name: 'Kho hàng', icon: <WarehouseIcon /> },
    { name: 'Nhập hàng', icon: <ImportIcon /> },
    { name: 'Hóa đơn', icon: <InvoiceIconSvg /> },
    { name: 'Công nợ', icon: <DebtIcon /> },
    { name: 'Doanh thu', icon: <RevenueIcon /> },
    { name: 'Khách hàng', icon: <CustomerIcon /> },
    { name: 'Nhân viên', icon: <EmployeeIcon /> },
  ];

  const tabs: Record<TabName, ReactNode> = useMemo(() => ({
    'Bán hàng': <SalesTab 
                    inventory={inventory} 
                    customers={customersData} 
                    onCreateInvoice={handleCreateInvoice} 
                    currentUser={currentUser}
                    numericDisplaySize={numericDisplaySize}
                    cart={cart}
                    onAddToCart={handleAddToCart}
                    onUpdateCartQuantity={handleUpdateCartQuantity}
                    onItemDiscountChange={handleItemDiscountChange}
                    onClearCart={handleClearCart}
                  />,
    'Kho hàng': <InventoryTab
                    inventory={inventory}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    productNameOptions={productNameOptions}
                    colorOptions={colorOptions}
                    sizeOptions={sizeOptions}
                    unitOptions={unitOptions}
                    onAddOption={handleAddProductOption}
                    onDeleteOption={handleDeleteProductOption}
                  />,
    'Nhập hàng': <ImportTab
                    inventory={inventory}
                    onImportProducts={handleImportProducts}
                    productNameOptions={productNameOptions}
                    colorOptions={colorOptions}
                    sizeOptions={sizeOptions}
                    unitOptions={unitOptions}
                    currentUser={currentUser}
                  />,
    'Hóa đơn': <InvoiceTab
                  invoices={filteredInvoicesForInvoiceTab}
                  onProcessInvoiceCancellationOrReturn={handleProcessInvoiceCancellationOrReturn}
                  filter={invoiceFilter}
                  onFilterChange={handleInvoiceFilterChange}
                  availableYears={availableInvoiceYears}
                />,
    'Công nợ': <DebtTab
                  debts={filteredDebtsForDebtTab}
                  onUpdateDebtStatus={handleUpdateDebtStatus}
                  filter={debtFilter}
                  onFilterChange={handleDebtFilterChange}
                  availableYears={availableDebtYears}
                  currentUser={currentUser}
                />,
    'Doanh thu': <RevenueTab
                  invoices={filteredInvoicesForRevenue}
                  filter={revenueFilter}
                  onFilterChange={handleRevenueFilterChange}
                  availableYears={availableInvoiceYears}
                  numericDisplaySize={numericDisplaySize}
                />,
    'Khách hàng': <CustomerTab
                      customers={customersData}
                      invoices={invoicesData} 
                      onAddCustomer={handleAddCustomer}
                      onUpdateCustomer={handleUpdateCustomer}
                      onDeleteCustomer={handleDeleteCustomer}
                    />,
    'Nhân viên': <EmployeeTab 
                    employees={employeesData} 
                    currentUser={currentUser} 
                    invoices={invoicesData}
                    debts={debtsData}
                    numericDisplaySize={numericDisplaySize}
                  />,
  }), [
      inventory, customersData, invoicesData, debtsData, employeesData, shopInfo, cart,
      currentUser, numericDisplaySize,
      productNameOptions, colorOptions, sizeOptions, unitOptions,
      filteredInvoicesForRevenue, revenueFilter,
      filteredInvoicesForInvoiceTab, invoiceFilter,
      filteredDebtsForDebtTab, debtFilter,
      availableInvoiceYears, availableDebtYears,
      handleCreateInvoice, handleAddProduct, handleUpdateProduct, handleDeleteProduct,
      handleAddProductOption, handleDeleteProductOption, handleImportProducts,
      handleProcessInvoiceCancellationOrReturn, handleUpdateDebtStatus,
      handleAddCustomer, handleUpdateCustomer, handleDeleteCustomer,
      handleRevenueFilterChange, handleInvoiceFilterChange, handleDebtFilterChange,
      handleAddToCart, handleUpdateCartQuantity, handleItemDiscountChange, handleClearCart
  ]);

  const SidebarToggleButton = () => {
    const { open, toggleSidebar: toggle } = useSidebar();
    return (
      <SidebarMenuButton
        onClick={toggle}
        className="w-full"
      >
        {open ? <ChevronsLeft className="h-5 w-5" /> : <ChevronsRight className="h-5 w-5" />}
        <span>
          {open ? 'Thu gọn' : 'Mở rộng'}
        </span>
      </SidebarMenuButton>
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
      toast({ title: "Đã đăng xuất", description: "Bạn đã đăng xuất thành công.", variant: "default" });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ title: "Lỗi đăng xuất", description: "Không thể đăng xuất. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const handleNameSet = async (inputName: string) => {
    if (!currentUser) return;

    const isAdminUser = currentUser.email === ADMIN_EMAIL;
    const employeeName = isAdminUser ? ADMIN_NAME : inputName;
    const employeePosition = isAdminUser ? 'Chủ cửa hàng' : 'Nhân viên';

    try {
        await updateUserProfileName(employeeName); 

        const employeeDataForDb: Partial<Employee> = { 
            name: employeeName,
            email: currentUser.email!,
            position: employeePosition,
        };
        
        const employeeRef = ref(db, `employees/${currentUser.uid}`);
        await set(employeeRef, employeeDataForDb); 

        toast({ title: "Thành công", description: "Thông tin của bạn đã được cập nhật." });
        setIsSettingName(false); 
    } catch (error) {
        console.error("Error in onNameSet:", error);
        toast({ title: "Lỗi", description: "Không thể cập nhật thông tin.", variant: "destructive" });
    }
  };


  if (authLoading) {
    return <LoadingScreen message="Đang tải ứng dụng..." />;
  }

  if (!currentUser) {
    return <LoadingScreen message="Đang chuyển hướng đến trang đăng nhập..." />;
  }
  
  if (isSettingName) {
    return (
      <SetNameDialog
        onNameSet={handleNameSet}
      />
    );
  }


  return (
    <SidebarProvider>
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
          <SidebarFooter className="p-2 border-t border-sidebar-border sticky bottom-0 bg-sidebar space-y-2">
            {currentUser && (
                <SidebarMenuButton
                    onClick={() => setIsUserInfoDialogOpen(true)}
                    className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    tooltip={{children: currentUser.displayName || currentUser.email || "Tài khoản", side: "right", align: "center"}}
                    variant="ghost"
                >
                    <UserCircle className="h-5 w-5" />
                    <span>{currentUser.displayName || currentUser.email}</span>
                </SidebarMenuButton>
            )}
            <SidebarMenuButton
                onClick={() => setIsSettingsDialogOpen(true) }
                className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                tooltip={{children: "Cài đặt", side: "right", align: "center"}}
                variant="ghost"
            >
                <Settings className="h-5 w-5" />
                <span>Cài đặt</span>
            </SidebarMenuButton>
            <SidebarMenuButton
                onClick={handleSignOut}
                className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                tooltip={{children: "Đăng xuất", side: "right", align: "center"}}
                variant="ghost"
            >
                <LogOut className="h-5 w-5" />
                <span>Đăng xuất</span>
            </SidebarMenuButton>
            <SidebarToggleButton />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <main className="flex-1 overflow-y-auto">
            <div className="flex items-center mb-4 print:hidden px-4 pt-4 lg:px-6 lg:pt-6">
              <SidebarTrigger className="md:hidden mr-4">
                <PanelLeft />
              </SidebarTrigger>
              <h2 className="text-3xl font-bold text-foreground font-headline">{activeTab}</h2>
            </div>
            <div className="min-h-[calc(100vh-8rem)] px-0 pb-0 lg:px-0 lg:pb-0">
               {tabs[activeTab]}
            </div>
          </main>
        </SidebarInset>
      </div>
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
              {employeesData.find(emp => emp.id === currentUser.uid)?.position && (
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="info-position" className="text-right">
                          Chức vụ
                      </Label>
                      <Input id="info-position" value={employeesData.find(emp => emp.id === currentUser.uid)?.position} readOnly className="col-span-3 bg-muted/50" />
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
        isAdmin={isAdmin}
        isLoadingShopInfo={isLoadingShopInfo}
      />
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsScreenLocked(true)}
              className="fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 active:bg-primary/80 transition-transform duration-150 ease-in-out hover:scale-105"
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
      <LockScreen
        isOpen={isScreenLocked}
        onUnlock={() => setIsScreenLocked(false)}
        currentUserEmail={currentUser?.email || null}
        signIn={signIn}
        currentUserName={currentUser?.displayName}
      />
    </SidebarProvider>
  );
}
    
    
    
    
    

    









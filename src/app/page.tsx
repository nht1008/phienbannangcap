
"use client";

import React, { useState, useMemo, ReactNode, useEffect } from 'react';
import type { Product, Employee, Invoice, Debt, CartItem, ProductOptionType, Customer } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { HomeIcon } from '@/components/icons/HomeIcon';
import { WarehouseIcon } from '@/components/icons/WarehouseIcon';
import { SellIcon } from '@/components/icons/SellIcon';
import { ImportIcon } from '@/components/icons/ImportIcon';
import { InvoiceIcon as InvoiceIconSvg } from '@/components/icons/InvoiceIcon';
import { DebtIcon } from '@/components/icons/DebtIcon';
import { RevenueIcon } from '@/components/icons/RevenueIcon';
import { EmployeeIcon } from '@/components/icons/EmployeeIcon';
import { CustomerIcon } from '@/components/icons/CustomerIcon';

import { SalesTab } from '@/components/tabs/SalesTab';
import { InventoryTab } from '@/components/tabs/InventoryTab';
import { ImportTab } from '@/components/tabs/ImportTab';
import { InvoiceTab } from '@/components/tabs/InvoiceTab';
import { DebtTab } from '@/components/tabs/DebtTab';
import { RevenueTab } from '@/components/tabs/RevenueTab';
import { EmployeeTab } from '@/components/tabs/EmployeeTab';
import { CustomerTab } from '@/components/tabs/CustomerTab';
import { SetNameDialog } from '@/components/auth/SetNameDialog';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { cn } from '@/lib/utils';
import { ToastAction } from "@/components/ui/toast";

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
import { PanelLeft, ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, push, update, get, child, remove } from "firebase/database";
import { useToast } from "@/hooks/use-toast";

interface SubmitItemToImport {
  productId: string;
  quantity: number;
  cost: number;
}


type TabName = 'Bán hàng' | 'Kho hàng' | 'Nhập hàng' | 'Hóa đơn' | 'Công nợ' | 'Doanh thu' | 'Nhân viên' | 'Khách hàng';

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


export default function FleurManagerPage() {
  const { currentUser, loading: authLoading, signOut, updateUserProfileName } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isSettingName, setIsSettingName] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>('Kho hàng');
  const [inventory, setInventory] = useState<Product[]>([]);
  const [employeesData, setEmployeesData] = useState<Employee[]>([]);
  const [customersData, setCustomersData] = useState<Customer[]>([]);
  const [invoicesData, setInvoicesData] = useState<Invoice[]>([]);
  const [debtsData, setDebtsData] = useState<Debt[]>([]);
  
  const [productNameOptions, setProductNameOptions] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);

  const [revenueFilter, setRevenueFilter] = useState<DateFilter>(getCurrentMonthYearFilter());
  const [invoiceFilter, setInvoiceFilter] = useState<DateFilter>(initialAllDateFilter);
  const [debtFilter, setDebtFilter] = useState<DateFilter>(initialAllDateFilter);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (!authLoading && currentUser && !currentUser.displayName) {
      setIsSettingName(true);
    } else {
      setIsSettingName(false);
    }
  }, [currentUser, authLoading]);

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
    const employeesRef = ref(db, 'employees');
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let employeesArray: Employee[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Filter employees by currentUser.uid if it exists
        if (currentUser.uid) {
            employeesArray = employeesArray.filter(emp => emp.userId === currentUser.uid);
        }
        setEmployeesData(employeesArray.sort((a,b) => a.name.localeCompare(b.name)));
      } else {
        setEmployeesData([]);
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
    filterObj: DateFilter
  ): T[] => {
    if (!data) return [];
    return data.filter(item => {
      const itemDate = new Date(item.date);
      const itemDay = itemDate.getDate().toString();
      const itemMonth = (itemDate.getMonth() + 1).toString();
      const itemYear = itemDate.getFullYear().toString();

      const dayMatch = filterObj.day === 'all' || filterObj.day === itemDay;
      const monthMatch = filterObj.month === 'all' || filterObj.month === itemMonth;
      const yearMatch = filterObj.year === 'all' || filterObj.year === itemYear;

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


  const handleAddProduct = async (newProductData: Omit<Product, 'id'>) => {
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
  };

  const handleUpdateProduct = async (productId: string, updatedProductData: Omit<Product, 'id'>) => {
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
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await remove(ref(db, `inventory/${productId}`));
      toast({ title: "Thành công", description: "Sản phẩm đã được xóa.", variant: "default" });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ title: "Lỗi", description: "Không thể xóa sản phẩm. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const handleAddEmployee = async (newEmployeeData: Omit<Employee, 'id' | 'userId'>) => {
    if (!currentUser || !currentUser.uid) {
        toast({ title: "Lỗi", description: "Không tìm thấy thông tin người dùng để thêm nhân viên.", variant: "destructive" });
        return;
    }
    try {
      const newEmployeeRef = push(ref(db, 'employees'));
      await set(newEmployeeRef, { ...newEmployeeData, userId: currentUser.uid });
      toast({ title: "Thành công", description: "Nhân viên đã được thêm.", variant: "default" });
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({ title: "Lỗi", description: "Không thể thêm nhân viên. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const handleUpdateEmployee = async (employeeId: string, updatedEmployeeData: Omit<Employee, 'id' | 'userId'>) => {
     if (!currentUser || !currentUser.uid) {
        toast({ title: "Lỗi", description: "Không tìm thấy thông tin người dùng để cập nhật nhân viên.", variant: "destructive" });
        return;
    }
    try {
      // Ensure userId is maintained or correctly set if needed, though typically it shouldn't change.
      // For this update, we assume the userId is not part of `updatedEmployeeData` from the form.
      // We might need to fetch the existing employee to preserve userId if it's not passed.
      // However, the current structure passes Omit<Employee, 'id' | 'userId'>, so we need to add it back.
      await update(ref(db, `employees/${employeeId}`), { ...updatedEmployeeData, userId: currentUser.uid });
      toast({ title: "Thành công", description: "Thông tin nhân viên đã được cập nhật.", variant: "default" });
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật thông tin nhân viên. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await remove(ref(db, `employees/${employeeId}`));
      toast({ title: "Thành công", description: "Nhân viên đã được xóa.", variant: "default" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({ title: "Lỗi", description: "Không thể xóa nhân viên. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const handleAddCustomer = async (newCustomerData: Omit<Customer, 'id'>) => {
    try {
      const newCustomerRef = push(ref(db, 'customers'));
      await set(newCustomerRef, newCustomerData);
      toast({ title: "Thành công", description: "Khách hàng đã được thêm.", variant: "default" });
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({ title: "Lỗi", description: "Không thể thêm khách hàng. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const handleUpdateCustomer = async (customerId: string, updatedCustomerData: Omit<Customer, 'id'>) => {
    try {
      await update(ref(db, `customers/${customerId}`), updatedCustomerData);
      toast({ title: "Thành công", description: "Thông tin khách hàng đã được cập nhật.", variant: "default" });
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật thông tin khách hàng. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await remove(ref(db, `customers/${customerId}`));
      toast({ title: "Thành công", description: "Khách hàng đã được xóa.", variant: "default" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({ title: "Lỗi", description: "Không thể xóa khách hàng. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const handleCreateInvoice = async (
    customerName: string,
    cart: CartItem[],
    subtotal: number,
    paymentMethod: string,
    discount: number,
    amountPaid: number,
    isGuestCustomer: boolean
  ) => {
    try {
      const finalTotal = subtotal - discount;
      let calculatedDebtAmount = 0;

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

      const newInvoiceData: Omit<Invoice, 'id'> = {
        customerName,
        items: cart.map(item => ({
          ...item,
          price: item.price,
          costPrice: item.costPrice ?? 0
        })),
        total: finalTotal,
        date: new Date().toISOString(),
        paymentMethod,
        discount,
        amountPaid,
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
        };
        await set(newDebtRef, newDebt);
      }

      const updates: { [key: string]: any } = {};
      for (const cartItem of cart) {
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
      return true;
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({ title: "Lỗi", description: `Không thể tạo hóa đơn: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
      return false;
    }
  };

  const handleProcessInvoiceCancellationOrReturn = async (
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
        for (const cartItem of originalInvoice.items) {
          const productRef = child(ref(db), `inventory/${cartItem.id}`);
          const productSnapshot = await get(productRef);
          if (productSnapshot.exists()) {
            updates[`inventory/${cartItem.id}/quantity`] = productSnapshot.val().quantity + cartItem.quantityInCart;
          } else {
            console.warn(`Sản phẩm ID ${cartItem.id} (tên: ${cartItem.name}) trong hóa đơn ${invoiceId} không còn tồn tại trong kho. Không thể hoàn kho cho sản phẩm này.`);
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

        const newInvoiceItems: CartItem[] = [];
        let newTotal = 0;

        for (const originalItem of originalInvoice.items) {
          const returnedItemInfo = itemsToReturnArray.find(rt => rt.productId === originalItem.id);
          const quantityReturned = returnedItemInfo ? returnedItemInfo.quantityToReturn : 0;
          const remainingQuantityInCart = originalItem.quantityInCart - quantityReturned;

          if (remainingQuantityInCart > 0) {
            newInvoiceItems.push({
              ...originalItem,
              quantityInCart: remainingQuantityInCart,
            });
            newTotal += originalItem.price * remainingQuantityInCart;
          }
        }
        
        let originalSubTotal = 0;
        for(const item of originalInvoice.items) {
            originalSubTotal += item.price * item.quantityInCart;
        }

        let newDiscount = originalInvoice.discount || 0;
        if (originalSubTotal > 0 && originalInvoice.discount && originalInvoice.discount > 0) {
            const discountRatio = originalInvoice.discount / originalSubTotal;
            let currentSubTotalOfNewItems = 0;
             for(const item of newInvoiceItems) {
                 currentSubTotalOfNewItems += item.price * item.quantityInCart;
             }
            newDiscount = Math.round(currentSubTotalOfNewItems * discountRatio);
        }
        
        newTotal = newTotal - newDiscount;


        if (newInvoiceItems.length === 0 || newTotal <= 0) {
          updates[`invoices/${invoiceId}`] = null; 
          await deleteAssociatedDebtIfNeeded();
          await update(ref(db), updates);
          toast({ title: "Thành công", description: "Tất cả sản phẩm đã được hoàn trả, hóa đơn và công nợ liên quan (nếu có) đã được xóa.", variant: "default" });
        } else {
          updates[`invoices/${invoiceId}/items`] = newInvoiceItems;
          updates[`invoices/${invoiceId}/total`] = newTotal;
          updates[`invoices/${invoiceId}/discount`] = newDiscount;
          await update(ref(db), updates);
          toast({ title: "Thành công", description: "Hoàn trả một phần thành công, kho và hóa đơn đã cập nhật. Công nợ gốc (nếu có) không thay đổi.", variant: "default" });
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
  };


  const handleImportProducts = async (
    supplierName: string | undefined, 
    itemsToProcess: SubmitItemToImport[],
    totalImportCostVND: number
  ) => {
    try {
      const newDebtRef = push(ref(db, 'debts'));
      const newDebt: Omit<Debt, 'id'> = {
        supplier: supplierName || "Nhà cung cấp không xác định",
        amount: totalImportCostVND,
        date: new Date().toISOString(),
        status: 'Chưa thanh toán'
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
  };

  const handleUpdateDebtStatus = async (debtId: string, newStatus: 'Chưa thanh toán' | 'Đã thanh toán', isUndoOperation: boolean = false) => {
    try {
      const debtRef = ref(db, `debts/${debtId}`);
      const snapshot = await get(debtRef);
      if (!snapshot.exists()) {
        toast({ title: "Lỗi", description: "Không tìm thấy công nợ.", variant: "destructive" });
        return;
      }
      const originalStatus = snapshot.val().status;

      await update(debtRef, { status: newStatus });

      if (!isUndoOperation) {
        toast({
          title: "Thành công",
          description: "Trạng thái công nợ đã được cập nhật.",
          variant: "default",
          action: (
            <ToastAction 
              altText="Hoàn tác" 
              onClick={() => handleUpdateDebtStatus(debtId, originalStatus, true)}
            >
              Hoàn tác
            </ToastAction>
          ),
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
  };

  const handleAddProductOption = async (type: ProductOptionType, name: string) => {
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
  };

  const handleDeleteProductOption = async (type: ProductOptionType, name: string) => {
    try {
      await remove(ref(db, `productOptions/${type}/${name}`));
      toast({ title: "Thành công", description: `Tùy chọn ${name} đã được xóa.`, variant: "default" });
    } catch (error) {
      console.error(`Error deleting product ${type} option:`, error);
      toast({ title: "Lỗi", description: `Không thể xóa tùy chọn ${type}.`, variant: "destructive" });
    }
  };

  const navItems: NavItem[] = [
    { name: 'Bán hàng', icon: <SellIcon /> },
    { name: 'Kho hàng', icon: <WarehouseIcon /> },
    { name: 'Nhập hàng', icon: <ImportIcon /> },
    { name: 'Hóa đơn', icon: <InvoiceIconSvg /> },
    { name: 'Công nợ', icon: <DebtIcon /> },
    { name: 'Doanh thu', icon: <RevenueIcon /> },
    { name: 'Nhân viên', icon: <EmployeeIcon /> },
    { name: 'Khách hàng', icon: <CustomerIcon /> }, 
  ];

  const tabs: Record<TabName, ReactNode> = useMemo(() => ({
    'Bán hàng': <SalesTab inventory={inventory} customers={customersData} onCreateInvoice={handleCreateInvoice} />,
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
                />,
    'Doanh thu': <RevenueTab 
                  invoices={filteredInvoicesForRevenue}
                  filter={revenueFilter}
                  onFilterChange={handleRevenueFilterChange}
                  availableYears={availableInvoiceYears}
                />,
    'Nhân viên': <EmployeeTab 
                    employees={employeesData} 
                    onAddEmployee={handleAddEmployee} 
                    onUpdateEmployee={handleUpdateEmployee}
                    onDeleteEmployee={handleDeleteEmployee}
                  />,
    'Khách hàng': <CustomerTab 
                      customers={customersData} 
                      onAddCustomer={handleAddCustomer}
                      onUpdateCustomer={handleUpdateCustomer}
                      onDeleteCustomer={handleDeleteCustomer}
                    />,
  }), [
      inventory, employeesData, customersData, invoicesData, debtsData, currentUser, 
      productNameOptions, colorOptions, sizeOptions, unitOptions, 
      filteredInvoicesForRevenue, revenueFilter, 
      filteredInvoicesForInvoiceTab, invoiceFilter, 
      filteredDebtsForDebtTab, debtFilter,
      availableInvoiceYears, availableDebtYears
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

  if (authLoading) {
    return <LoadingScreen message="Đang tải ứng dụng..." />;
  }

  if (!currentUser) {
     // Router.push in useEffect will handle redirection, this is a fallback.
    return <LoadingScreen message="Đang chuyển hướng đến trang đăng nhập..." />;
  }

  if (isSettingName) {
    return (
      <SetNameDialog
        onNameSet={async (name) => {
          try {
            await updateUserProfileName(name);
            toast({title: "Thành công", description: "Tên hiển thị đã được cập nhật."});
            // No need to setIsSettingName(false) here,
            // The useEffect monitoring currentUser.displayName will handle it.
          } catch (error) {
            toast({title: "Lỗi", description: "Không thể cập nhật tên hiển thị.", variant: "destructive"});
          }
        }}
      />
    );
  }
  

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
          <SidebarFooter className="p-2 border-t border-sidebar-border sticky bottom-0 bg-sidebar space-y-2">
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
            <div className="min-h-[calc(100vh-8rem)] px-4 pb-4 lg:px-6 lg:pb-6">
               {tabs[activeTab]}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}


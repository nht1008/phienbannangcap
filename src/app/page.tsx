
"use client";

import React, { useState, useMemo, ReactNode, useEffect } from 'react';
import type { Product, Employee, Invoice, Debt, CartItem, ItemToImport } from '@/types';
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
import { PanelLeft, ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react'; 
import { db } from '@/lib/firebase';
import { ref, onValue, set, push, update, get, child } from "firebase/database";
import { useToast } from "@/hooks/use-toast";


type TabName = 'Bán hàng' | 'Kho hàng' | 'Nhập hàng' | 'Hóa đơn' | 'Công nợ' | 'Doanh thu' | 'Nhân viên';

interface NavItem {
  name: TabName;
  icon: ReactNode;
}

export default function FleurManagerPage() {
  const { currentUser, loading: authLoading, signOut } = useAuth(); 
  const router = useRouter(); 

  const [activeTab, setActiveTab] = useState<TabName>('Kho hàng');
  const [inventory, setInventory] = useState<Product[]>([]);
  const [employeesData, setEmployeesData] = useState<Employee[]>([]);
  const [invoicesData, setInvoicesData] = useState<Invoice[]>([]);
  const [debtsData, setDebtsData] = useState<Debt[]>([]);
  const { toast } = useToast();

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);


  // Tải và lắng nghe dữ liệu Kho hàng
  useEffect(() => {
    if (!currentUser) return; // Không tải nếu chưa đăng nhập
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
  }, [currentUser]); // Thêm currentUser làm dependency

  // Tải và lắng nghe dữ liệu Nhân viên
  useEffect(() => {
    if (!currentUser) return;
    const employeesRef = ref(db, 'employees');
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const employeesArray: Employee[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setEmployeesData(employeesArray.sort((a,b) => a.name.localeCompare(b.name)));
      } else {
        setEmployeesData([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Tải và lắng nghe dữ liệu Hóa đơn
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

  // Tải và lắng nghe dữ liệu Công nợ
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


  const handleAddProduct = async (newProductData: Omit<Product, 'id'>) => {
    try {
      const newProductRef = push(ref(db, 'inventory'));
      await set(newProductRef, newProductData);
      toast({ title: "Thành công", description: "Sản phẩm đã được thêm vào kho.", variant: "default" });
    } catch (error) {
      console.error("Error adding product:", error);
      toast({ title: "Lỗi", description: "Không thể thêm sản phẩm. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const handleAddEmployee = async (newEmployeeData: Omit<Employee, 'id'>) => {
    try {
      const newEmployeeRef = push(ref(db, 'employees'));
      await set(newEmployeeRef, newEmployeeData);
      toast({ title: "Thành công", description: "Nhân viên đã được thêm.", variant: "default" });
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({ title: "Lỗi", description: "Không thể thêm nhân viên. Vui lòng thử lại.", variant: "destructive" });
    }
  };
  
  const handleCreateInvoice = async (customerName: string, cart: CartItem[], total: number) => {
    try {
      const newInvoiceRef = push(ref(db, 'invoices'));
      const newInvoice: Omit<Invoice, 'id'> = {
        customerName,
        items: cart,
        total,
        date: new Date().toISOString(),
      };
      await set(newInvoiceRef, newInvoice);

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
      await update(ref(db), updates);
      toast({ title: "Thành công", description: "Hóa đơn đã được tạo và kho đã cập nhật.", variant: "default" });
      return true; 
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({ title: "Lỗi", description: `Không thể tạo hóa đơn: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
      return false; 
    }
  };

  const handleImportProducts = async (supplierName: string | undefined, itemsToImport: ItemToImport[], totalCost: number) => {
    try {
      const newDebtRef = push(ref(db, 'debts'));
      const newDebt: Omit<Debt, 'id'> = {
        supplier: supplierName,
        amount: totalCost,
        date: new Date().toISOString(),
        status: 'Chưa thanh toán'
      };
      await set(newDebtRef, newDebt);
  
      const updates: { [key: string]: any } = {};
      for (const importItem of itemsToImport) {
        const productSnapshot = await get(child(ref(db), `inventory/${importItem.productId}`));
        if (productSnapshot.exists()) {
          const currentQuantity = productSnapshot.val().quantity;
          updates[`inventory/${importItem.productId}/quantity`] = currentQuantity + importItem.quantity;
        } else {
          console.warn(`Sản phẩm ID ${importItem.productId} không tìm thấy trong kho khi nhập hàng. Bỏ qua cập nhật số lượng cho sản phẩm này.`);
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

  const handleUpdateDebtStatus = async (debtId: string, newStatus: 'Chưa thanh toán' | 'Đã thanh toán') => {
    try {
      await update(ref(db, `debts/${debtId}`), { status: newStatus });
      toast({ title: "Thành công", description: "Trạng thái công nợ đã được cập nhật.", variant: "default" });
    } catch (error) {
      console.error("Error updating debt status:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái công nợ.", variant: "destructive" });
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
  ];

  const tabs: Record<TabName, ReactNode> = useMemo(() => ({
    'Bán hàng': <SalesTab inventory={inventory} onCreateInvoice={handleCreateInvoice} />,
    'Kho hàng': <InventoryTab inventory={inventory} onAddProduct={handleAddProduct} />,
    'Nhập hàng': <ImportTab inventory={inventory} onImportProducts={handleImportProducts} />,
    'Hóa đơn': <InvoiceTab invoices={invoicesData} />,
    'Công nợ': <DebtTab debts={debtsData} onUpdateDebtStatus={handleUpdateDebtStatus} />,
    'Doanh thu': <RevenueTab invoices={invoicesData} />,
    'Nhân viên': <EmployeeTab employees={employeesData} onAddEmployee={handleAddEmployee} />,
  }), [inventory, employeesData, invoicesData, debtsData, currentUser]); // Thêm currentUser

  const SidebarToggleButton = () => {
    const { open, toggleSidebar } = useSidebar();
    return (
      <SidebarMenuButton
        onClick={toggleSidebar}
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
      router.push('/login'); // Chuyển hướng về trang login sau khi đăng xuất
      toast({ title: "Đã đăng xuất", description: "Bạn đã đăng xuất thành công.", variant: "default" });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ title: "Lỗi đăng xuất", description: "Không thể đăng xuất. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  // Hiển thị loading hoặc null trong khi kiểm tra auth hoặc nếu chưa đăng nhập (sẽ bị chuyển hướng)
  if (authLoading || !currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Đang tải ứng dụng...</p>
        </div>
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
          <SidebarFooter className="p-2 border-t border-sidebar-border sticky bottom-0 bg-sidebar space-y-2"> {/* Thêm space-y-2 */}
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

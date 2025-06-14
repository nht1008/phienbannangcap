
export interface Product {
  id: string; 
  name: string;
  quantity: number;
  price: number; // Selling price
  costPrice?: number; // Cost price / Original price
  image: string;
  color: string;
  size: string;
  unit: string;
}

export interface CartItem extends Product {
  quantityInCart: number; 
}

export interface Employee {
  id: string; 
  name: string;
  position: string;
  phone: string;
  userId: string; // UID of the Firebase user who owns/created this employee
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
}

export interface Supplier {
  id: number; 
  name: string;
}

export interface Invoice {
  id: string; 
  customerName: string;
  items: CartItem[];
  total: number; // Final amount after discount
  date: string; // ISO date string
  paymentMethod: string;
  discount?: number; // Discount amount
  amountPaid?: number; // Amount paid by customer
  debtAmount?: number; // Amount of debt created from this invoice
}

export interface Debt {
  id: string; 
  supplier: string; // For customer debt, this will be customerName. For supplier debt, actual supplier name.
  amount: number;
  date: string; // ISO date string
  status: 'Chưa thanh toán' | 'Đã thanh toán';
  invoiceId?: string; // Link to the invoice that generated this debt (for customer debts)
}

export interface ItemToImport {
  name: string;
  color: string;
  size: string;
  unit: string;
  quantity: number;
  cost: number; // Cost per unit in Nghin VND
}

export type ProductOptionType = 'productNames' | 'colors' | 'sizes' | 'units';


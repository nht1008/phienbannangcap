
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
  itemDiscount?: number; // Discount for this specific item in VND, applied to the total for this line item (price * quantityInCart)
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

// This is the structure of items as stored within an Invoice
export interface InvoiceCartItem {
  id: string;
  name: string;
  quantityInCart: number;
  price: number; // Original selling price per unit
  costPrice?: number;
  image: string;
  color: string;
  size: string;
  unit: string;
  itemDiscount?: number; // Discount applied to this line item in VND
}

export interface Invoice {
  id: string;
  customerName: string;
  items: InvoiceCartItem[]; // Uses the specialized InvoiceCartItem
  total: number; // Final amount after all item and overall discounts
  date: string; // ISO date string
  paymentMethod: string;
  discount?: number; // Overall invoice discount (additional to item discounts)
  amountPaid?: number; // Amount paid by customer
  debtAmount?: number; // Amount of debt created from this invoice
  employeeId: string; // UID of the employee who created theinvoice
  employeeName?: string; // Name of the employee
}

export interface Debt {
  id: string;
  supplier: string; // For customer debt, this will be customerName. For supplier debt, actual supplier name.
  amount: number;
  date: string; // ISO date string
  status: 'Chưa thanh toán' | 'Đã thanh toán';
  invoiceId?: string; // Link to the invoice that generated this debt (for customer debts)
  createdEmployeeId?: string; // UID of the employee who created the debt
  createdEmployeeName?: string; // Name of the employee who created
  lastUpdatedEmployeeId?: string; // UID of the employee who last updated the status
  lastUpdatedEmployeeName?: string; // Name of the employee who last updated
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

export interface Employee {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  position: 'Chủ cửa hàng' | 'Nhân viên';
  phone?: string;
}

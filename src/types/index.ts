
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
}

export interface Debt {
  id: string; 
  supplier: string | undefined; 
  amount: number;
  date: string; // ISO date string
  status: 'Chưa thanh toán' | 'Đã thanh toán';
}

export interface ItemToImport {
  productId: string; 
  quantity: number;
  cost: number;
}

export type ProductOptionType = 'productNames' | 'colors' | 'sizes' | 'units';


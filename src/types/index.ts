export interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
  color: string;
  size: string;
  unit: string;
}

export interface CartItem extends Product {
  quantityInCart: number; // Renamed from 'quantity' to avoid conflict with Product's quantity (stock)
}

export interface Employee {
  id: number;
  name: string;
  position: string;
  phone: string;
}

export interface Supplier {
  id: number;
  name: string;
}

export interface Invoice {
  id: number;
  customerName: string;
  items: CartItem[];
  total: number;
  date: string; // ISO date string
}

export interface Debt {
  id: number;
  supplier: string | undefined; // Name of the supplier
  amount: number;
  date: string; // ISO date string
  status: 'Chưa thanh toán' | 'Đã thanh toán';
}

export interface ItemToImport {
  productId: string | number; // Can be string from select, convert to number
  quantity: number;
  cost: number;
}

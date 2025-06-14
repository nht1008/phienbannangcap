export interface Product {
  id: string; // Changed from number to string for Firebase keys
  name: string;
  quantity: number;
  price: number;
  image: string;
  color: string;
  size: string;
  unit: string;
}

export interface CartItem extends Product {
  quantityInCart: number; 
}

export interface Employee {
  id: string; // Changed from number to string
  name: string;
  position: string;
  phone: string;
}

export interface Supplier {
  id: number; // Remains number as it's local for now
  name: string;
}

export interface Invoice {
  id: string; // Changed from number to string
  customerName: string;
  items: CartItem[];
  total: number;
  date: string; // ISO date string
}

export interface Debt {
  id: string; // Changed from number to string
  supplier: string | undefined; 
  amount: number;
  date: string; // ISO date string
  status: 'Chưa thanh toán' | 'Đã thanh toán';
}

export interface ItemToImport {
  productId: string; // Changed from string | number to string
  quantity: number;
  cost: number;
}

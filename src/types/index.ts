
export interface Product {
  id: string;
  name: string;
  quality?: string; 
  quantity: number;
  price: number; 
  costPrice?: number; 
  image: string;
  color: string;
  size: string;
  unit: string;
  maxDiscountPerUnitVND?: number; 
}

export interface CartItem extends Product {
  quantityInCart: number;
  itemDiscount?: number; 
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string; // Added for login/request tracking
}

export interface Supplier {
  id: number;
  name: string;
}


export interface InvoiceCartItem {
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
}

export interface Invoice {
  id: string;
  customerName: string;
  items: InvoiceCartItem[]; 
  total: number; 
  date: string; 
  paymentMethod: string;
  discount?: number; 
  amountPaid?: number; 
  debtAmount?: number; 
  employeeId: string; 
  employeeName?: string; 
}

export interface Debt {
  id: string;
  supplier: string; 
  amount: number;
  date: string; 
  status: 'Chưa thanh toán' | 'Đã thanh toán';
  invoiceId?: string; 
  createdEmployeeId?: string; 
  createdEmployeeName?: string; 
  lastUpdatedEmployeeId?: string; 
  lastUpdatedEmployeeName?: string; 
}

export interface ItemToImport {
  name: string;
  color: string;
  quality: string; 
  size: string;
  unit: string;
  quantity: number;
  cost: number; 
}

export type ProductOptionType = 'productNames' | 'colors' | 'qualities' | 'sizes' | 'units'; 

export type EmployeePosition = 'Nhân viên' | 'ADMIN' | 'Quản lý';

export interface Employee {
  id: string; 
  name: string;
  email: string;
  position: EmployeePosition;
  phone?: string;
}

export interface ShopInfo {
  name: string;
  address: string;
  phone: string;
  logoUrl: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
}

export interface DisposalLogEntry {
  id: string;
  productId: string;
  productName: string;
  color: string;
  quality?: string;
  size: string;
  unit: string;
  image: string;
  quantityDisposed: number;
  reason: string;
  disposalDate: string; 
  employeeId: string;
  employeeName: string;
}

export type UserAccessRequestStatus = 'pending' | 'approved' | 'rejected';

export interface UserAccessRequest {
  id: string; // Same as user's UID
  name: string; // Display name
  email: string;
  phone: string;
  address: string;
  requestedRole: 'employee' | 'customer';
  status: UserAccessRequestStatus;
  requestDate: string; // ISO date string
  reviewedBy?: string; // Admin UID
  reviewDate?: string; // ISO date string
  rejectionReason?: string;
}

// This type will be used for the shared product form
export type ProductFormData = Omit<Product, 'id' | 'quantity' | 'price' | 'costPrice' | 'maxDiscountPerUnitVND'> & {
  quantity: string;
  price: string; // Price in Nghin VND for form input
  costPrice: string; // Cost price in Nghin VND for form input
  maxDiscountPerUnitVND: string; // Max discount in Nghin VND for form input
};

export const initialProductFormData: ProductFormData = {
  name: '',
  color: '',
  quality: '',
  size: '',
  unit: '',
  quantity: '0',
  price: '0',
  costPrice: '',
  image: '',
  maxDiscountPerUnitVND: '0',
};

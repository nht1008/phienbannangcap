
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
  email?: string; 
  zaloName?: string;
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
  id: string; 
  name: string; 
  email: string;
  phone: string;
  address: string;
  requestedRole: 'employee' | 'customer';
  status: UserAccessRequestStatus;
  requestDate: string; 
  reviewedBy?: string; 
  reviewDate?: string; 
  rejectionReason?: string;
  zaloName?: string;
}

export type ProductFormData = Omit<Product, 'id' | 'quantity' | 'price' | 'costPrice' | 'maxDiscountPerUnitVND'> & {
  quantity: string;
  price: string; 
  costPrice: string; 
  maxDiscountPerUnitVND: string; 
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

// Order Management Types
export type OrderStatus =
  | 'Chờ xác nhận'
  | 'Đã xác nhận'
  | 'Đang chuẩn bị hàng'
  | 'Đang giao hàng'
  | 'Đã giao hàng'
  | 'Hoàn thành'
  | 'Đã hủy'
  | 'Yêu cầu hủy';

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  'Chờ xác nhận',
  'Đã xác nhận',
  'Đang chuẩn bị hàng',
  'Đang giao hàng',
  'Đã giao hàng',
  'Hoàn thành',
  'Đã hủy',
  'Yêu cầu hủy',
];

export type PaymentStatus =
  | 'Chưa thanh toán'
  | 'Đã thanh toán một phần'
  | 'Đã thanh toán'
  | 'Đã hoàn tiền';

export interface OrderItem {
  productId: string;
  productName: string;
  color: string;
  quality?: string;
  size: string;
  unit: string;
  quantity: number;
  priceAtOrder: number; 
  image?: string;
}

export interface Order {
  id: string; 
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerUserId?: string; 
  items: OrderItem[];
  orderTotal: number; 
  orderDate: string; 
  status: OrderStatus;
  paymentMethod?: string; 
  paymentStatus: PaymentStatus;
  shippingAddress?: string; 
  shippingFee: number;
  discountCode?: string;
  discountAmount: number; 
  finalAmount: number; 
  notes?: string; 
  reviewedByEmployeeId?: string;
  reviewedByEmployeeName?: string;
  cancellationReason?: string; 
  history?: Array<{
    status: OrderStatus;
    changedAt: string; 
    changedByEmployeeId?: string;
    changedByEmployeeName?: string;
    reason?: string;
  }>; 
}

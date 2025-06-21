
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
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  zaloName?: string; // Added Zalo Name
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
  notes?: string;
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

export interface OrderItem extends InvoiceCartItem { // Similar to InvoiceCartItem but for orders
  // Any order-specific item properties can be added here
}

export type OrderStatus = 'Chờ xác nhận' | 'Đã xác nhận' | 'Đang chuẩn bị' | 'Đang giao hàng' | 'Hoàn thành' | 'Đã hủy' | 'Yêu cầu hủy';
export type PaymentStatus = 'Chưa thanh toán' | 'Đã thanh toán' | 'Thanh toán một phần' | 'Đã hoàn tiền';


export interface Order {
  id: string; // Firebase key
  orderNumber: string; // Human-readable order number
  customerId: string; // UID of the customer from Firebase Auth
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerZaloName?: string;
  items: OrderItem[];
  subTotal: number; // Sum of (item.price * item.quantityInCart - item.itemDiscount)
  shippingFee: number;
  totalAmount: number; // subTotal + shippingFee - overallDiscount
  overallDiscount?: number; // Discount on the entire order
  paymentMethod: string; // e.g., 'COD', 'Bank Transfer', 'Online'
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  internalNotes?: string; // Shop notes
  orderDate: string; // ISO string
  shipDate?: string; // ISO string
  completionDate?: string; // ISO string
  cancellationReason?: string; // If cancelled
  updatedBy?: string; // UID of employee who last updated
  updatedAt?: string; // ISO string of last update
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
  zaloName?: string; // Added Zalo Name
}

export interface ShopInfo {
  name: string;
  address: string;
  phone: string;
  logoUrl: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  showShopLogoOnInvoice: boolean;
  showShopAddressOnInvoice: boolean;
  showShopPhoneOnInvoice: boolean;
  showShopBankDetailsOnInvoice: boolean;
  showEmployeeNameOnInvoice: boolean;
  invoiceThankYouMessage: string;
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
  fullName: string; 
  email: string;
  phone: string;
  address: string;
  zaloName: string; // Added Zalo Name
  requestedRole: 'employee' | 'customer';
  status: UserAccessRequestStatus;
  requestDate: string; 
  reviewedBy?: string; 
  reviewDate?: string; 
  rejectionReason?: string;
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
  quantity: '', // Changed from '0' to empty string
  price: '0',
  costPrice: '', // Kept as empty for optional input initially, but will be required by form logic
  image: '',
  maxDiscountPerUnitVND: '0',
};

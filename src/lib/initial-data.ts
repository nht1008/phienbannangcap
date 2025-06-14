import type { Product, Employee, Supplier } from '@/types';

export const initialInventory: Product[] = [
  // Dữ liệu mẫu đã bị xóa
];

export const initialEmployees: Employee[] = [
    { id: 1, name: 'Nguyễn Văn A', position: 'Quản lý', phone: '0987654321' },
    { id: 2, name: 'Trần Thị B', position: 'Nhân viên bán hàng', phone: '0912345678' },
];

export const initialSuppliers: Supplier[] = [
    { id: 1, name: 'Vườn hoa Đà Lạt' },
    { id: 2, name: 'Nhà cung cấp hoa Hà Nội' }
];

import type { Product, Employee, Supplier } from '@/types';

export const initialInventory: Product[] = [
  { id: 1, name: 'Hoa hồng', quantity: 50, price: 10000, image: 'https://placehold.co/100x100/f87171/ffffff', color: 'Đỏ', size: 'Lớn', unit: 'Bông' },
  { id: 2, name: 'Hoa cẩm chướng', quantity: 30, price: 8000, image: 'https://placehold.co/100x100/f9a8d4/ffffff', color: 'Hồng', size: 'Vừa', unit: 'Cành' },
  { id: 3, name: 'Hoa ly', quantity: 40, price: 15000, image: 'https://placehold.co/100x100/fde047/ffffff', color: 'Trắng', size: 'Lớn', unit: 'Cành' },
  { id: 4, name: 'Hoa hướng dương', quantity: 25, price: 12000, image: 'https://placehold.co/100x100/facc15/ffffff', color: 'Vàng', size: 'Lớn', unit: 'Bông' },
];

export const initialEmployees: Employee[] = [
    { id: 1, name: 'Nguyễn Văn A', position: 'Quản lý', phone: '0987654321' },
    { id: 2, name: 'Trần Thị B', position: 'Nhân viên bán hàng', phone: '0912345678' },
];

export const initialSuppliers: Supplier[] = [
    { id: 1, name: 'Vườn hoa Đà Lạt' },
    { id: 2, name: 'Nhà cung cấp hoa Hà Nội' }
];


"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, Invoice, Debt, EmployeePosition, UserAccessRequest } from '@/types';
import type { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPhoneNumber, cn, normalizeStringForSearch } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Trash2, UserCog, UserX, Pencil, Users, CheckCircle, XCircle } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { NumericDisplaySize } from '@/components/settings/SettingsDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, onValue, update, set } from "firebase/database";


interface ActivityDateTimeFilter {
  startDate: Date | null;
  endDate: Date | null;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
}

const getCombinedDateTime = (dateInput: Date | null, hourStr: string, minuteStr: string): Date | null => {
    if (!dateInput) return null;
    const newDate = new Date(dateInput);
    const hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const seconds = (minuteStr === '59') ? 59 : 0;
      const milliseconds = (minuteStr === '59') ? 999 : 0;
      newDate.setHours(hours, minutes, seconds, milliseconds);
    }
    return newDate;
};


const filterActivityByDateTimeRange = <T extends { date: string }>(
  data: T[],
  filter: ActivityDateTimeFilter
): T[] => {
  if (!data) return [];

  const { startDate, endDate, startHour, startMinute, endHour, endMinute } = filter;

  if (!startDate || !endDate) {
    return data;
  }

  const effectiveStartDate = getCombinedDateTime(startDate, startHour, startMinute);
  const effectiveEndDate = getCombinedDateTime(endDate, endHour, endMinute);

  if (!effectiveStartDate || !effectiveEndDate) return data;

  let finalEffectiveEndDate = effectiveEndDate;
  if (effectiveEndDate < effectiveStartDate && startDate.toDateString() === endDate.toDateString()) {
     const tempEnd = new Date(endDate);
     tempEnd.setHours(23, 59, 59, 999);
     finalEffectiveEndDate = tempEnd;
  }


  return data.filter(item => {
    const itemDateTime = new Date(item.date);
    return itemDateTime >= effectiveStartDate && itemDateTime <= finalEffectiveEndDate;
  });
};


interface EmployeeTabProps {
  employees: Employee[];
  currentUser: User | null;
  invoices: Invoice[];
  debts: Debt[];
  numericDisplaySize: NumericDisplaySize;
  onDeleteDebt: (debtId: string) => void;
  onToggleEmployeeRole: (employeeId: string, currentPosition: EmployeePosition) => Promise<void>;
  onUpdateEmployeeInfo: (employeeId: string, data: { name: string; phone?: string }) => Promise<void>;
  adminEmail: string;
  isCurrentUserAdmin: boolean;
}

const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minuteOptionsStart = ['00', '15', '30', '45'];
const minuteOptionsEnd = ['00', '15', '30', '45', '59'];


export function EmployeeTab({
    employees,
    currentUser,
    invoices,
    debts,
    numericDisplaySize,
    onDeleteDebt,
    onToggleEmployeeRole,
    onUpdateEmployeeInfo,
    adminEmail,
    isCurrentUserAdmin
}: EmployeeTabProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activityFilter, setActivityFilter] = useState<ActivityDateTimeFilter>(() => {
    const today = new Date();
    return {
      startDate: startOfDay(today),
      endDate: endOfDay(today),
      startHour: '00',
      startMinute: '00',
      endHour: '23',
      endMinute: '59',
    };
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editFormData, setEditFormData] = useState<{ name: string; phone: string }>({ name: '', phone: '' });
  const { toast } = useToast();

  const [employeeAccessRequests, setEmployeeAccessRequests] = useState<UserAccessRequest[]>([]);
  const [isLoadingEmployeeRequests, setIsLoadingEmployeeRequests] = useState(false);
  const [isReviewEmployeeRequestsDialogOpen, setIsReviewEmployeeRequestsDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestToReject, setRequestToReject] = useState<UserAccessRequest | null>(null);


  useEffect(() => {
    if (isCurrentUserAdmin) {
      setIsLoadingEmployeeRequests(true);
      const requestsRef = ref(db, 'userAccessRequests');
      const unsubscribe = onValue(requestsRef, (snapshot) => {
        const data = snapshot.val();
        const loadedRequests: UserAccessRequest[] = [];
        if (data) {
          Object.keys(data).forEach(key => {
            // Filter for employee-specific requests here
            if (data[key].status === 'pending' && data[key].requestedRole === 'employee') {
              loadedRequests.push({ id: key, ...data[key] });
            }
          });
        }
        setEmployeeAccessRequests(loadedRequests.sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()));
        setIsLoadingEmployeeRequests(false);
      }, (error) => {
        console.error("Error fetching employee access requests:", error);
        toast({ title: "Lỗi tải yêu cầu", description: "Không thể tải danh sách yêu cầu nhân viên.", variant: "destructive" });
        setIsLoadingEmployeeRequests(false);
      });
      return () => unsubscribe();
    }
  }, [isCurrentUserAdmin, toast]);

  const handleApproveEmployeeRequest = async (request: UserAccessRequest) => {
    if (!isCurrentUserAdmin || !currentUser || request.requestedRole !== 'employee') return;
    try {
      const updates: Record<string, any> = {};
      updates[`userAccessRequests/${request.id}/status`] = 'approved';
      updates[`userAccessRequests/${request.id}/reviewedBy`] = currentUser.uid;
      updates[`userAccessRequests/${request.id}/reviewDate`] = new Date().toISOString();
      updates[`employees/${request.id}`] = {
        name: request.name,
        email: request.email,
        phone: request.phone || '',
        address: request.address || '', 
        position: 'Nhân viên' as EmployeePosition, 
      };
      
      await update(ref(db), updates);
      toast({ title: "Thành công", description: `Đã duyệt yêu cầu của nhân viên ${request.name}.`, variant: "default" });
    } catch (error) {
      console.error("Error approving employee request:", error);
      toast({ title: "Lỗi", description: "Không thể duyệt yêu cầu nhân viên.", variant: "destructive" });
    }
  };

  const openRejectEmployeeDialog = (request: UserAccessRequest) => {
    setRequestToReject(request);
    setRejectionReason("");
  };

  const handleConfirmRejectEmployeeRequest = async () => {
    if (!isCurrentUserAdmin || !currentUser || !requestToReject) return;
    try {
      await update(ref(db, `userAccessRequests/${requestToReject.id}`), {
        status: 'rejected',
        reviewedBy: currentUser.uid,
        reviewDate: new Date().toISOString(),
        rejectionReason: rejectionReason.trim() || "Không có lý do cụ thể.",
      });
      toast({ title: "Thành công", description: `Đã từ chối yêu cầu của ${requestToReject.name}.`, variant: "default" });
      setRequestToReject(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({ title: "Lỗi", description: "Không thể từ chối yêu cầu.", variant: "destructive" });
    }
  };


  const displayEmployees = useMemo(() => {
    if (isCurrentUserAdmin) return employees;
    const adminEmployee = employees.find(emp => emp.email === adminEmail);
    const selfEmployee = employees.find(emp => emp.id === currentUser?.uid);
    const result = [];
    if (adminEmployee) result.push(adminEmployee);
    if (selfEmployee && selfEmployee.id !== adminEmployee?.id) result.push(selfEmployee);
    return result;
  }, [employees, currentUser, isCurrentUserAdmin, adminEmail]);

  const employeeBaseInvoices = useMemo(() => {
    if (!selectedEmployee) return [];
    return invoices.filter(inv => inv.employeeId === selectedEmployee.id);
  }, [invoices, selectedEmployee]);

  const employeeBaseDebts = useMemo(() => {
    if (!selectedEmployee) return [];
    return debts.filter(debt =>
                        debt.createdEmployeeId === selectedEmployee.id ||
                        debt.lastUpdatedEmployeeId === selectedEmployee.id
                      );
  }, [debts, selectedEmployee]);

  const filteredEmployeeInvoices = useMemo(() => {
    return filterActivityByDateTimeRange(employeeBaseInvoices, activityFilter);
  }, [employeeBaseInvoices, activityFilter]);

  const filteredEmployeeDebts = useMemo(() => {
    return filterActivityByDateTimeRange(employeeBaseDebts, activityFilter);
  }, [employeeBaseDebts, activityFilter]);

  const totalSalesByEmployee = useMemo(() => {
    return filteredEmployeeInvoices.reduce((sum, inv) => sum + inv.total, 0);
  }, [filteredEmployeeInvoices]);

  const totalDebtCollectedByEmployee = useMemo(() => {
    if (!selectedEmployee) return 0;
    return filteredEmployeeDebts.reduce((sum, debt) => {
      if (debt.status === 'Đã thanh toán' && debt.lastUpdatedEmployeeId === selectedEmployee.id) {
        return sum + debt.amount;
      }
      return sum;
    }, 0);
  }, [filteredEmployeeDebts, selectedEmployee]);

  const totalDiscountsByEmployee = useMemo(() => {
    return filteredEmployeeInvoices.reduce((sum, inv) => {
      const overallDiscount = inv.discount || 0;
      const itemDiscountsTotal = inv.items.reduce((itemSum, currentItem) => itemSum + (currentItem.itemDiscount || 0), 0);
      return sum + overallDiscount + itemDiscountsTotal;
    }, 0);
  }, [filteredEmployeeInvoices]);

  const totalTransactions = useMemo(() => {
    return totalSalesByEmployee + totalDebtCollectedByEmployee;
  }, [totalSalesByEmployee, totalDebtCollectedByEmployee]);

  const handleSelectEmployee = (employee: Employee) => {
    if (isCurrentUserAdmin || employee.email === adminEmail || employee.id === currentUser?.uid) {
        setSelectedEmployee(employee);
        const today = new Date();
        setActivityFilter({
          startDate: startOfDay(today),
          endDate: endOfDay(today),
          startHour: '00',
          startMinute: '00',
          endHour: '23',
          endMinute: '59',
        });
    } else {
        setSelectedEmployee(null);
    }
  };

  const handleSetTodayFilter = () => {
    const today = new Date();
    setActivityFilter({
      startDate: startOfDay(today),
      endDate: endOfDay(today),
      startHour: '00',
      startMinute: '00',
      endHour: '23',
      endMinute: '59',
    });
  };

  const handleOpenEditModal = (employee: Employee) => {
    if (employee.email === adminEmail) {
      toast({ title: "Không thể sửa", description: "Không thể chỉnh sửa thông tin của tài khoản Quản trị viên.", variant: "destructive"});
      return;
    }
    setEditingEmployee(employee);
    setEditFormData({ name: employee.name, phone: employee.phone || '' });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEmployeeInfo = async () => {
    if (!editingEmployee || !editFormData.name.trim()) {
      toast({ title: "Lỗi", description: "Tên nhân viên không được để trống.", variant: "destructive" });
      return;
    }
    await onUpdateEmployeeInfo(editingEmployee.id, {
      name: editFormData.name.trim(),
      phone: editFormData.phone.trim() || undefined
    });
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };


  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Danh sách Nhân sự</CardTitle>
            {isCurrentUserAdmin && (
              <Button
                onClick={() => setIsReviewEmployeeRequestsDialogOpen(true)}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Users className="mr-2 h-4 w-4" /> Xét duyệt nhân viên ({employeeAccessRequests.filter(req => req.requestedRole === 'employee').length})
              </Button>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col space-y-6">
        <div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      Chưa có nhân viên nào trong danh sách.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayEmployees.map((emp, index) => (
                    <TableRow
                      key={emp.id}
                      onClick={() => handleSelectEmployee(emp)}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedEmployee?.id === emp.id ? 'bg-primary/10' : ''}`}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>
                        {emp.position === 'ADMIN' ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-destructive text-destructive-foreground">
                            {emp.position}
                          </span>
                        ) : emp.position === 'Quản lý' ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sky-500 text-white dark:bg-sky-600 dark:text-sky-100">
                            {emp.position}
                          </span>
                        ) : emp.position === 'Nhân viên' ? (
                           <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500 text-white dark:bg-gray-600 dark:text-gray-100">
                            {emp.position}
                          </span>
                        ) : (
                          emp.position
                        )}
                      </TableCell>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell>{formatPhoneNumber(emp.phone) || 'Chưa cập nhật'}</TableCell>
                      <TableCell className="text-center space-x-1">
                        {isCurrentUserAdmin && emp.email !== adminEmail && (
                           <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditModal(emp);
                                    }}
                                    >
                                    <Pencil className="h-4 w-4 text-yellow-600" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <p>Sửa thông tin nhân viên</p>
                                </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {isCurrentUserAdmin && emp.email !== adminEmail && (emp.position === 'Nhân viên' || emp.position === 'Quản lý') && (
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleEmployeeRole(emp.id, emp.position);
                                  }}
                                >
                                  {emp.position === 'Nhân viên' ? (
                                    <UserCog className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <UserX className="h-4 w-4 text-orange-600" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>
                                  {emp.position === 'Nhân viên'
                                    ? 'Nâng cấp thành Quản lý'
                                    : 'Hạ cấp thành Nhân viên'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {isCurrentUserAdmin && employeeAccessRequests.filter(req => req.requestedRole === 'employee').length > 0 && (
          <>
            <Separator className="my-6"/>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl font-semibold flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/> Yêu cầu truy cập của nhân viên ({employeeAccessRequests.filter(req => req.requestedRole === 'employee').length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Hiện có {employeeAccessRequests.filter(req => req.requestedRole === 'employee').length} yêu cầu 'Nhân viên' đang chờ xử lý. Nhấn nút "Xét duyệt nhân viên" ở trên để quản lý.
                    </p>
                </CardContent>
            </Card>
          </>
        )}


        {selectedEmployee && (
          <Card className="shadow-md mt-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Nhật ký hoạt động của: {selectedEmployee.name}</CardTitle>
              <CardDescription>Tổng hợp các hóa đơn và công nợ liên quan đến nhân viên này.</CardDescription>

              <div className="mt-4 pt-4 border-t space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-2 items-end">
                  <div className="space-y-1">
                    <Label htmlFor="startDate">Từ ngày</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="startDate"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-card h-9",
                            !activityFilter.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {activityFilter.startDate ? format(activityFilter.startDate, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={activityFilter.startDate ?? undefined}
                          onSelect={(date) => setActivityFilter(prev => ({ ...prev, startDate: date ? startOfDay(date) : null }))}
                          initialFocus
                          locale={vi}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="startHour">Giờ bắt đầu</Label>
                    <Select value={activityFilter.startHour} onValueChange={(value) => setActivityFilter(prev => ({...prev, startHour: value}))}>
                      <SelectTrigger id="startHour" className="bg-card h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {hourOptions.map(hour => <SelectItem key={`start-hr-${hour}`} value={hour}>{hour}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="startMinute">Phút bắt đầu</Label>
                    <Select value={activityFilter.startMinute} onValueChange={(value) => setActivityFilter(prev => ({...prev, startMinute: value}))}>
                      <SelectTrigger id="startMinute" className="bg-card h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {minuteOptionsStart.map(min => <SelectItem key={`start-min-${min}`} value={min}>{min}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-2 items-end">
                  <div className="space-y-1">
                    <Label htmlFor="endDate">Đến ngày</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="endDate"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-card h-9",
                            !activityFilter.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {activityFilter.endDate ? format(activityFilter.endDate, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={activityFilter.endDate ?? undefined}
                          onSelect={(date) => setActivityFilter(prev => ({ ...prev, endDate: date ? endOfDay(date) : null }))}
                          disabled={(date) => activityFilter.startDate ? date < activityFilter.startDate : false}
                          initialFocus
                          locale={vi}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endHour">Giờ kết thúc</Label>
                    <Select value={activityFilter.endHour} onValueChange={(value) => setActivityFilter(prev => ({...prev, endHour: value}))}>
                      <SelectTrigger id="endHour" className="bg-card h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {hourOptions.map(hour => <SelectItem key={`end-hr-${hour}`} value={hour}>{hour}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endMinute">Phút kết thúc</Label>
                    <Select value={activityFilter.endMinute} onValueChange={(value) => setActivityFilter(prev => ({...prev, endMinute: value}))}>
                      <SelectTrigger id="endMinute" className="bg-card h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {minuteOptionsEnd.map(min => <SelectItem key={`end-min-${min}`} value={min}>{min}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                    <Button
                    onClick={handleSetTodayFilter}
                    variant="outline"
                    className="h-9 w-full sm:w-auto"
                    >
                    Hôm nay
                    </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-success/10 border-[hsl(var(--success))]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-[hsl(var(--success))]">Tổng tiền bán hàng</CardTitle>
                      <CardDescription className="text-xs">(Tổng giá trị các HĐ do NV này tạo, theo bộ lọc)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className={cn("font-bold text-[hsl(var(--success))]", numericDisplaySize)}>{totalSalesByEmployee.toLocaleString('vi-VN')} VNĐ</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-success/10 border-[hsl(var(--success))]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-[hsl(var(--success))]">Tổng thu nợ</CardTitle>
                      <CardDescription className="text-xs">(Nợ được NV này xử lý "Đã TT", theo bộ lọc ngày tạo nợ)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className={cn("font-bold text-[hsl(var(--success))]", numericDisplaySize)}>{totalDebtCollectedByEmployee.toLocaleString('vi-VN')} VNĐ</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-destructive/10 border-destructive">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-[hsl(var(--destructive))]">Tổng giảm giá</CardTitle>
                      <CardDescription className="text-xs">(Tổng GG chung & GG sản phẩm trên các HĐ do NV này tạo, theo bộ lọc)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className={cn("font-bold text-[hsl(var(--destructive))]", numericDisplaySize)}>{totalDiscountsByEmployee.toLocaleString('vi-VN')} VNĐ</p>
                    </CardContent>
                  </Card>
                </div>
                 <Card className="bg-chart-3/10 border-[hsl(var(--chart-3))] col-span-1 sm:col-span-2 md:col-span-3">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-[hsl(var(--chart-3))]">Tổng giao dịch</CardTitle>
                      <CardDescription className="text-xs">Đây là tổng số tiền mà nhân viên đang cầm (không tính số tiền gốc đã đưa cho)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className={cn("font-bold text-[hsl(var(--chart-3))]", numericDisplaySize)}>{totalTransactions.toLocaleString('vi-VN')} VNĐ</p>
                    </CardContent>
                  </Card>

              <div>
                <h3 className="font-semibold mb-2 text-lg text-primary">Hóa đơn đã tạo ({filteredEmployeeInvoices.length})</h3>
                {filteredEmployeeInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có hóa đơn nào phù hợp với bộ lọc.</p>
                ) : (
                <ScrollArea className="h-60 border rounded-md p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">STT</TableHead>
                        <TableHead>ID HĐ</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Giờ</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                        <TableHead className="text-right">Giảm giá</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployeeInvoices.map((invoice, index) => {
                        const invoiceDate = new Date(invoice.date);
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{invoice.id.substring(0, 8)}...</TableCell>
                            <TableCell>{invoice.customerName}</TableCell>
                            <TableCell>{invoiceDate.toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>{invoiceDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                            <TableCell className="text-right">{invoice.total.toLocaleString('vi-VN')} VNĐ</TableCell>
                            <TableCell className="text-right">{(invoice.discount ?? 0).toLocaleString('vi-VN')} VNĐ</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2 text-lg text-primary">Công nợ đã xử lý ({filteredEmployeeDebts.length})</h3>
                 {filteredEmployeeDebts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Không có công nợ nào phù hợp với bộ lọc.</p>
                ) : (
                <ScrollArea className="h-60 border rounded-md p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">STT</TableHead>
                        <TableHead>ID HĐ</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Giờ</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        {isCurrentUserAdmin && <TableHead className="text-center">Hành động</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployeeDebts.map((debt, index) => {
                        const debtDate = new Date(debt.date);
                        return (
                          <TableRow key={debt.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{debt.invoiceId ? `${debt.invoiceId.substring(0, 8)}...` : 'N/A'}</TableCell>
                            <TableCell>{debt.supplier}</TableCell>
                            <TableCell>{debtDate.toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>{debtDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                            <TableCell className="text-right">{debt.amount.toLocaleString('vi-VN')} VNĐ</TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full inline-block text-xs font-medium',
                                  debt.status === 'Chưa thanh toán'
                                    ? 'bg-destructive text-destructive-foreground'
                                    : 'bg-success text-success-foreground'
                                )}
                              >
                                {debt.status}
                              </span>
                            </TableCell>
                            {isCurrentUserAdmin && (
                              <TableCell className="text-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive/80"
                                    onClick={() => onDeleteDebt(debt.id)}
                                    title="Xóa công nợ"
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>

    {isEditModalOpen && editingEmployee && (
        <Dialog open={isEditModalOpen} onOpenChange={() => { setIsEditModalOpen(false); setEditingEmployee(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa thông tin nhân viên</DialogTitle>
              <DialogDescription>
                Cập nhật tên và số điện thoại cho {editingEmployee.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Tên
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  className="col-span-3 bg-card"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  Số điện thoại
                </Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditFormChange}
                  className="col-span-3 bg-card"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingEmployee(null); }}>
                Hủy
              </Button>
              <Button onClick={handleSaveEmployeeInfo} className="bg-primary text-primary-foreground">Lưu thay đổi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isCurrentUserAdmin && (
        <Dialog open={isReviewEmployeeRequestsDialogOpen} onOpenChange={setIsReviewEmployeeRequestsDialogOpen}>
            <DialogContent className="sm:max-w-5xl"> 
                <DialogHeader>
                    <DialogTitle>Xét duyệt yêu cầu nhân viên ({employeeAccessRequests.filter(req => req.requestedRole === 'employee').length})</DialogTitle>
                    <DialogDescription>
                        Duyệt hoặc từ chối các yêu cầu truy cập với vai trò nhân viên.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    {isLoadingEmployeeRequests ? (
                        <p className="text-center text-muted-foreground">Đang tải danh sách yêu cầu...</p>
                    ) : employeeAccessRequests.filter(req => req.requestedRole === 'employee').length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">Không có yêu cầu nhân viên nào đang chờ xử lý.</p>
                    ) : (
                        <ScrollArea className="max-h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tên</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>SĐT</TableHead>
                                        <TableHead>Địa chỉ</TableHead>
                                        <TableHead>Ngày YC</TableHead>
                                        <TableHead className="text-center">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employeeAccessRequests.filter(req => req.requestedRole === 'employee').map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell>{req.name}</TableCell>
                                            <TableCell>{req.email}</TableCell>
                                            <TableCell>{formatPhoneNumber(req.phone)}</TableCell>
                                            <TableCell className="text-xs max-w-[150px] truncate" title={req.address || 'N/A'}>{req.address || 'N/A'}</TableCell>
                                            <TableCell>{new Date(req.requestDate).toLocaleDateString('vi-VN')}</TableCell>
                                            <TableCell className="text-center space-x-1">
                                                <Button size="sm" className="bg-success hover:bg-success/90 h-7 px-2" onClick={() => handleApproveEmployeeRequest(req)}>
                                                    <CheckCircle className="h-4 w-4 mr-1"/>Duyệt
                                                </Button>
                                                <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => openRejectEmployeeDialog(req)}>
                                                    <XCircle className="h-4 w-4 mr-1"/>Từ chối
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setIsReviewEmployeeRequestsDialogOpen(false)}>Đóng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      {requestToReject && (
        <Dialog open={!!requestToReject} onOpenChange={() => setRequestToReject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Từ chối yêu cầu của {requestToReject.name}?</DialogTitle>
              <DialogDescription>
                Nhập lý do từ chối (nếu có). Lý do này sẽ được hiển thị cho người dùng.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối (tùy chọn)..."
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRequestToReject(null)}>Hủy</Button>
              <Button variant="destructive" onClick={handleConfirmRejectEmployeeRequest}>Xác nhận từ chối</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}


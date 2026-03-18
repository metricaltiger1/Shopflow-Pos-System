import { User } from './auth';
import { Product } from './pos';

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ApiError {
  error: string;
}

// User API types
export interface UserResponse extends User {
  profileImage?: string;
}

// Product API types
export interface ProductResponse extends Product {}

// Shift API types
export interface ShiftResponse {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'ended';
  totalSales: number;
  ordersCount: number;
}

// Order API types
export interface OrderResponse {
  id: string;
  items: OrderItemResponse[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp: string;
  cashierName: string;
  shiftId: string;
  paymentMethod: 'cash' | 'card' | 'mobile';
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  product?: ProductResponse;
}

// Reports API types
export interface SalesReportResponse {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrder: number;
    totalTax: number;
  };
  orders: OrderResponse[];
  topProducts: TopProductResponse[];
  staffPerformance: StaffPerformanceResponse[];
  paymentMethods: PaymentMethodSummary[];
  categorySales: CategorySales[];
}

export interface TopProductResponse {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

export interface StaffPerformanceResponse {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

export interface PaymentMethodSummary {
  method: string;
  count: number;
  amount: number;
}

export interface CategorySales {
  name: string;
  itemsSold: number;
  revenue: number;
}
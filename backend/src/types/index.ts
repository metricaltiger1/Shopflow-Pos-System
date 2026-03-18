export type Role = 'ADMIN' | 'CASHIER';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: Role
  profileImage?: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: Role;
}

export interface CreateUserRequest {
  username: string;
  fullName: string;
  email: string;
  password: string;
  role?: Role;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  category: string;
  description?: string;
  stock: number;
  tags?: string[];
}

export interface CreateOrderRequest {
  shiftId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE';
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  shiftId?: string;
}

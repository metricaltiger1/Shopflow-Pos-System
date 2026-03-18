type UserRole = 'Cashier' | 'Admin';
export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email?: string;
  profileImage?: string;
}


export interface Shift {
  id: string;
  userId: string;
  userName: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'ended';
  totalSales: number;
  ordersCount: number;
}

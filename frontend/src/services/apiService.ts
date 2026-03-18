import { apiConfig, createAuthHeaders } from '@/config/api';
import { AppSettings } from '@/stores/appStore';
import { 
  LoginResponse, 
  UserResponse, 
  ProductResponse, 
  ShiftResponse, 
  OrderResponse, 
  SalesReportResponse 
} from '@/types/api';



class ApiService {
  private baseURL = apiConfig.baseURL;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Don't set Content-Type for FormData - let the browser handle it
    const headers = options.body instanceof FormData
      ? createAuthHeaders()
      : {
          'Content-Type': 'application/json',
          ...createAuthHeaders(),
          ...options.headers
        };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // Handle empty responses for DELETE operations
      if (options.method === 'DELETE' && response.status === 204) {
        return undefined as unknown as T;
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(credentials: { username: string; password: string }): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  // Settings
  async getSettings(): Promise<AppSettings> {
    return this.request<AppSettings>('/settings');
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    return this.request<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // User Management
  async getUsers(): Promise<UserResponse[]> {
    return this.request<UserResponse[]>('/auth/users');
  }

  async createUser(userData: any, profileImage?: File): Promise<UserResponse> {
    if (profileImage) {
      const formData = new FormData();
      
      // Append all fields as strings (stringify objects)
      Object.entries(userData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      });
      
      // Append the file with a consistent field name
      formData.append('profileImage', profileImage);
      
      return this.request<UserResponse>('/auth/users', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header manually
        headers: {
          ...createAuthHeaders()
        }
      });
    }
  
  return this.request<UserResponse>('/auth/users', {
    method: 'POST',
    body: JSON.stringify(userData),
    headers: {
      'Content-Type': 'application/json',
      ...createAuthHeaders()
    }
  });
}

  async updateUser(
    id: string, 
    userData: any, 
    profileImage?: File
  ): Promise<UserResponse> {
    if (profileImage) {
      const formData = new FormData();
      
      // Stringify object fields
      Object.entries(userData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(
            key, 
            typeof value === 'object' ? JSON.stringify(value) : String(value)
          );
        }
      });
      
      formData.append('profileImage', profileImage);
      
      return this.request<UserResponse>(`/auth/users/${id}`, {
        method: 'PUT',
        body: formData,
        headers: {
          ...createAuthHeaders()
          // Let browser set Content-Type with boundary
        }
      });
    }
    
    return this.request<UserResponse>(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders()
      }
    });
  }
  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/auth/users/${id}`, { method: 'DELETE' });
  }

  // Product Management
  async getProducts(): Promise<ProductResponse[]> {
    return this.request<ProductResponse[]>('/products');
  }

  async createProduct(productData: any, image?: File): Promise<ProductResponse> {
    if (image) {
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'tags' && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      formData.append('productImage', image);
      return this.request<ProductResponse>('/products', {
        method: 'POST',
        body: formData
      });
    }
    
    return this.request<ProductResponse>('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(id: string, productData: any, image?: File): Promise<ProductResponse> {
    if (image) {
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'tags' && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      formData.append('productImage', image);
      return this.request<ProductResponse>(`/products/${id}`, {
        method: 'PUT',
        body: formData
      });
    }
    
    return this.request<ProductResponse>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/products/${id}`, { method: 'DELETE' });
  }

  // Shift Management
  async startShift(userId: string): Promise<ShiftResponse> {
    return this.request<ShiftResponse>('/shifts/start', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async endShift(shiftId: string): Promise<ShiftResponse> {
    return this.request<ShiftResponse>(`/shifts/${shiftId}/end`, {
      method: 'PUT',
      body: JSON.stringify({ 
        endTime: new Date().toISOString(),
        status: 'ENDED' 
      })
    });
  }

  async getActiveShift(userId: string): Promise<ShiftResponse | null> {
    const params = new URLSearchParams({ userId });
    const response = await this.request<ShiftResponse | number>(`/shifts/active?${params.toString()}`);
    
    if (response === 0 || response === null) {
      return null;
    }
    
    return response as ShiftResponse;
  }

  async getShiftHistory(userId: string): Promise<ShiftResponse[]> {
    const params = new URLSearchParams({ userId });
    return this.request<ShiftResponse[]>(`/shifts/history?${params.toString()}`);
  }

  // Order Management
  async createOrder(orderData: {
    shiftId: string;
    userId: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
    paymentMethod?: string;
  }): Promise<OrderResponse> {
    return this.request<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...orderData,
        paymentMethod: orderData.paymentMethod || 'CASH'
      })
    });
  }

  async getOrders(shiftId?: string): Promise<OrderResponse[]> {
    const params = shiftId ? new URLSearchParams({ shiftId }) : '';
    return this.request<OrderResponse[]>(`/orders${params ? `?${params.toString()}` : ''}`);
  }

  async downloadReceipt(orderId: string): Promise<void> {
    const url = `${this.baseURL}/orders/${orderId}/receipt`;
    const response = await fetch(url, {
      headers: createAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate receipt');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `receipt-${orderId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
  }

// Reports
async getSalesReport(filters?: {
  period?: 'day' | 'week' | 'month' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  userId?: string;
}): Promise<SalesReportResponse> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }
  return this.request<SalesReportResponse>(`/reports/sales?${params.toString()}`);
}

async downloadSalesReport(filters?: any): Promise<void> {
  const params = new URLSearchParams(filters).toString();
  const url = `${this.baseURL}/reports/sales/pdf${params ? `?${params}` : ''}`;
  
  const response = await fetch(url, {
    headers: createAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate report');
  }
  
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `sales-report-${new Date().toISOString().split('T')[0]}.pdf`;
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
}
} 

export const apiService = new ApiService();
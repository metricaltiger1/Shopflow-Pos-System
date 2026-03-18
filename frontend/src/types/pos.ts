
export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  description?: string;
  stock: number;
  tags?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp: Date;
  cashierName: string;
  shiftId: string;
  paymentMethod: 'cash' | 'card' | 'mobile';
}

export interface Receipt {
  order: Order;
  receiptNumber: string;
  shopName: string;
  shopAddress: string;
}

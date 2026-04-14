export interface ProductVariant {
  name: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand?: string;
  price: number;
  costPrice?: number;
  barcode?: string;
  stock: number;
  image: string;
  description?: string;
  variants?: ProductVariant[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: string;
}

export interface PaymentMethod {
  method: 'cash_usd' | 'cash_bs' | 'zelle' | 'pago_movil' | 'pos';
  amount: number;
}

export interface Sale {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  discount?: number;
  paymentMethods: PaymentMethod[];
  customerId?: string;
  profit?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  birthday?: string;
  points: number;
  totalPurchases: number;
}

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
}

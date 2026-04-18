export type Page = 'home' | 'pos' | 'inventory' | 'customers' | 'settings' | 'category-inventory' | 'store' | 'admin-users' | 'activity-logs';

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
  gender?: 'Hombre' | 'Mujer' | 'Unisex';
  variants?: ProductVariant[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: string;
}

export interface PaymentMethod {
  method: 'cash_usd' | 'cash_bs' | 'zelle' | 'pago_movil' | 'pos';
  amount: number;
  reference?: string;
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
  idCard?: string;
  address?: string;
  points: number;
  totalPurchases: number;
}

export interface PaymentConfig {
  pagoMovil?: { banco: string; telf: string; ci: string };
  zelle?: { email: string; nombre: string };
  transferencia?: { banco: string; cuenta: string; tipo: string; ci: string };
  paypal?: { email: string };
  binance?: { email: string; id: string };
  branding?: {
    icon192: string;
    icon512: string;
    appleTouch: string;
    favicon: string;
  };
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  paymentConfig?: PaymentConfig;
}

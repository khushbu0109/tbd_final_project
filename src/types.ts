export type StoreRoute = 'home' | 'products' | 'about' | 'journal' | 'reviews' | 'cart';
export type AdminRoute =
  | 'dashboard'
  // CATALOG
  | 'products'
  | 'add-product'
  | 'categories'
  | 'variants'
  | 'inventory'
  // SALES
  | 'orders'
  | 'orders-pending'
  | 'orders-processing'
  | 'orders-shipped'
  | 'orders-delivered'
  | 'orders-cancelled'
  | 'returns'
  // CUSTOMERS
  | 'customers'
  | 'customer-groups'
  // MARKETING
  | 'coupons'
  | 'campaigns'
  | 'banners'
  // FINANCE
  | 'payments'
  | 'transactions'
  | 'invoices'
  | 'refund-history'
  // DELIVERY
  | 'shipping-methods'
  | 'couriers'
  | 'shipment-tracking'
  // ANALYTICS
  | 'analytics-sales'
  | 'analytics-products'
  | 'analytics-customers'
  | 'analytics-inventory'
  // SYSTEM
  | 'admin-users'
  | 'roles'
  | 'activity-logs'
  | 'store-settings';

export type ProductCategory =
  | 'Daily Vitality'
  | 'Energy & Stamina'
  | 'Cellular Health'
  | 'Adaptogens'
  | 'Multivitamins';

export interface Product {
  id: string;
  sku: string;
  name: string;
  subtitle: string;
  slug: string;
  category: ProductCategory;
  shortDescription: string;
  fullDescription: string;
  regularPrice: number;
  salePrice: number;
  costPrice: number;
  subscriptionPrice?: number;
  stock: number;
  lowStockThreshold: number;
  status: 'Published' | 'Draft';
  rating: number;
  reviewCount: number;
  image: string;
  gallery?: string[];
  packSize: string;
  dosageNote: string;
  keyActives: string[];
  biomarkers: string[];
  clinicalCertified: boolean;
  createdAt: string;
  featuredTag?: string;
}

export interface IngredientItem {
  id: string;
  name: string;
  dosage: string;
  category: 'Amino Acids' | 'Botanicals' | 'Antioxidants' | 'Micros & Bio-Enhancer';
  image: string;
  benefits: [string, string];
  clinicalNote: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  subtitle: string;
  packSize: string;
  image: string;
  unitPrice: number;
  regularPrice: number;
  quantity: number;
  isSubscription: boolean;
  cadenceDays: 30 | 60 | 90;
}

export interface ReviewItem {
  id: string;
  author: string;
  initials: string;
  location: string;
  role: string;
  rating: number;
  productName: string;
  title: string;
  quote: string;
  batchCode: string;
  date: string;
  verified: boolean;
}

export interface JournalArticle {
  id: string;
  digestNumber: string;
  title: string;
  category: 'Nutrition' | 'Fitness & Lifestyle' | 'Ingredients' | 'Wellness' | 'Healthy Habits';
  readTime: string;
  author: string;
  authorRole: string;
  date: string;
  studyRef?: string;
  image: string;
  excerpt: string;
  body: string[];
  featured?: boolean;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';
export type PaymentMethod = 'Razorpay' | 'UPI' | 'Razorpay Card' | 'NetBanking' | 'COD';

export interface InvoiceLineItem {
  id?: number;
  productId?: string | null;
  sku?: string;
  name: string;
  packSize?: string | null;
  image?: string | null;
  qty: number;
  originalUnitPrice: number;
  discountAmount: number;
  unitPrice: number;
  price: number;
  isSubscription?: boolean;
  cadenceDays?: number | null;
}

export interface FullInvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId?: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerCity: string;
  billingAddress: string;
  shippingAddress: string;
  orderNotes?: string | null;
  couponCode?: string | null;
  originalSubtotal: number;
  productDiscount: number;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  otherCharges: number;
  taxableAmount: number;
  gstAmount: number;
  totalSavings: number;
  amount: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: PaymentMethod | string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  date: string;
  items: InvoiceLineItem[];
  company: {
    name: string;
    email: string;
    phone: string;
    address: string;
    gstin: string;
    website: string;
  };
}

export interface OrderRecord {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCity: string;
  billingAddress?: string;
  shippingAddress?: string;
  orderNotes?: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    sku?: string;
    image?: string;
    originalUnitPrice?: number;
    unitPrice?: number;
    discountAmount?: number;
  }>;
}

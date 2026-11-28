import type { FullInvoiceData, JournalArticle, OrderRecord, OrderStatus, Product, ReviewItem } from '../types';

const TOKEN_STORAGE_KEY = 'tbd_admin_jwt_token';

export function getAdminToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors in restricted iframes
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = getAdminToken();
  if (token && (requiresAuth || path.startsWith('/api/'))) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    const errMsg =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error?: string }).error)
        : `Request failed (${res.status})`;
    throw new Error(errMsg);
  }

  return data as T;
}

export const api = {
  // Health & Auth
  health: () => request<{ ok: boolean; db: Record<string, unknown> }>('/api/health'),
  login: (email: string, password: string) =>
    request<{
      token: string;
      admin: { id: number; fullName: string; email: string; roleKey: string; roleName: string };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ admin: Record<string, unknown> }>('/api/auth/me', {}, true),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ updated: boolean }>(
      '/api/auth/change-password',
      { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) },
      true
    ),

  // Catalog
  getProducts: () => request<Product[]>('/api/products'),
  getProduct: (id: string) =>
    request<Product & { variants: Array<Record<string, unknown>> }>(`/api/products/${encodeURIComponent(id)}`),
  createProduct: (product: Product) =>
    request<Product>('/api/products', { method: 'POST', body: JSON.stringify(product) }, true),
  updateProduct: (id: string, payload: Partial<Product>) =>
    request<Product>(`/api/products/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }, true),
  bulkUpdateProductStatus: (ids: string[], status: 'Published' | 'Draft') =>
    request<{ updated: number; status: string }>(
      '/api/products/bulk-status',
      { method: 'PATCH', body: JSON.stringify({ ids, status }) },
      true
    ),
  duplicateProduct: (id: string) =>
    request<Product>(`/api/products/${encodeURIComponent(id)}/duplicate`, { method: 'POST' }, true),
  bulkDeleteProducts: (ids: string[]) =>
    request<{ deleted: number }>(
      '/api/products/bulk-delete',
      { method: 'POST', body: JSON.stringify({ ids }) },
      true
    ),

  getCategories: () => request<Array<Record<string, unknown>>>('/api/categories'),
  createCategory: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/categories',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  updateCategory: (id: number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      `/api/categories/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      true
    ),
  deleteCategory: (id: number) =>
    request<{ deleted: boolean }>(`/api/categories/${id}`, { method: 'DELETE' }, true),

  getVariants: () => request<Array<Record<string, unknown>>>('/api/variants', {}, true),
  createVariant: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/variants',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  updateVariant: (id: number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      `/api/variants/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      true
    ),
  deleteVariant: (id: number) =>
    request<{ deleted: boolean }>(`/api/variants/${id}`, { method: 'DELETE' }, true),

  getInventory: () =>
    request<{ items: Array<Record<string, unknown>>; logs: Array<Record<string, unknown>> }>(
      '/api/inventory',
      {},
      true
    ),
  adjustInventory: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/inventory/adjust',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),

  // Razorpay Payments (Sole Checkout Payment Gateway)
  getRazorpayConfig: () =>
    request<{ configured: boolean; keyId: string | null; mode: string; currency: string }>(
      '/api/payments/razorpay/config'
    ),
  createRazorpayOrder: (payload: Record<string, unknown>) =>
    request<{
      keyId: string;
      mode: string;
      orderId: string;
      invoiceNumber: string;
      razorpayOrderId: string;
      amount: number;
      amountPaise: number;
      currency: string;
      breakdown: Record<string, unknown>;
      customer: { name: string; email: string; phone: string };
    }>('/api/payments/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  verifyRazorpayPayment: (payload: {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    request<{ verified: boolean; alreadyVerified?: boolean; order: FullInvoiceData }>(
      '/api/payments/razorpay/verify',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  reportRazorpayFailure: (payload: {
    orderId: string;
    razorpay_order_id?: string | null;
    razorpay_payment_id?: string | null;
    reason: 'failed' | 'cancelled';
    errorDescription?: string;
  }) =>
    request<{ recorded: boolean; orderId: string; paymentStatus: string; fulfillmentStatus: string }>(
      '/api/payments/razorpay/failed',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Sales
  getOrders: (status?: OrderStatus) =>
    request<OrderRecord[]>(status ? `/api/orders?status=${encodeURIComponent(status)}` : '/api/orders'),
  getOrderDetail: (orderId: string) =>
    request<FullInvoiceData>(`/api/orders/${encodeURIComponent(orderId)}`, {}, true),
  getCustomerInvoice: (orderId: string, params: { email?: string; paymentId?: string }) => {
    const qs = new URLSearchParams();
    if (params.email) qs.set('email', params.email);
    if (params.paymentId) qs.set('payment_id', params.paymentId);
    return request<FullInvoiceData>(
      `/api/orders/${encodeURIComponent(orderId)}/invoice?${qs.toString()}`
    );
  },
  updateOrderStatus: (orderId: string, status: OrderStatus) =>
    request<{ id: string; status: OrderStatus }>(
      `/api/orders/${encodeURIComponent(orderId)}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      true
    ),
  deleteOrder: (orderId: string) =>
    request<{ deleted: boolean; id: string }>(
      `/api/orders/${encodeURIComponent(orderId)}`,
      { method: 'DELETE' },
      true
    ),

  getReturns: () => request<Array<Record<string, unknown>>>('/api/returns', {}, true),
  createReturn: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/returns',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  updateReturnStatus: (id: number, status: string) =>
    request<Record<string, unknown>>(
      `/api/returns/${id}`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      true
    ),
  deleteReturn: (id: number) =>
    request<{ deleted: boolean }>(`/api/returns/${id}`, { method: 'DELETE' }, true),

  // Customers
  getCustomers: () => request<Array<Record<string, unknown>>>('/api/customers', {}, true),
  getCustomer: (id: number) => request<Record<string, unknown>>(`/api/customers/${id}`, {}, true),
  createCustomer: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/customers',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  updateCustomer: (id: number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      `/api/customers/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      true
    ),
  deleteCustomer: (id: number) =>
    request<{ deleted: boolean }>(`/api/customers/${id}`, { method: 'DELETE' }, true),

  getCustomerGroups: () => request<Array<Record<string, unknown>>>('/api/customer-groups', {}, true),
  createCustomerGroup: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/customer-groups',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  updateCustomerGroup: (id: number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      `/api/customer-groups/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      true
    ),
  deleteCustomerGroup: (id: number) =>
    request<{ deleted: boolean }>(`/api/customer-groups/${id}`, { method: 'DELETE' }, true),

  // Marketing
  getCoupons: () => request<Array<Record<string, unknown>>>('/api/coupons', {}, true),
  createCoupon: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/coupons',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  updateCoupon: (id: number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      `/api/coupons/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      true
    ),
  toggleCoupon: (id: number, is_active: boolean) =>
    request<Record<string, unknown>>(
      `/api/coupons/${id}`,
      { method: 'PATCH', body: JSON.stringify({ is_active }) },
      true
    ),
  deleteCoupon: (id: number) =>
    request<{ deleted: boolean }>(`/api/coupons/${id}`, { method: 'DELETE' }, true),
  validateCoupon: (code: string, subtotal: number) =>
    request<{ valid: boolean; code: string; discountAmount: number }>('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    }),

  getCampaigns: () => request<Array<Record<string, unknown>>>('/api/campaigns', {}, true),
  createCampaign: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/campaigns',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  updateCampaign: (id: number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      `/api/campaigns/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      true
    ),
  updateCampaignStatus: (id: number, status: string) =>
    request<Record<string, unknown>>(
      `/api/campaigns/${id}`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      true
    ),
  deleteCampaign: (id: number) =>
    request<{ deleted: boolean }>(`/api/campaigns/${id}`, { method: 'DELETE' }, true),

  getBanners: () => request<Array<Record<string, unknown>>>('/api/banners'),
  createBanner: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/banners',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  updateBanner: (id: number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      `/api/banners/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      true
    ),
  toggleBanner: (id: number, is_active: boolean) =>
    request<Record<string, unknown>>(
      `/api/banners/${id}`,
      { method: 'PATCH', body: JSON.stringify({ is_active }) },
      true
    ),
  deleteBanner: (id: number) =>
    request<{ deleted: boolean }>(`/api/banners/${id}`, { method: 'DELETE' }, true),
  getNewsletterSubscribers: () =>
    request<Array<Record<string, unknown>>>('/api/newsletter', {}, true),

  // CMS
  getBlogs: () => request<JournalArticle[]>('/api/blogs'),
  createBlog: (payload: Record<string, unknown>) =>
    request<JournalArticle>('/api/blogs', { method: 'POST', body: JSON.stringify(payload) }, true),
  deleteBlog: (id: string) =>
    request<{ deleted: boolean }>(`/api/blogs/${encodeURIComponent(id)}`, { method: 'DELETE' }, true),

  getBlogCategories: () => request<Array<Record<string, unknown>>>('/api/blog-categories'),
  createBlogCategory: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/blog-categories',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  deleteBlogCategory: (id: number) =>
    request<{ deleted: boolean }>(`/api/blog-categories/${id}`, { method: 'DELETE' }, true),

  getWebsiteContent: () => request<Array<Record<string, unknown>>>('/api/website-content'),
  saveWebsiteContent: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/website-content',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  deleteWebsiteContent: (id: number) =>
    request<{ deleted: boolean }>(`/api/website-content/${id}`, { method: 'DELETE' }, true),

  getHomepageSections: () => request<Array<Record<string, unknown>>>('/api/homepage-sections'),
  saveHomepageSection: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/homepage-sections',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  toggleHomepageSection: (id: number, is_visible: boolean) =>
    request<Record<string, unknown>>(
      `/api/homepage-sections/${id}`,
      { method: 'PATCH', body: JSON.stringify({ is_visible }) },
      true
    ),

  getAboutUs: () => request<Array<Record<string, unknown>>>('/api/about-us'),
  saveAboutUs: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/about-us',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  deleteAboutUs: (id: number) =>
    request<{ deleted: boolean }>(`/api/about-us/${id}`, { method: 'DELETE' }, true),

  getHowItWorks: () => request<Array<Record<string, unknown>>>('/api/how-it-works'),
  createHowItWorks: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/how-it-works',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  deleteHowItWorks: (id: number) =>
    request<{ deleted: boolean }>(`/api/how-it-works/${id}`, { method: 'DELETE' }, true),

  getIngredients: () => request<Array<Record<string, unknown>>>('/api/ingredients'),
  saveIngredient: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/ingredients',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  deleteIngredient: (id: string) =>
    request<{ deleted: boolean }>(`/api/ingredients/${encodeURIComponent(id)}`, { method: 'DELETE' }, true),

  getTestimonials: () => request<Array<Record<string, unknown>>>('/api/testimonials'),
  createTestimonial: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/testimonials',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  deleteTestimonial: (id: number) =>
    request<{ deleted: boolean }>(`/api/testimonials/${id}`, { method: 'DELETE' }, true),

  getReviews: () => request<ReviewItem[]>('/api/reviews'),
  createReview: (payload: Record<string, unknown>) =>
    request<ReviewItem>('/api/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  toggleReviewVerified: (id: string, verified: boolean) =>
    request<Record<string, unknown>>(
      `/api/reviews/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify({ verified }) },
      true
    ),
  deleteReview: (id: string) =>
    request<{ deleted: boolean }>(`/api/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' }, true),

  subscribeNewsletter: (email: string, source: string) =>
    request<{ subscribed: boolean }>('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email, source }),
    }),

  // Finance
  getPayments: () => request<Array<Record<string, unknown>>>('/api/payments', {}, true),
  updatePaymentStatus: (id: number, status: string) =>
    request<Record<string, unknown>>(
      `/api/payments/${id}`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      true
    ),
  getTransactions: () => request<Array<Record<string, unknown>>>('/api/transactions', {}, true),
  createTransaction: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/transactions',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  deleteTransaction: (id: number) =>
    request<{ deleted: boolean }>(`/api/transactions/${id}`, { method: 'DELETE' }, true),
  getInvoices: () => request<Array<Record<string, unknown>>>('/api/invoices', {}, true),
  getInvoiceDetail: (id: number | string) =>
    request<FullInvoiceData>(`/api/invoices/${encodeURIComponent(String(id))}`, {}, true),
  getRefundHistory: () => request<Array<Record<string, unknown>>>('/api/refund-history', {}, true),

  // Delivery
  getShippingMethods: () => request<Array<Record<string, unknown>>>('/api/shipping-methods', {}, true),
  createShippingMethod: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/shipping-methods',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  updateShippingMethod: (id: number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      `/api/shipping-methods/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      true
    ),
  toggleShippingMethod: (id: number, is_active: boolean) =>
    request<Record<string, unknown>>(
      `/api/shipping-methods/${id}`,
      { method: 'PATCH', body: JSON.stringify({ is_active }) },
      true
    ),
  deleteShippingMethod: (id: number) =>
    request<{ deleted: boolean }>(`/api/shipping-methods/${id}`, { method: 'DELETE' }, true),

  getCouriers: () => request<Array<Record<string, unknown>>>('/api/couriers', {}, true),
  createCourier: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/couriers',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  updateCourier: (id: number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      `/api/couriers/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      true
    ),
  deleteCourier: (id: number) =>
    request<{ deleted: boolean }>(`/api/couriers/${id}`, { method: 'DELETE' }, true),

  getShipments: () => request<Array<Record<string, unknown>>>('/api/shipments', {}, true),
  createShipment: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/shipments',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  updateShipment: (id: number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      `/api/shipments/${id}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      true
    ),
  deleteShipment: (id: number) =>
    request<{ deleted: boolean }>(`/api/shipments/${id}`, { method: 'DELETE' }, true),

  // Analytics
  getSalesAnalytics: () => request<Record<string, unknown>>('/api/analytics/sales', {}, true),
  getProductAnalytics: () => request<Array<Record<string, unknown>>>('/api/analytics/products', {}, true),
  getCustomerAnalytics: () => request<Record<string, unknown>>('/api/analytics/customers', {}, true),
  getInventoryAnalytics: () => request<Record<string, unknown>>('/api/analytics/inventory', {}, true),

  // System
  getAdminUsers: () => request<Array<Record<string, unknown>>>('/api/admin-users', {}, true),
  createAdminUser: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/admin-users',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  updateAdminUser: (id: number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      `/api/admin-users/${id}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      true
    ),
  deleteAdminUser: (id: number) =>
    request<{ deleted: boolean }>(`/api/admin-users/${id}`, { method: 'DELETE' }, true),

  getRoles: () => request<Array<Record<string, unknown>>>('/api/roles', {}, true),
  createRole: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      '/api/roles',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),
  updateRole: (id: number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(
      `/api/roles/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      true
    ),
  deleteRole: (id: number) =>
    request<{ deleted: boolean }>(`/api/roles/${id}`, { method: 'DELETE' }, true),

  getActivityLogs: () => request<Array<Record<string, unknown>>>('/api/activity-logs', {}, true),

  getPublicSettings: () =>
    request<{ heroStripMrp: number; homepageFeaturedProductId: string }>('/api/settings/public'),
  getSettings: () => request<Array<Record<string, unknown>>>('/api/settings', {}, true),
  saveSettings: (settings: Array<Record<string, unknown>>) =>
    request<Array<Record<string, unknown>>>(
      '/api/settings',
      { method: 'PUT', body: JSON.stringify({ settings }) },
      true
    ),
};

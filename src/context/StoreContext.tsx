import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STUDIO_MEDIA } from '../data/catalog';
import { api, getAdminToken, setAdminToken } from '../services/api';
import type {
  AdminRoute,
  CartItem,
  FullInvoiceData,
  OrderRecord,
  OrderStatus,
  Product,
  ReviewItem,
  StoreRoute,
} from '../types';

interface StoreContextValue {
  mode: 'store' | 'admin';
  storeRoute: StoreRoute;
  adminRoute: AdminRoute;
  adminAuthenticated: boolean;
  adminProfile: { fullName: string; email: string; roleName: string } | null;
  setStoreRoute: (route: StoreRoute) => void;
  setAdminRoute: (route: AdminRoute) => void;
  enterAdmin: () => void;
  loginAdmin: (email?: string, password?: string) => Promise<void>;
  logoutAdmin: () => void;
  returnToStore: (route?: StoreRoute) => void;
  refreshCoreData: () => Promise<void>;

  products: Product[];
  categories: Array<{ id: number; name: string; slug: string }>;
  heroStripMrp: number;
  homepageFeaturedProductId: string;
  updateHomepageSettings: (payload: {
    heroStripMrp?: number;
    homepageFeaturedProductId?: string;
  }) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, payload: Partial<Product>) => Promise<Product>;
  updateProductStatus: (ids: string[], status: 'Published' | 'Draft') => Promise<void>;
  deleteProducts: (ids: string[]) => Promise<void>;
  duplicateProduct: (id: string) => Promise<void>;

  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (
    product: Product,
    options?: { quantity?: number; isSubscription?: boolean; cadenceDays?: 30 | 60 | 90; openDrawer?: boolean }
  ) => void;
  addCustomAddon: (item: { id: string; name: string; subtitle: string; price: number; packSize: string }) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  toggleCartSubscription: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;

  wishlist: string[];
  toggleWishlist: (productId: string) => void;

  reviews: ReviewItem[];
  addReview: (review: Omit<ReviewItem, 'id' | 'initials' | 'date' | 'batchCode' | 'verified'>) => Promise<void>;

  orders: OrderRecord[];
  completeVerifiedOrder: (verifiedOrder: FullInvoiceData) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;

  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const INITIAL_CART: CartItem[] = [
  {
    id: 'coreaa-daily-vitality-sub',
    productId: 'coreaa-daily-vitality',
    name: 'COREAA™ Daily Vitality',
    subtitle: 'Advance Balanced Wellness Formula',
    packSize: '1 × 10 Coated Tablets',
    image: STUDIO_MEDIA.coreaaBoxPrimary,
    unitPrice: 499,
    regularPrice: 599,
    quantity: 1,
    isSubscription: true,
    cadenceDays: 30,
  },
];

function hydrateProductMedia(list: Product[]): Product[] {
  return list.map((p) => {
    if (p.id === 'coreaa-daily-vitality' && p.image === '/images/coreaa-box-1.png') {
      return {
        ...p,
        image: STUDIO_MEDIA.coreaaBoxPrimary,
        gallery: [STUDIO_MEDIA.coreaaBoxPrimary, STUDIO_MEDIA.heroDualShowcase, STUDIO_MEDIA.coreaaBoxBack],
      };
    }
    if (p.id === 'mens-favor-stamina' && p.image === '/images/ing-panax-ginseng.png') {
      return { ...p, image: STUDIO_MEDIA.mensFavor };
    }
    if (p.id === 'cellular-nad-resveratrol' && p.image === '/images/ing-astaxanthin.png') {
      return { ...p, image: STUDIO_MEDIA.nadResveratrol };
    }
    if (p.id === 'smart-vitality-tracker' && p.image === '/images/hero-studio-bg.png') {
      return { ...p, image: STUDIO_MEDIA.smartTracker };
    }
    return p;
  });
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'store' | 'admin'>('store');
  const [storeRoute, setStoreRouteState] = useState<StoreRoute>('home');
  const [adminRoute, setAdminRoute] = useState<AdminRoute>('dashboard');
  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(Boolean(getAdminToken()));
  const [adminProfile, setAdminProfile] = useState<{
    fullName: string;
    email: string;
    roleName: string;
  } | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [heroStripMrp, setHeroStripMrp] = useState<number>(499);
  const [homepageFeaturedProductId, setHomepageFeaturedProductId] =
    useState<string>('coreaa-daily-vitality');
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [wishlist, setWishlist] = useState<string[]>(['coreaa-daily-vitality']);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  const refreshCoreData = useCallback(async () => {
    try {
      const [dbProducts, dbOrders, dbReviews, dbCategories, publicSettings] = await Promise.all([
        api.getProducts(),
        api.getOrders(),
        api.getReviews(),
        api.getCategories(),
        api.getPublicSettings().catch(() => null),
      ]);
      if (Array.isArray(dbProducts)) {
        setProducts(hydrateProductMedia(dbProducts));
      }
      if (Array.isArray(dbOrders)) {
        setOrders(dbOrders);
      }
      if (Array.isArray(dbReviews)) {
        setReviews(dbReviews);
      }
      if (Array.isArray(dbCategories)) {
        setCategories(
          dbCategories.map((c) => ({
            id: Number(c.id),
            name: String(c.name),
            slug: String(c.slug),
          }))
        );
      }
      if (publicSettings) {
        if (Number.isFinite(publicSettings.heroStripMrp) && publicSettings.heroStripMrp > 0) {
          setHeroStripMrp(publicSettings.heroStripMrp);
        }
        if (publicSettings.homepageFeaturedProductId) {
          setHomepageFeaturedProductId(publicSettings.homepageFeaturedProductId);
        }
      }
    } catch (err) {
      console.error('[StoreContext] MySQL sync error:', err);
    }
  }, []);

  const updateHomepageSettings = useCallback(
    async (payload: { heroStripMrp?: number; homepageFeaturedProductId?: string }) => {
      const updates: Array<Record<string, unknown>> = [];
      if (payload.heroStripMrp !== undefined) {
        updates.push({
          setting_key: 'hero_strip_mrp',
          setting_group: 'Homepage',
          label: 'Hero Strip MRP (₹)',
          setting_value: String(Math.round(payload.heroStripMrp)),
        });
      }
      if (payload.homepageFeaturedProductId !== undefined) {
        updates.push({
          setting_key: 'homepage_featured_product_id',
          setting_group: 'Homepage',
          label: 'Homepage Featured Product',
          setting_value: payload.homepageFeaturedProductId,
        });
      }
      if (!updates.length) return;
      await api.saveSettings(updates);
      if (payload.heroStripMrp !== undefined) {
        setHeroStripMrp(Math.round(payload.heroStripMrp));
      }
      if (payload.homepageFeaturedProductId !== undefined) {
        setHomepageFeaturedProductId(payload.homepageFeaturedProductId);
      }
      showToast('Homepage display settings saved to MySQL.');
    },
    [showToast]
  );

  useEffect(() => {
    void refreshCoreData();
    const token = getAdminToken();
    if (token) {
      api
        .me()
        .then((res) => {
          const a = res.admin as { full_name?: string; email?: string; role_name?: string };
          setAdminAuthenticated(true);
          setAdminProfile({
            fullName: a.full_name || 'Executive Admin',
            email: a.email || 'admin@tbdwellness.com',
            roleName: a.role_name || 'Executive Super Admin',
          });
        })
        .catch(() => {
          setAdminToken(null);
          setAdminAuthenticated(false);
        });
    }
  }, [refreshCoreData]);

  const setStoreRoute = (route: StoreRoute) => {
    setMode('store');
    setStoreRouteState(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const enterAdmin = () => {
    setMode('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loginAdmin = async (email = 'admin@tbdwellness.com', password = 'ClinicalVitality#2025') => {
    const res = await api.login(email, password);
    setAdminToken(res.token);
    setAdminAuthenticated(true);
    setAdminProfile({
      fullName: res.admin.fullName,
      email: res.admin.email,
      roleName: res.admin.roleName,
    });
    setAdminRoute('dashboard');
    await refreshCoreData();
    showToast(`Signed in as ${res.admin.fullName}`);
  };

  const logoutAdmin = () => {
    setAdminToken(null);
    setAdminAuthenticated(false);
    setAdminProfile(null);
    showToast('Signed out of Admin Portal');
  };

  const returnToStore = (route: StoreRoute = 'home') => {
    setMode('store');
    setStoreRouteState(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addProduct = async (product: Product) => {
    try {
      const saved = await api.createProduct(product);
      setProducts((prev) => [saved, ...prev]);
      showToast(`${saved.name} saved to MySQL catalog (${saved.status})`);
    } catch (err) {
      showToast(`Failed to save product: ${(err as Error).message}`);
      throw err;
    }
  };

  const updateProduct = async (id: string, payload: Partial<Product>) => {
    try {
      const saved = await api.updateProduct(id, payload);
      const [hydrated] = hydrateProductMedia([saved]);
      setProducts((prev) => prev.map((p) => (p.id === id ? hydrated : p)));
      showToast(`${hydrated.name} updated in MySQL`);
      return hydrated;
    } catch (err) {
      showToast(`Failed to update product: ${(err as Error).message}`);
      throw err;
    }
  };

  const updateProductStatus = async (ids: string[], status: 'Published' | 'Draft') => {
    try {
      await api.bulkUpdateProductStatus(ids, status);
      setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, status } : p)));
      showToast(`Updated ${ids.length} product${ids.length > 1 ? 's' : ''} to ${status}`);
    } catch (err) {
      showToast(`Update failed: ${(err as Error).message}`);
    }
  };

  const deleteProducts = async (ids: string[]) => {
    try {
      await api.bulkDeleteProducts(ids);
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
      showToast(`Removed ${ids.length} product${ids.length > 1 ? 's' : ''} from MySQL`);
    } catch (err) {
      showToast(`Delete failed: ${(err as Error).message}`);
    }
  };

  const duplicateProduct = async (id: string) => {
    try {
      const copy = await api.duplicateProduct(id);
      setProducts((prev) => [copy, ...prev]);
      showToast(`Duplicated "${copy.name}" as Draft`);
    } catch (err) {
      showToast(`Duplicate failed: ${(err as Error).message}`);
    }
  };

  const addToCart: StoreContextValue['addToCart'] = (product, options) => {
    const qty = options?.quantity ?? 1;
    const isSub = options?.isSubscription ?? false;
    const cadence = options?.cadenceDays ?? 30;
    const lineId = `${product.id}-${isSub ? `sub-${cadence}` : 'once'}`;
    const unitPrice = isSub
      ? product.subscriptionPrice ?? Math.round(product.salePrice * 0.85)
      : product.salePrice > 0
      ? product.salePrice
      : product.regularPrice;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === lineId);
      if (existing) {
        return prev.map((item) =>
          item.id === lineId ? { ...item, quantity: Math.min(12, item.quantity + qty) } : item
        );
      }
      return [
        ...prev,
        {
          id: lineId,
          productId: product.id,
          name: product.name,
          subtitle: product.subtitle,
          packSize: product.packSize,
          image: product.image,
          unitPrice,
          regularPrice: product.regularPrice,
          quantity: qty,
          isSubscription: isSub,
          cadenceDays: cadence,
        },
      ];
    });

    if (options?.openDrawer !== false) {
      setCartOpen(true);
    }
    showToast(`Added ${product.name} to cart`);
  };

  const addCustomAddon: StoreContextValue['addCustomAddon'] = (addon) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === addon.id);
      if (existing) {
        return prev.map((i) => (i.id === addon.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          id: addon.id,
          productId: addon.id,
          name: addon.name,
          subtitle: addon.subtitle,
          packSize: addon.packSize,
          image: STUDIO_MEDIA.ingMultiminerals,
          unitPrice: addon.price,
          regularPrice: addon.price,
          quantity: 1,
          isSubscription: false,
          cadenceDays: 30,
        },
      ];
    });
    showToast(`Added ${addon.name} to cart`);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const toggleCartSubscription = (id: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextSub = !item.isSubscription;
        const nextPrice = nextSub
          ? Math.round(item.regularPrice * 0.85)
          : item.productId === 'coreaa-daily-vitality'
          ? 599
          : item.regularPrice;
        return {
          ...item,
          isSubscription: nextSub,
          unitPrice: item.productId === 'coreaa-daily-vitality' ? (nextSub ? 499 : 599) : nextPrice,
        };
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const addReview: StoreContextValue['addReview'] = async (review) => {
    const saved = await api.createReview(review);
    setReviews((prev) => [saved, ...prev]);
    showToast('Your clinical review has been published to MySQL');
  };

  const completeVerifiedOrder: StoreContextValue['completeVerifiedOrder'] = (verifiedOrder) => {
    const orderRecord: OrderRecord = {
      id: verifiedOrder.id,
      customerName: verifiedOrder.customerName,
      customerEmail: verifiedOrder.customerEmail,
      customerPhone: verifiedOrder.customerPhone || undefined,
      customerCity: verifiedOrder.customerCity,
      billingAddress: verifiedOrder.billingAddress,
      shippingAddress: verifiedOrder.shippingAddress,
      orderNotes: verifiedOrder.orderNotes || undefined,
      date: verifiedOrder.date,
      amount: verifiedOrder.amount,
      paymentMethod: 'Razorpay',
      paymentStatus: verifiedOrder.paymentStatus,
      status: verifiedOrder.status,
      razorpayOrderId: verifiedOrder.razorpayOrderId || undefined,
      razorpayPaymentId: verifiedOrder.razorpayPaymentId || undefined,
      items: verifiedOrder.items.map((it) => ({
        name: it.name,
        qty: it.qty,
        price: it.price,
        sku: it.sku,
        image: it.image || undefined,
        originalUnitPrice: it.originalUnitPrice,
        unitPrice: it.unitPrice,
        discountAmount: it.discountAmount,
      })),
    };
    setOrders((prev) => [orderRecord, ...prev.filter((o) => o.id !== orderRecord.id)]);
    clearCart();
    void refreshCoreData();
    showToast(`Razorpay payment verified · Order ${orderRecord.id} confirmed`);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      showToast(`Order ${orderId} updated to ${status}`);
    } catch (err) {
      showToast(`Failed to update order: ${(err as Error).message}`);
    }
  };

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [cart]
  );

  const value: StoreContextValue = {
    mode,
    storeRoute,
    adminRoute,
    adminAuthenticated,
    adminProfile,
    setStoreRoute,
    setAdminRoute,
    enterAdmin,
    loginAdmin,
    logoutAdmin,
    returnToStore,
    refreshCoreData,
    products,
    categories,
    heroStripMrp,
    homepageFeaturedProductId,
    updateHomepageSettings,
    addProduct,
    updateProduct,
    updateProductStatus,
    deleteProducts,
    duplicateProduct,
    cart,
    cartOpen,
    setCartOpen,
    addToCart,
    addCustomAddon,
    updateCartQuantity,
    toggleCartSubscription,
    removeFromCart,
    clearCart,
    cartCount,
    cartSubtotal,
    wishlist,
    toggleWishlist,
    reviews,
    addReview,
    orders,
    completeVerifiedOrder,
    updateOrderStatus,
    toastMessage,
    showToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

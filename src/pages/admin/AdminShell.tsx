import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  ExternalLink,
  FolderTree,
  Image,
  Layers,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Package,
  PackageCheck,
  PieChart,
  Plus,
  PlusCircle,
  Receipt,
  RefreshCw,
  RotateCcw,
  Settings,
  Shield,
  ShoppingCart,
  Tag,
  TicketPercent,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { TbdLogo } from '../../components/TbdLogo';
import type { AdminRoute } from '../../types';

interface AdminShellProps {
  children: React.ReactNode;
}

interface SidebarItem {
  route: AdminRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?:
    | 'allOrders'
    | 'pendingOrders'
    | 'processingOrders'
    | 'shippedOrders'
    | 'deliveredOrders'
    | 'cancelledOrders'
    | 'lowStock'
    | 'allProducts';
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: 'OVERVIEW',
    items: [{ route: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard }],
  },
  {
    title: 'CATALOG',
    items: [
      { route: 'products', label: 'All Products', icon: Package, badgeKey: 'allProducts' },
      { route: 'add-product', label: 'Add New Product', icon: PlusCircle },
      { route: 'categories', label: 'Categories', icon: FolderTree },
      { route: 'variants', label: 'Product Variants', icon: Layers },
      { route: 'inventory', label: 'Inventory Management', icon: Boxes, badgeKey: 'lowStock' },
    ],
  },
  {
    title: 'SALES',
    items: [
      { route: 'orders', label: 'All Orders', icon: ShoppingCart, badgeKey: 'allOrders' },
      { route: 'orders-pending', label: 'Pending Orders', icon: Clock, badgeKey: 'pendingOrders' },
      {
        route: 'orders-processing',
        label: 'Processing Orders',
        icon: RefreshCw,
        badgeKey: 'processingOrders',
      },
      { route: 'orders-shipped', label: 'Shipped Orders', icon: Truck, badgeKey: 'shippedOrders' },
      {
        route: 'orders-delivered',
        label: 'Delivered Orders',
        icon: CheckCircle2,
        badgeKey: 'deliveredOrders',
      },
      {
        route: 'orders-cancelled',
        label: 'Cancelled Orders',
        icon: XCircle,
        badgeKey: 'cancelledOrders',
      },
      { route: 'returns', label: 'Returns & Refunds', icon: RotateCcw },
    ],
  },
  {
    title: 'PATIENTS',
    items: [
      { route: 'customers', label: 'All Patients', icon: Users },
      { route: 'customer-groups', label: 'Patient Groups', icon: UsersRound },
    ],
  },
  {
    title: 'MARKETING',
    items: [
      { route: 'coupons', label: 'Coupons & Discounts', icon: TicketPercent },
      { route: 'campaigns', label: 'Promotional Campaigns', icon: Megaphone },
      { route: 'banners', label: 'Homepage Banners', icon: Image },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { route: 'payments', label: 'Payments', icon: CreditCard },
      { route: 'transactions', label: 'Transactions', icon: ClipboardList },
      { route: 'invoices', label: 'Invoices', icon: Receipt },
      { route: 'refund-history', label: 'Refund History', icon: RotateCcw },
    ],
  },
  {
    title: 'DELIVERY',
    items: [
      { route: 'shipping-methods', label: 'Shipping Methods', icon: Tag },
      { route: 'couriers', label: 'Courier Management', icon: Truck },
      { route: 'shipment-tracking', label: 'Shipment Tracking', icon: PackageCheck },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { route: 'analytics-sales', label: 'Sales Reports', icon: TrendingUp },
      { route: 'analytics-products', label: 'Product Reports', icon: BarChart3 },
      { route: 'analytics-customers', label: 'Patient Reports', icon: PieChart },
      { route: 'analytics-inventory', label: 'Inventory Reports', icon: Boxes },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { route: 'admin-users', label: 'Admin Users', icon: UserCog },
      { route: 'roles', label: 'Roles & Permissions', icon: Shield },
      { route: 'activity-logs', label: 'Activity Logs', icon: Activity },
      { route: 'store-settings', label: 'Store Settings', icon: Settings },
    ],
  },
];

const ROUTE_META: Record<AdminRoute, { section: string; title: string }> = SIDEBAR_SECTIONS.reduce(
  (acc, section) => {
    for (const item of section.items) {
      acc[item.route] = { section: section.title, title: item.label };
    }
    return acc;
  },
  {} as Record<AdminRoute, { section: string; title: string }>
);

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const { adminRoute, setAdminRoute, adminProfile, returnToStore, logoutAdmin, orders, products } =
    useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const badges = useMemo(() => {
    const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold).length;
    return {
      allProducts: products.length,
      lowStock,
      allOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === 'Pending').length,
      processingOrders: orders.filter((o) => o.status === 'Processing').length,
      shippedOrders: orders.filter((o) => o.status === 'Shipped').length,
      deliveredOrders: orders.filter((o) => o.status === 'Delivered').length,
      cancelledOrders: orders.filter((o) => o.status === 'Cancelled').length,
    };
  }, [orders, products]);

  const navigate = (route: AdminRoute) => {
    setAdminRoute(route);
    setMobileOpen(false);
  };

  const currentMeta = ROUTE_META[adminRoute] ?? {
    section: 'OVERVIEW',
    title: 'Executive Overview',
  };

  const renderBadge = (badgeKey?: SidebarItem['badgeKey'], isActive?: boolean) => {
    if (!badgeKey) return null;
    const count = badges[badgeKey];
    if (!count) return null;

    if (badgeKey === 'lowStock') {
      return (
        <span className="ml-2 shrink-0 rounded-full bg-amber-400/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-300 tabular-nums">
          {count} low
        </span>
      );
    }

    const highlightWarn = badgeKey === 'pendingOrders' || badgeKey === 'processingOrders';
    return (
      <span
        className={`ml-2 shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums ${
          isActive
            ? 'bg-white/20 text-white'
            : highlightWarn
            ? 'bg-[#16B5E6]/20 text-[#7AD9F7]'
            : 'bg-white/10 text-[#B8CDE4]'
        }`}
      >
        {count}
      </span>
    );
  };

  const SidebarContent = (
    <div className="flex h-full flex-col bg-[#061B3A] text-white">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <TbdLogo variant="dark" size="sm" />
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1 text-[#9BB5D2] hover:text-white lg:hidden cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Categorized Navigation */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4 space-y-5"
        aria-label="Admin Navigation"
      >
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase text-[#7E9CC0]">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = adminRoute === item.route;
                return (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => navigate(item.route)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium transition cursor-pointer ${
                      active
                        ? 'bg-[#075CA8] text-white shadow-xs'
                        : 'text-[#C5D8EC] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          active ? 'text-[#7AD9F7]' : 'text-[#89A8CB]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {renderBadge(item.badgeKey, active)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-white/10 p-3 bg-[#051630]">
        <button
          type="button"
          onClick={() => returnToStore('home')}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[#B8CDE4] transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <ExternalLink className="h-4 w-4" />
          <span>View Storefront</span>
        </button>
        <button
          type="button"
          onClick={logoutAdmin}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[#FCA5A5] transition hover:bg-white/10 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  const initials = (adminProfile?.fullName || 'DR')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="flex min-h-screen bg-[#F4F7FB] text-[#061B3A]">
      {/* Desktop Sticky Scrollable Sidebar */}
      <aside className="hidden w-68 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">{SidebarContent}</div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-[#061B3A]/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-72 max-w-[85vw] h-full" onClick={(e) => e.stopPropagation()}>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#D8E2EA] bg-white/95 px-4 backdrop-blur-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open admin navigation"
              className="rounded-lg p-1.5 text-[#061B3A] hover:bg-[#F3F7FB] lg:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate font-mono text-[10px] font-semibold uppercase tracking-wider text-[#008FD3]">
                {currentMeta.section} / {currentMeta.title}
              </p>
              <h1 className="truncate font-display text-base font-bold text-[#061B3A] sm:text-lg">
                {currentMeta.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {adminRoute !== 'add-product' && (
              <button
                type="button"
                onClick={() => setAdminRoute('add-product')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#075CA8] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#004481] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Product</span>
              </button>
            )}
            <div
              title={adminProfile ? `${adminProfile.fullName} (${adminProfile.email})` : 'Executive Admin'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E9F6FD] font-display text-xs font-bold text-[#075CA8]"
            >
              {initials || 'AD'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

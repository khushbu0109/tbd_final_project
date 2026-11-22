import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { StoreProvider, useStore } from './context/StoreContext';
import { StoreHeader } from './components/StoreHeader';
import { StoreFooter } from './components/StoreFooter';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { AboutPage } from './pages/AboutPage';
import { JournalPage } from './pages/JournalPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { CartPage } from './pages/CartPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminShell } from './pages/admin/AdminShell';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminAddProductPage } from './pages/admin/AdminAddProductPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import {
  AdminCategoriesView,
  AdminInventoryView,
  AdminVariantsView,
} from './pages/admin/AdminCatalogModules';
import {
  AdminBannersView,
  AdminCampaignsView,
  AdminCouponsView,
  AdminCustomerGroupsView,
  AdminCustomersView,
  AdminReturnsView,
} from './pages/admin/AdminSalesCustomersMarketing';
import {
  AdminCouriersView,
  AdminInvoicesView,
  AdminPaymentsView,
  AdminRefundHistoryView,
  AdminShipmentTrackingView,
  AdminShippingMethodsView,
  AdminTransactionsView,
} from './pages/admin/AdminFinanceDeliveryModules';
import {
  AdminActivityLogsView,
  AdminCustomerReportView,
  AdminInventoryReportView,
  AdminProductReportView,
  AdminRolesView,
  AdminSalesReportView,
  AdminStoreSettingsView,
  AdminUsersView,
} from './pages/admin/AdminAnalyticsSystemModules';

const AppRouter: React.FC = () => {
  const { mode, storeRoute, adminRoute, adminAuthenticated, toastMessage } = useStore();

  const renderStorePage = () => {
    switch (storeRoute) {
      case 'products':
        return <ProductsPage />;
      case 'about':
        return <AboutPage />;
      case 'journal':
        return <JournalPage />;
      case 'reviews':
        return <ReviewsPage />;
      case 'cart':
        return <CartPage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  const renderAdminPage = () => {
    switch (adminRoute) {
      // CATALOG
      case 'products':
        return <AdminProductsPage />;
      case 'add-product':
        return <AdminAddProductPage />;
      case 'categories':
        return <AdminCategoriesView />;
      case 'variants':
        return <AdminVariantsView />;
      case 'inventory':
        return <AdminInventoryView />;

      // SALES
      case 'orders':
        return <AdminOrdersPage presetStatus="All" />;
      case 'orders-pending':
        return <AdminOrdersPage presetStatus="Pending" />;
      case 'orders-processing':
        return <AdminOrdersPage presetStatus="Processing" />;
      case 'orders-shipped':
        return <AdminOrdersPage presetStatus="Shipped" />;
      case 'orders-delivered':
        return <AdminOrdersPage presetStatus="Delivered" />;
      case 'orders-cancelled':
        return <AdminOrdersPage presetStatus="Cancelled" />;
      case 'returns':
        return <AdminReturnsView />;

      // CUSTOMERS
      case 'customers':
        return <AdminCustomersView />;
      case 'customer-groups':
        return <AdminCustomerGroupsView />;

      // MARKETING
      case 'coupons':
        return <AdminCouponsView />;
      case 'campaigns':
        return <AdminCampaignsView />;
      case 'banners':
        return <AdminBannersView />;

      // FINANCE
      case 'payments':
        return <AdminPaymentsView />;
      case 'transactions':
        return <AdminTransactionsView />;
      case 'invoices':
        return <AdminInvoicesView />;
      case 'refund-history':
        return <AdminRefundHistoryView />;

      // DELIVERY
      case 'shipping-methods':
        return <AdminShippingMethodsView />;
      case 'couriers':
        return <AdminCouriersView />;
      case 'shipment-tracking':
        return <AdminShipmentTrackingView />;

      // ANALYTICS
      case 'analytics-sales':
        return <AdminSalesReportView />;
      case 'analytics-products':
        return <AdminProductReportView />;
      case 'analytics-customers':
        return <AdminCustomerReportView />;
      case 'analytics-inventory':
        return <AdminInventoryReportView />;

      // SYSTEM
      case 'admin-users':
        return <AdminUsersView />;
      case 'roles':
        return <AdminRolesView />;
      case 'activity-logs':
        return <AdminActivityLogsView />;
      case 'store-settings':
        return <AdminStoreSettingsView />;

      // OVERVIEW
      case 'dashboard':
      default:
        return <AdminDashboardPage />;
    }
  };

  return (
    <>
      {mode === 'admin' ? (
        adminAuthenticated ? (
          <AdminShell>{renderAdminPage()}</AdminShell>
        ) : (
          <AdminLoginPage />
        )
      ) : (
        <div className="flex min-h-screen flex-col bg-[#F9F9FF]">
          <StoreHeader />
          <main className="flex-1">{renderStorePage()}</main>
          <StoreFooter />
          <CartDrawer />
        </div>
      )}

      {/* Global Accessible Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-2.5 rounded-xl border border-[#075CA8]/25 bg-[#061B3A] px-4 py-3 text-xs font-medium text-white shadow-[0_14px_30px_rgba(6,27,58,0.28)]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16B5E6]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  );
};

export default App;

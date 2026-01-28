import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import GroupBuyPage from './features/deals/GroupBuyPage';
import { BillingPage } from './features/billing/BillingPage';
import { KhataPage } from './features/khata/KhataPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { CustomerPage } from './features/customers/CustomerPage';
import { ProductPage } from './features/products/ProductPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { PaymentPage } from './features/payments/PaymentPage';
import { LedgerPage } from './features/ledger/LedgerPage';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<BillingPage />} />
                <Route path="deals" element={<GroupBuyPage />} />
                <Route path="khata" element={<KhataPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="customers" element={<CustomerPage />} />
                <Route path="products" element={<ProductPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="payments" element={<PaymentPage />} />
                <Route path="ledger" element={<LedgerPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </CartProvider>
    </ToastProvider>
  );
}

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Payable from "./pages/Payable";
import Receivable from "./pages/Receivable";
import Reports from "./pages/Reports";
import Suppliers from "./pages/Suppliers";
import Clients from "./pages/Clients";
import Machines from "./pages/Machines";
import PixKeys from "./pages/PixKeys";
import NotFound from "./pages/NotFound";
import Layout from "@/components/layout/Layout";
import { Products } from "./pages/Products";
import ItemProducts from "./pages/ItemProducts";
import PDVPage from "./pages/pdv/PDVPage";
import PaymentPage from "./pages/pdv/PaymentPage";
import SuccessPage from "./pages/pdv/SuccessPage";
import Sales from "./pages/Sales";
import Orders from "./pages/Orders";
import SettingsPage from "./pages/SettingsPage";
import ReportsProducts from "./pages/reports/ReportsProducts";
import ReportsDaily from "./pages/reports/ReportsDaily";
import ReportsPayments from "./pages/reports/ReportsPayments";
import ReportsTypes from "./pages/reports/ReportsTypes";
import { CatalogPage } from "./pages/CatalogPage";
import { CheckoutPage } from "./pages/CheckoutPage";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange={false}
    storageKey="paola-theme"
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/cardapio" element={<CatalogPage />} />
            <Route path="/cardapio/checkout" element={<CheckoutPage />} />

            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/payable" element={<Payable />} />
              <Route path="/receivable" element={<Receivable />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/products" element={<ReportsProducts />} />
              <Route path="/reports/daily" element={<ReportsDaily />} />
              <Route path="/reports/payments" element={<ReportsPayments />} />
              <Route path="/reports/types" element={<ReportsTypes />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/machines" element={<Machines />} />
              <Route path="/pix-keys" element={<PixKeys />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product-items" element={<ItemProducts />} />
              <Route path="/pdv" element={<PDVPage />} />
              <Route path="/pdv/payment" element={<PaymentPage />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/pdv/success" element={<SuccessPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;


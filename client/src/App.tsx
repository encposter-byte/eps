import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";

// Layout Components
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/MobileNavigation";
import MobileCategoryDrawer from "@/components/mobile/MobileCategoryDrawer";

// Pages
import Home from "@/pages/home";
import ProductDetails from "@/pages/product-details";
// Category page removed - using Home with filter instead
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderComplete from "@/pages/order-complete";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import VerifyEmailPage from "@/pages/verify-email";
import PasswordResetPage from "@/pages/password-reset-page";
import PublicationsPage from "@/pages/publications";
import AboutPage from "@/pages/about";
import ContactsPage from "@/pages/contacts";
// Products page removed - all products shown on Home page

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import ProductManagement from "@/pages/admin/product-management";
import ProductFormPage from "@/pages/admin/product-form-page";
import CategoryManagement from "@/pages/admin/category-management";
import OrderManagement from "@/pages/admin/order-management";
import UserManagement from "@/pages/admin/user-management";

function Router() {
  const [location, setLocation] = useLocation();
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);

  // Check if the current route is an admin route
  const isAdminRoute = location.startsWith("/admin");

  const handleCategorySelect = (slug: string) => {
    setLocation(`/?category=${slug}`);
    setCategoryDrawerOpen(false);
  };

  return (
    <>
      {!isAdminRoute && <Header />}

      <main className={isAdminRoute ? "bg-gray-50 min-h-screen" : "pb-16 lg:pb-0"}>
        <Switch>
          {/* Public Routes */}
          <Route path="/" component={Home} />
          <Route path="/product/:slug" component={ProductDetails} />
          {/* Category page removed - using /?category=slug instead */}
          <Route path="/cart" component={Cart} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/verify-email" component={VerifyEmailPage} />
          <Route path="/password-reset" component={PasswordResetPage} />
          <Route path="/password-reset/reset" component={PasswordResetPage} />
          <Route path="/publications" component={PublicationsPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/contacts" component={ContactsPage} />

          {/* Protected Routes (требуют авторизации) */}
          <ProtectedRoute path="/checkout" component={Checkout} />
          <ProtectedRoute path="/order-complete/:id" component={OrderComplete} />
          <ProtectedRoute path="/profile" component={Profile} />

          {/* Admin Routes */}
          <ProtectedRoute path="/admin" component={AdminDashboard} />
          <ProtectedRoute path="/admin/products" component={ProductManagement} />
          <ProtectedRoute path="/admin/products/create" component={ProductFormPage} />
          <ProtectedRoute path="/admin/products/edit/:id" component={ProductFormPage} />
          <ProtectedRoute path="/admin/categories" component={CategoryManagement} />
          <ProtectedRoute path="/admin/orders" component={OrderManagement} />
          <ProtectedRoute path="/admin/users" component={UserManagement} />

          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>

      {!isAdminRoute && (
        <>
          <Footer />
          <MobileNavigation onCategoriesClick={() => setCategoryDrawerOpen(true)} />
          <MobileCategoryDrawer
            open={categoryDrawerOpen}
            onOpenChange={setCategoryDrawerOpen}
            onCategorySelect={handleCategorySelect}
          />
        </>
      )}
    </>
  );
}

function App() {
  // Дата обновления для сброса кеша
  const updateVersion = "15.05.2025.13:30";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router />
            <InstallAppPrompt />
            <Toaster />
            {/* Невидимый элемент с информацией о версии */}
            <div style={{ display: "none" }} data-version={updateVersion}></div>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
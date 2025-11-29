import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ShopProvider } from "@/contexts/ShopContext";
import { ShopMenuProvider } from "@/contexts/ShopMenuContext";
// Removed DemoModeBanner import as it is no longer used
// import { StorageDebugger } from "@/lib/debugStorage";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import ShopDetail from "./pages/ShopDetail";
import ShopSetup from "./pages/ShopSetup";
import MenuManagement from "./pages/MenuManagement";
import NotFound from "./pages/NotFound";
import UserNotifications from "@/pages/UserNotifications";
import AdminOrders from "@/pages/AdminOrders";
import UserOrders from "./pages/UserOrders";
import AdminAnalytics from "./pages/AdminAnalytics";
import ShopMenu from "./pages/ShopMenu";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    // Suppress fetch errors globally to prevent console spam
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (
        typeof message === "string" &&
        (message.includes("Failed to fetch") ||
          message.includes("NetworkError") ||
          message.includes("ERR_NETWORK"))
      ) {
        // Silently ignore network errors - they're handled by fallback logic
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Handle unhandled promise rejections for fetch errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        typeof event.reason === "object" &&
        (event.reason.message?.includes("Failed to fetch") ||
          event.reason.message?.includes("NetworkError") ||
          event.reason.name === "TypeError")
      ) {
        // Prevent the error from being logged
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Cleanup
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/home" element={<UserDashboard />} />
        <Route path="/shops/:shopId" element={<ShopDetail />} />
        <Route path="/shop/:shopId/menu" element={<ShopMenu />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/shop-setup" element={<ShopSetup />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/menu" element={<MenuManagement />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/developer" element={<DeveloperDashboard />} />
        <Route path="/orders" element={<UserDashboard />} />
        <Route path="/notifications" element={<UserNotifications />} />
        <Route path="/user/orders" element={<UserOrders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        {/* Catch-all route - must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
        <AuthProvider>
          <ShopProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ShopMenuProvider>
                <AppContent />
              </ShopMenuProvider>
            </BrowserRouter>
          </ShopProvider>
        </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

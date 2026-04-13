import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import BrandingLoader from "./components/BrandingLoader";
import { GoogleOAuthProvider } from '@react-oauth/google';

// Eager imports (critical path)
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";

// Lazy imports (code-split)
const HomePage = lazy(() => import("./pages/HomePage"));
const Landing = lazy(() => import("./pages/Landing"));
const Shop3D = lazy(() => import("./pages/Shop3D"));
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const Racks = lazy(() => import("./pages/Racks"));
const ShopBuilder = lazy(() => import("./pages/ShopBuilder"));
const Scanner = lazy(() => import("./pages/Scanner"));
const Notifications = lazy(() => import("./pages/Notifications"));
const SmartStore = lazy(() => import("./pages/SmartStore"));
const Billing = lazy(() => import("./pages/Billing"));
const Orders = lazy(() => import("./pages/Orders"));
const Delivery = lazy(() => import("./pages/Delivery"));
const Logistics = lazy(() => import("./pages/Logistics"));
const Profile = lazy(() => import("./pages/Profile"));
const CustomerSearch = lazy(() => import("./pages/CustomerSearch"));
const ShopperCatalog = lazy(() => import("./pages/ShopperCatalog"));
const Categories = lazy(() => import("./pages/Categories"));
const Deals = lazy(() => import("./pages/Deals"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Users = lazy(() => import("./pages/Users"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));

// Godown lazy imports
const GodownLayout = lazy(() => import("./components/GodownLayout"));
const GodownOverview = lazy(() => import("./pages/Godown/Overview"));
const GodownBuilder = lazy(() => import("./pages/Godown/Builder"));
const ManageRacks = lazy(() => import("./pages/Godown/ManageRacks"));
const ManageShelves = lazy(() => import("./pages/Godown/ManageShelves"));
const GodownStock = lazy(() => import("./pages/Godown/Stock"));
const StockTransfer = lazy(() => import("./pages/Godown/Transfer"));
const GodownReports = lazy(() => import("./pages/Godown/Reports"));
const GodownSettings = lazy(() => import("./pages/Godown/Settings"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <BrandingLoader />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/login" replace />;
};

// Guests see HomePage, logged-in users see the 3D store
const GuestOrStoreRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <BrandingLoader />;
  return user ? <CustomerSearch /> : <Navigate to="/home" replace />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={<BrandingLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* ── Public / Guest routes ── */}
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/landing" element={<Landing />} />

          {/* ── App shell (sidebar + layout) ── */}
          <Route element={<AppLayout />}>
            {/* Admin-only */}
            <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/products" element={<AdminRoute><Products /></AdminRoute>} />
            <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
            <Route path="/racks" element={<AdminRoute><Racks /></AdminRoute>} />
            <Route path="/shop-builder" element={<AdminRoute><ShopBuilder /></AdminRoute>} />
            <Route path="/scanner" element={<AdminRoute><Scanner /></AdminRoute>} />
            <Route path="/smartstore" element={<AdminRoute><SmartStore /></AdminRoute>} />
            <Route path="/billing" element={<AdminRoute><Billing /></AdminRoute>} />
            <Route path="/audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
            <Route path="/logistics" element={<AdminRoute><Logistics /></AdminRoute>} />

            {/* Godown Routes */}
            <Route path="/godown" element={<AdminRoute><GodownLayout /></AdminRoute>}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<GodownOverview />} />
              <Route path="builder" element={<GodownBuilder />} />
              <Route path="racks" element={<ManageRacks />} />
              <Route path="shelves" element={<ManageShelves />} />
              <Route path="stock" element={<GodownStock />} />
              <Route path="transfer" element={<StockTransfer />} />
              <Route path="reports" element={<GodownReports />} />
              <Route path="settings" element={<GodownSettings />} />
            </Route>

            {/* Root → HomePage for guests, CustomerSearch for logged-in users */}
            <Route path="/" element={<GuestOrStoreRoute />} />
            <Route path="/shop-experience" element={<Shop3D />} />
            <Route path="/explore" element={<Navigate to="/" replace />} />

            {/* Shopper routes (protected) */}
            <Route path="/catalog" element={<ProtectedRoute><ShopperCatalog /></ProtectedRoute>} />
            <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
            <Route path="/deals" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/delivery" element={<ProtectedRoute><Delivery /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/help" element={<HelpCenter />} />
          </Route>


          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

const AppContent = () => (
  <div className="flex min-h-screen flex-col bg-white">
    <Navbar />
    <AnimatedRoutes />
  </div>
);

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID || "";
const IS_LOCALHOST = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Google OAuth is disabled on localhost unless you've added your dev origin
// in Google Cloud Console → Credentials → OAuth Client → Authorized JavaScript origins.
// To enable: add http://localhost:5173 in your Google Cloud Console.
const GOOGLE_OAUTH_ENABLED = GOOGLE_CLIENT_ID && !IS_LOCALHOST;

const GoogleWrapper = ({ children }: { children: React.ReactNode }) => {
  if (!GOOGLE_OAUTH_ENABLED) return <>{children}</>;
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
};

const App = () => (
  <GoogleWrapper>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner position="top-right" expand={true} richColors closeButton />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </GoogleWrapper>
);


export default App;


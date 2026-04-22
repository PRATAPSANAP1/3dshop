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
const Coupons = lazy(() => import("./pages/Coupons"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));

// New multi-tenant pages
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));
const Employees = lazy(() => import("./pages/Employees"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));

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
  return (user?.role === 'admin' || user?.role === 'superadmin') ? <>{children}</> : <Navigate to="/login" replace />;
};

const EmployeeRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (user?.role === 'employee' || user?.role === 'admin' || user?.role === 'superadmin')
    ? <>{children}</>
    : <Navigate to="/login" replace />;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === 'superadmin' ? <>{children}</> : <Navigate to="/login" replace />;
};

// Smart redirect based on role
const SmartRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <BrandingLoader />;
  if (!user) return <Navigate to="/home" replace />;
  switch (user.role) {
    case 'superadmin': return <Navigate to="/superadmin/dashboard" replace />;
    case 'admin': return <Navigate to="/dashboard" replace />;
    case 'employee': return <Navigate to="/employee-dashboard" replace />;
    default: return <CustomerSearch />;
  }
};

// Guests see HomePage, logged-in users see the 3D store
const GuestOrStoreRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <BrandingLoader />;
  return user ? <SmartRedirect /> : <Navigate to="/home" replace />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={<BrandingLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* â”€â”€ Public / Guest routes â”€â”€ */}
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/landing" element={<Landing />} />

          {/* â”€â”€ App shell (sidebar + layout) â”€â”€ */}
          <Route element={<AppLayout />}>
            {/* Admin-only */}
            <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/products" element={<AdminRoute><Products /></AdminRoute>} />
            <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
            <Route path="/racks" element={<AdminRoute><Racks /></AdminRoute>} />
            <Route path="/shop-builder" element={<AdminRoute><ShopBuilder /></AdminRoute>} />
            <Route path="/scanner" element={<EmployeeRoute><Scanner /></EmployeeRoute>} />
            <Route path="/smartstore" element={<AdminRoute><SmartStore /></AdminRoute>} />
            <Route path="/billing" element={<AdminRoute><Billing /></AdminRoute>} />
            <Route path="/audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
            <Route path="/coupons" element={<AdminRoute><Coupons /></AdminRoute>} />
            <Route path="/logistics" element={<AdminRoute><Logistics /></AdminRoute>} />
            <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />

            {/* Employee dashboard */}
            <Route path="/employee-dashboard" element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>} />

            {/* Superadmin routes */}
            <Route path="/superadmin/dashboard" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />

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

            {/* Root â†’ Smart redirect */}
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



const App = () => (
  <>
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
  </>
);



export default App;

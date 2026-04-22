import { Outlet, useLocation } from "react-router-dom";
import AppSidebar, { AppSidebarContent } from "./AppSidebar";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Store, Sparkles } from "lucide-react";
import ShopperSidebar, { ShopperSidebarContent } from "./ShopperSidebar";
import EmployeeSidebar, { EmployeeSidebarContent } from "./EmployeeSidebar";
import HamburgerButton from "./HamburgerButton";
import MobileBottomNav from "./MobileBottomNav";
import { motion } from "framer-motion";

const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminOrSuperadmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isEmployee = user?.role === 'employee';
  const isAdminLike = isAdminOrSuperadmin || isEmployee;
  const is3DPage = location.pathname === '/';

  return (
    <div className={`flex ${is3DPage ? 'h-[100dvh] md:h-screen overflow-hidden' : 'min-h-screen'} bg-background flex-col md:flex-row`}>
      {isAdminOrSuperadmin ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="md:hidden mobile-header"
          >
            <div className="mobile-header-brand">
              <Sheet>
                <SheetTrigger asChild>
                  <HamburgerButton />
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-r-0 flex flex-col bg-white/95 backdrop-blur-xl">
                  <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">Access admin controls, products, users and settings</SheetDescription>
                  <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md shrink-0"
                      style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)" }}
                    >
                      <Store size={20} />
                    </motion.div>
                    <div>
                      <p className="font-heading text-lg font-black tracking-tighter uppercase leading-none">
                        <span className="text-gradient">3D</span>
                        <span className="text-slate-900 lowercase font-bold tracking-tight">shop</span>
                      </p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mt-0.5">Admin Portal</p>
                    </div>
                  </div>
                  <AppSidebarContent />
                </SheetContent>
              </Sheet>
              <div>
                <h1 className="font-heading text-lg font-black tracking-tighter uppercase leading-none flex items-baseline gap-0.5">
                  <span className="text-gradient">3D</span>
                  <span className="text-slate-800 lowercase font-bold tracking-tight text-base">shop</span>
                </h1>
                <div className="mobile-header-badge mt-1">
                  <div className="badge-dot" />
                  <span>Admin</span>
                </div>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100/50 shadow-sm"
            >
              <Sparkles size={15} className="text-orange-500" />
            </motion.div>
          </motion.div>
          <AppSidebar />
        </>
      ) : isEmployee ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="md:hidden mobile-header"
          >
            <div className="mobile-header-brand">
              <Sheet>
                <SheetTrigger asChild>
                  <HamburgerButton />
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-r-0 flex flex-col bg-white/95 backdrop-blur-xl">
                  <SheetTitle className="sr-only">Employee Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">Access employee tools and features</SheetDescription>
                  <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md shrink-0"
                      style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)" }}
                    >
                      <Store size={20} />
                    </motion.div>
                    <div>
                      <p className="font-heading text-lg font-black tracking-tighter uppercase leading-none">
                        <span className="text-gradient">3D</span>
                        <span className="text-slate-900 lowercase font-bold tracking-tight">shop</span>
                      </p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mt-0.5">Employee Hub</p>
                    </div>
                  </div>
                  <EmployeeSidebarContent />
                </SheetContent>
              </Sheet>
              <div>
                <h1 className="font-heading text-lg font-black tracking-tighter uppercase leading-none flex items-baseline gap-0.5">
                  <span className="text-gradient">3D</span>
                  <span className="text-slate-800 lowercase font-bold tracking-tight text-base">shop</span>
                </h1>
                <div className="mobile-header-badge mt-1">
                  <div className="badge-dot" />
                  <span>Employee</span>
                </div>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100/50 shadow-sm"
            >
              <Sparkles size={15} className="text-orange-500" />
            </motion.div>
          </motion.div>
          <EmployeeSidebar />
        </>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="md:hidden mobile-header"
          >
            <div className="mobile-header-brand">
              <Sheet>
                <SheetTrigger asChild>
                  <HamburgerButton />
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-r-0 flex flex-col bg-white/95 backdrop-blur-xl">
                  <SheetTitle className="sr-only">Store Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">Explore products, categories, cart and profile</SheetDescription>
                  <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 3 }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm shrink-0"
                      style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)" }}
                    >
                      <Store size={20} />
                    </motion.div>
                    <div>
                      <p className="font-heading text-lg font-black tracking-tighter uppercase leading-none">
                        <span className="text-gradient">3D</span>
                        <span className="text-slate-900 lowercase font-bold tracking-tight">shop</span>
                      </p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mt-0.5">Store Explorer</p>
                    </div>
                  </div>
                  <ShopperSidebarContent />
                </SheetContent>
              </Sheet>
              <div>
                <h1 className="font-heading text-lg font-black tracking-tighter uppercase leading-none flex items-baseline gap-0.5">
                  <span className="text-gradient">3D</span>
                  <span className="text-slate-800 lowercase font-bold tracking-tight text-base">shop</span>
                </h1>
                <div className="mobile-header-badge mt-1">
                  <div className="badge-dot" />
                  <span>Explorer</span>
                </div>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100/50 shadow-sm"
            >
              <Store size={15} className="text-orange-500" />
            </motion.div>
          </motion.div>
          <ShopperSidebar />
        </>
      )}
      <main className={`flex-1 md:ml-64 max-w-[1600px] w-full mx-auto ${
        is3DPage
          ? 'overflow-hidden p-0'
          : 'px-3 sm:px-5 py-4 md:py-10 lg:py-12 pb-24 md:pb-12'
      }`}>
        <div className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ${is3DPage ? 'h-full' : ''}`}>
           <Outlet />
        </div>
      </main>
      {!isAdminLike && <MobileBottomNav />}
    </div>
  );
};

export default AppLayout;

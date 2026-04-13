import { Outlet, useLocation } from "react-router-dom";
import GodownSidebar, { GodownSidebarContent } from "./GodownSidebar";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import HamburgerButton from "./HamburgerButton";
import { motion } from "framer-motion";
import { Warehouse, Sparkles } from "lucide-react";

const GodownLayout = () => {
  const location = useLocation();
  const isBuilder = location.pathname.includes('builder');

  return (
    <div className="flex min-h-screen bg-[#FFFFFF] flex-col md:flex-row">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:hidden mobile-header-godown bg-white border-b border-orange-100 px-5 py-4 flex items-center justify-between sticky top-0 z-50"
      >
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <HamburgerButton />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r-0 bg-[#EA580C] text-white">
              <SheetTitle className="sr-only">Godown Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Access warehouse builder, stock, racks and reports</SheetDescription>
              <GodownSidebarContent />
            </SheetContent>
          </Sheet>
          <div>
            <h1 className="font-heading text-lg font-black tracking-tighter uppercase leading-none">
              <span className="text-[#EA580C]">3D</span>
              <span className="text-slate-900 lowercase font-bold tracking-tight">shop</span>
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Godown Panel</span>
            </div>
          </div>
        </div>
        <motion.div
           whileHover={{ scale: 1.05 }}
           className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm border border-orange-100"
        >
          <Sparkles size={16} />
        </motion.div>
      </motion.div>

      <GodownSidebar />

      <main className={cn(
        "flex-1 md:ml-72 w-full mx-auto p-4 md:p-8 lg:p-12 pb-24 md:pb-12 min-h-screen",
        isBuilder ? "p-0 md:p-0 lg:p-0 overflow-hidden h-screen" : "bg-[#FFF7F3]/30"
      )}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn("h-full", isBuilder ? "" : "max-w-7xl mx-auto")}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

// Simple utility as we don't want to import it from elsewhere if not needed
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default GodownLayout;

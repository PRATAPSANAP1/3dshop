import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Box,
  ScanLine,
  Bell,
  BarChart3,
  User,
  Receipt,
  ShoppingCart,
  Truck,
  Store,
  ShoppingBag,
  LogOut,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Users,
  ScrollText,
  Warehouse,
  Ticket,
  UserPlus,
  Building2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { to: "/shop-experience", icon: Sparkles,       label: "Shop Vision",  desc: "Interactive 3D Map",   color: "text-amber-600",  bg: "bg-amber-500/10" },
  { to: "/dashboard",   icon: LayoutDashboard,label: "Analytics",    desc: "Performance metrics",  color: "text-orange-500", bg: "bg-orange-500/10" },
  { to: "/products",    icon: Package,        label: "Products",     desc: "Manage SKUs",          color: "text-orange-500", bg: "bg-orange-500/10" },
  { to: "/racks",       icon: Box,            label: "Racks",        desc: "Spatial mapping",      color: "text-amber-600",  bg: "bg-amber-500/10" },
  { to: "/shop-builder",icon: Store,          label: "3D Builder",   desc: "Store design",         color: "text-amber-600",  bg: "bg-amber-500/10" },
  { to: "/godown",      icon: Warehouse,      label: "Godown",       desc: "Private warehouse",    color: "text-orange-600", bg: "bg-orange-500/10" },
  { to: "/scanner",     icon: ScanLine,       label: "QR Scanner",   desc: "Batch operations",     color: "text-orange-500", bg: "bg-orange-500/10" },
  { to: "/delivery",    icon: Truck,          label: "Delivery Hub", desc: "Assign & verify",      color: "text-amber-600",  bg: "bg-amber-500/10" },
  { to: "/logistics",   icon: Truck,          label: "Logistics",    desc: "Fleet overview",       color: "text-blue-500",   bg: "bg-blue-500/10" },
  { to: "/smartstore",  icon: BarChart3,      label: "AI Insights",  desc: "Smart predictions",    color: "text-amber-600",  bg: "bg-amber-500/10" },
  { to: "/users",       icon: Users,          label: "User Base",    desc: "Manage members",       color: "text-orange-500", bg: "bg-orange-500/10" },
  { to: "/billing",     icon: Receipt,        label: "Billing",      desc: "Transactions",         color: "text-amber-600",  bg: "bg-amber-500/10" },
  { to: "/orders",      icon: ShoppingCart,   label: "Orders",       desc: "Manage fulfillment",   color: "text-orange-500", bg: "bg-orange-500/10" },
  { to: "/audit-logs",  icon: ScrollText,     label: "Audit Logs",   desc: "System activity",      color: "text-slate-600",  bg: "bg-slate-500/10" },
  { to: "/coupons",     icon: Ticket,         label: "Coupons",      desc: "Marketing engine",     color: "text-rose-500",   bg: "bg-rose-500/10" },
  { to: "/employees",   icon: UserPlus,       label: "Employees",    desc: "Team management",      color: "text-violet-500", bg: "bg-violet-500/10" },
  { to: "/shops",       icon: Building2,      label: "Shops",        desc: "Manage instances",     color: "text-emerald-600",bg: "bg-emerald-500/10" },
];
export const AppSidebarContent = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const filteredItems = navItems;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-6 py-6 pb-2">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Management Suite</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <div className="space-y-1">
          {filteredItems.map((item, i) => {
            const isActive = location.pathname === item.to;
            return (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <NavLink
                  to={item.to}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative ${
                    isActive ? "bg-slate-50 shadow-sm border border-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 shrink-0 ${isActive ? item.bg : "bg-slate-50 group-hover:bg-slate-100"}`}>
                    <item.icon className={`h-[18px] w-[18px] transition-colors ${isActive ? item.color : "text-slate-400"}`} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                     <p className={`text-[13px] font-bold truncate transition-colors ${isActive ? "text-slate-900" : "text-slate-600"}`}>{item.label}</p>
                  </div>
                  {isActive && (
                    <motion.div 
                       layoutId="admin-active-bar"
                       className="absolute right-0 h-6 w-1 bg-primary rounded-l-full"
                    />
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 px-3 border-t border-slate-50 pt-6">
           <NavLink
             to="/profile"
             className={({ isActive }) => `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
               isActive ? "bg-slate-50 border border-slate-100 shadow-sm" : "hover:bg-slate-50"
             }`}
           >
             <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-slate-100 transition-all">
                <User className="h-[18px] w-[18px] text-slate-400" />
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">My Profile</p>
                <p className="text-[10px] text-slate-400 font-medium">Account Settings</p>
             </div>
           </NavLink>
        </div>
      </div>

      <div className="border-t border-slate-100 p-4 mt-auto">
        <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-bold group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500 group-hover:bg-rose-100 transition-colors">
             <LogOut className="h-4 w-4" />
          </div>
          <span className="text-[13px]">Logout</span>
        </button>
      </div>
    </div>
  );
};

const AppSidebar = () => {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed left-0 top-0 z-40 hidden md:flex h-screen w-64 flex-col border-r border-slate-100 bg-white shadow-sm"
    >
      <div className="p-6 border-b border-slate-50 flex items-center gap-3">
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.1 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm"
        >
          <Store size={22} />
        </motion.div>
        <div>
          <p className="font-heading text-lg font-black text-slate-900 tracking-tighter uppercase">3D<span className="text-primary lowercase font-bold tracking-tight">shop</span></p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Admin Portal</p>
        </div>
      </div>
      <AppSidebarContent />
    </motion.aside>
  );
};

export default AppSidebar;

import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Store, Package, ShoppingCart, User, LogOut, Truck,
  Search, Bell, LayoutDashboard, ScanLine,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePermission, EmployeePermission } from "@/hooks/usePermission";

interface NavItem {
  to: string;
  icon: any;
  label: string;
  desc: string;
  color: string;
  bg: string;
  activeBg: string;
  permission?: EmployeePermission;
}

const navItems: NavItem[] = [
  { to: "/employee-dashboard", icon: LayoutDashboard, label: "Dashboard", desc: "Overview", color: "text-orange-500", bg: "bg-orange-500/10", activeBg: "bg-gradient-to-r from-orange-500/15 to-amber-500/10" },
  { to: "/orders", icon: Package, label: "Orders", desc: "Track orders", color: "text-blue-500", bg: "bg-blue-500/10", activeBg: "bg-gradient-to-r from-blue-500/15 to-blue-400/10", permission: "VIEW_ORDERS" },
  { to: "/delivery", icon: Truck, label: "Delivery", desc: "Delivery queue", color: "text-emerald-500", bg: "bg-emerald-500/10", activeBg: "bg-gradient-to-r from-emerald-500/15 to-teal-400/10", permission: "UPDATE_DELIVERY_STATUS" },
  { to: "/scanner", icon: ScanLine, label: "Scanner", desc: "QR / POS", color: "text-purple-500", bg: "bg-purple-500/10", activeBg: "bg-gradient-to-r from-purple-500/15 to-violet-400/10", permission: "USE_SCANNER" },
  { to: "/products", icon: Search, label: "Products", desc: "Browse stock", color: "text-amber-500", bg: "bg-amber-500/10", activeBg: "bg-gradient-to-r from-amber-500/15 to-orange-400/10", permission: "VIEW_PRODUCTS" },
];

const EmployeeNavItem = ({ item, index }: { item: NavItem; index: number }) => {
  const location = useLocation();
  const isActive = location.pathname === item.to;
  const hasPermission = item.permission ? usePermission(item.permission) : true;

  if (!hasPermission) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <NavLink
        to={item.to}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden ${
          isActive
            ? `${item.activeBg} shadow-sm border border-slate-100/80`
            : "hover:bg-slate-50"
        }`}
      >
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 shrink-0 ${
          isActive ? `${item.bg} shadow-sm` : "bg-slate-50 group-hover:bg-slate-100"
        }`}>
          <item.icon className={`h-[18px] w-[18px] transition-colors duration-300 ${
            isActive ? item.color : "text-slate-400 group-hover:text-slate-600"
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-bold leading-none transition-colors duration-300 ${
            isActive ? "text-slate-900" : "text-slate-600"
          }`}>{item.label}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{item.desc}</p>
        </div>
        {isActive && (
          <motion.div
            layoutId="employee-indicator"
            className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-l-full"
            style={{ background: "linear-gradient(180deg, #EA580C, #D97706)" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </NavLink>
    </motion.div>
  );
};

export const EmployeeSidebarContent = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-4 pb-2">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Employee Panel</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        <div className="space-y-1">
          {navItems.map((item, i) => (
            <EmployeeNavItem key={item.to} item={item} index={i} />
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-2">Account</p>
          <NavLink
            to="/profile"
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 group-hover:bg-slate-100">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <span className="text-[13px] font-bold text-slate-500">Profile</span>
          </NavLink>
        </div>
      </div>
      {user && (
        <div className="border-t border-slate-100 p-3 mt-auto">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-bold group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500 group-hover:bg-rose-100">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-[13px]">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

const EmployeeSidebar = () => {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 z-40 hidden md:flex h-screen w-64 flex-col bg-white border-r border-slate-100 shadow-sm"
    >
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.05, rotate: 3 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm shrink-0"
          style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)" }}
        >
          <Store size={20} className="text-white" />
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
    </motion.aside>
  );
};

export default EmployeeSidebar;

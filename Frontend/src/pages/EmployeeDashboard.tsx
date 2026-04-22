import { motion } from "framer-motion";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import PageTransition from "@/components/PageTransition";
import {
  Package, Truck, ScanLine, BarChart3, Box,
  ShieldAlert, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PermissionCard = ({
  title, desc, icon: Icon, color, bg, available, onClick
}: {
  title: string; desc: string; icon: any; color: string; bg: string; available: boolean; onClick?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={available ? { y: -4, transition: { duration: 0.2 } } : {}}
    onClick={available ? onClick : undefined}
    className={`relative p-6 rounded-[2rem] border transition-all overflow-hidden ${
      available
        ? "bg-white border-slate-100 cursor-pointer hover:shadow-lg hover:border-slate-200 group"
        : "bg-slate-50 border-slate-100/60 opacity-60"
    }`}
  >
    <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center mb-4 ${
      available ? "group-hover:scale-110" : ""
    } transition-transform`}>
      <Icon size={22} className={color} />
    </div>
    <h3 className="font-black text-base text-slate-900 uppercase tracking-tight mb-1">{title}</h3>
    <p className="text-xs text-slate-400 font-medium">{desc}</p>
    {!available && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-[2rem]">
        <div className="flex items-center gap-2 text-slate-400">
          <ShieldAlert size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">No access</span>
        </div>
      </div>
    )}
    {available && (
      <div className="absolute top-6 right-6 h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-orange-500 group-hover:text-white transition-all">
        <ArrowRight size={14} />
      </div>
    )}
  </motion.div>
);

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const canViewStats = usePermission("VIEW_DASHBOARD_STATS");
  const canViewOrders = usePermission("VIEW_ORDERS");
  const canUpdateDelivery = usePermission("UPDATE_DELIVERY_STATUS");
  const canUseScanner = usePermission("USE_SCANNER");
  const canViewProducts = usePermission("VIEW_PRODUCTS");
  const canManageStock = usePermission("MANAGE_INVENTORY_STOCK");

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-8 py-6 px-4">
        <header>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
            <span className="text-primary">employee dashboard</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Welcome, <span className="text-orange-500 not-italic">{(user as any)?.name || 'Team Member'}.</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
            Your workspace — access only the tools assigned to you.
          </p>
        </header>

        {/* Quick Stats Row */}
        {canViewStats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              { label: "Today's Orders", value: "—", color: "text-blue-600" },
              { label: "Pending Delivery", value: "—", color: "text-amber-600" },
              { label: "Low Stock Items", value: "—", color: "text-rose-500" },
              { label: "Scanner Sessions", value: "—", color: "text-purple-600" },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-xl font-black italic ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Permission Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PermissionCard
            title="Orders" desc="View and manage customer orders"
            icon={Package} color="text-blue-500" bg="bg-blue-50"
            available={canViewOrders} onClick={() => navigate("/orders")}
          />
          <PermissionCard
            title="Delivery" desc="Update delivery status and verify OTPs"
            icon={Truck} color="text-emerald-500" bg="bg-emerald-50"
            available={canUpdateDelivery} onClick={() => navigate("/delivery")}
          />
          <PermissionCard
            title="Scanner" desc="Scan products for billing or stock"
            icon={ScanLine} color="text-purple-500" bg="bg-purple-50"
            available={canUseScanner} onClick={() => navigate("/scanner")}
          />
          <PermissionCard
            title="Products" desc="Browse product catalog and stock levels"
            icon={Box} color="text-amber-500" bg="bg-amber-50"
            available={canViewProducts} onClick={() => navigate("/products")}
          />
          <PermissionCard
            title="Stock Management" desc="Adjust inventory and stock levels"
            icon={BarChart3} color="text-rose-500" bg="bg-rose-50"
            available={canManageStock} onClick={() => navigate("/products")}
          />
          <PermissionCard
            title="Dashboard Stats" desc="View analytics and metrics"
            icon={BarChart3} color="text-orange-500" bg="bg-orange-50"
            available={canViewStats} onClick={() => navigate("/dashboard")}
          />
        </div>
      </div>
    </PageTransition>
  );
};

export default EmployeeDashboard;

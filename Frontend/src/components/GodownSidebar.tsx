import { Link, useLocation } from "react-router-dom";
import { 
  Warehouse, 
  LayoutDashboard, 
  Box, 
  Settings, 
  ClipboardList, 
  BarChart3, 
  ArrowLeftRight, 
  Construction, 
  ArrowLeft,
  Layers,
  Grid3X3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const sidebarLinks = [
  { icon: LayoutDashboard, label: "Overview", href: "/godown/overview" },
  { icon: Construction, label: "Godown Builder", href: "/godown/builder" },
  { icon: Grid3X3, label: "Manage Racks", href: "/godown/racks" },
  { icon: Layers, label: "Manage Shelves", href: "/godown/shelves" },
  { icon: Box, label: "Godown Stock", href: "/godown/stock" },
  { icon: ArrowLeftRight, label: "Stock Transfer", href: "/godown/transfer" },
  { icon: BarChart3, label: "Godown Reports", href: "/godown/reports" },
  { icon: Settings, label: "Godown Settings", href: "/godown/settings" },
];

export const GodownSidebarContent = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full text-white">
      <div className="p-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
            <Warehouse size={28} className="text-white" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-black tracking-tighter uppercase leading-none">
              GODOWN
            </h2>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">
              Private Warehouse
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar pt-6">
        {sidebarLinks.map((link) => {
          const isActive = location.pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden",
                isActive 
                  ? "bg-white/20 text-white shadow-lg" 
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 top-0 bottom-0 w-1.5 bg-white rounded-r-full"
                />
              )}
              <Icon size={20} className={cn("shrink-0 transition-transform duration-300", isActive && "scale-110")} />
              <span className="font-bold text-sm tracking-wide">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link
          to="/dashboard"
          className="flex items-center gap-4 px-5 py-4 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 transition-all font-bold text-sm"
        >
          <ArrowLeft size={18} />
          <span>Back to Admin Panel</span>
        </Link>
      </div>
    </div>
  );
};

const GodownSidebar = () => {
  return (
    <aside className="hidden md:flex flex-col w-72 h-screen bg-[#EA580C] fixed top-0 left-0 z-50 border-r border-white/10 shadow-2xl">
      <GodownSidebarContent />
    </aside>
  );
};

export default GodownSidebar;

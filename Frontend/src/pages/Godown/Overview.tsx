import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Warehouse, 
  Grid3X3, 
  Box, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Zap,
  Plus,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { Link } from "react-router-dom";

const GodownOverview = () => {
  const [stats, setStats] = useState({
    totalGodowns: 0,
    totalRacks: 0,
    totalProducts: 0,
    lowStock: 0,
    capacity: 0
  });

  const [godowns, setGodowns] = useState<any[]>([]);

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const { data } = await api.get('/godowns/overview');
        setStats(data.stats);
        setGodowns(data.godowns || []);
        setRecentActivity(data.recentActivity || []);
      } catch (err) {
        console.error("Failed to fetch godown overview", err);
      }
    };
    fetchOverview();
  }, []);

  const statsCards = [
    { 
      label: "Total Godowns", 
      value: stats.totalGodowns, 
      sub: "▲ 1 added this month", 
      icon: Warehouse, 
      color: "border-[#EA580C]",
      subColor: "text-green-500"
    },
    { 
      label: "Total Racks", 
      value: stats.totalRacks, 
      sub: "▲ 6 added this week", 
      icon: Grid3X3, 
      color: "border-[#EA580C]",
      subColor: "text-green-500"
    },
    { 
      label: "Products Stored", 
      value: stats.totalProducts, 
      sub: "▲ 80 added today", 
      icon: Box, 
      color: "border-[#EA580C]",
      subColor: "text-green-500"
    },
    { 
      label: "Low Stock Alerts", 
      value: stats.lowStock, 
      sub: "▼ Need immediate refill", 
      icon: AlertTriangle, 
      color: "border-red-500",
      iconColor: "text-red-500",
      valueColor: "text-red-600",
      subColor: "text-red-500"
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            My <span className="text-[#EA580C] not-italic">Godown</span>
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
            Manage your private warehouse, racks and stock
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="h-12 px-6 rounded-2xl bg-white border-2 border-[#EA580C] text-[#EA580C] hover:bg-orange-50 font-black uppercase tracking-widest text-[10px] transition-all">
            Stock Transfer
          </Button>
          <Button className="h-12 px-6 rounded-2xl bg-[#EA580C] text-white hover:bg-orange-600 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20 gap-2">
            <Plus size={16} strokeWidth={3} /> Add Godown
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white p-6 rounded-[1.5rem] border-t-4 ${card.color} shadow-lg shadow-orange-500/5 group hover:shadow-orange-500/10 transition-all border-l border-r border-b border-orange-100/50`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#EA580C] group-hover:scale-110 transition-transform">
                <card.icon size={24} className={card.iconColor} />
              </div>
              <TrendingUp size={16} className="text-slate-300" />
            </div>
            <p className="text-3xl font-black text-slate-900 font-mono tracking-tighter mb-1">
              {card.value.toLocaleString()}
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              {card.label}
            </p>
            <p className={`text-[10px] font-black uppercase tracking-widest ${card.subColor}`}>
              {card.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Godown List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-black text-slate-900 uppercase italic">
              Your <span className="text-[#EA580C] not-italic">Godowns</span>
            </h2>
            <Link to="/godown/settings" className="text-[10px] font-black text-[#EA580C] uppercase tracking-widest hover:underline">
              Manage All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {godowns.length === 0 ? (
              <div className="col-span-2 text-center p-8 text-slate-400 font-bold border-2 border-dashed rounded-2xl">
                No godowns found. Create one to get started.
              </div>
            ) : (
              godowns.map((g: any, index: number) => (
              <motion.div
                key={g._id || index}
                whileHover={{ y: -5 }}
                className="bg-white rounded-[2rem] border border-orange-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="h-16 bg-gradient-to-r from-[#EA580C] to-orange-600 p-6 flex items-center justify-between">
                  <h3 className="font-heading text-white font-black tracking-tight uppercase">
                    {g.name || `Godown ${index + 1}`}
                  </h3>
                  <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <Zap size={12} className="text-white" />
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Warehouse size={14} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">{g.location || `Location ${index + 1}`}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Racks</p>
                       <p className="font-mono text-lg font-black text-slate-900">{g.racksCount || 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Products</p>
                       <p className="font-mono text-lg font-black text-[#EA580C]">{g.productsCount || 0}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacity Used</p>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{g.capacityUsed || 0}%</p>
                    </div>
                    <div className="h-2 w-full bg-orange-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${g.capacityUsed || 0}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-[#EA580C]" 
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button className="flex-1 h-11 rounded-xl bg-[#EA580C] text-white hover:bg-orange-600 font-black uppercase tracking-widest text-[9px]">
                      View Details
                    </Button>
                    <Button variant="outline" className="h-11 w-11 rounded-xl border-orange-100 text-[#EA580C] hover:bg-orange-50">
                      <Settings size={16} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-black text-slate-900 uppercase italic">
              Recent <span className="text-[#EA580C] not-italic">Activity</span>
            </h2>
          </div>

          <div className="bg-white rounded-[2rem] border border-orange-100 p-6 space-y-4 shadow-sm">
            {recentActivity.map((activity, i) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-2xl bg-slate-50 border-l-4 border-[#EA580C] flex gap-4 group hover:bg-orange-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-[#EA580C] shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                  {activity.type === "transfer" ? <ArrowRight size={18} /> : 
                   activity.type === "creation" ? <Plus size={18} /> : 
                   activity.type === "alert" ? <AlertTriangle size={18} /> : <Clock size={18} />}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-700 leading-tight">
                    {activity.action}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {activity.time}
                  </p>
                </div>
              </motion.div>
            ))}
            <Button variant="ghost" className="w-full text-xs font-black text-slate-400 uppercase tracking-widest hover:text-[#EA580C]">
              View Full History <ArrowUpRight size={14} className="ml-2" />
            </Button>
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-gradient-to-br from-[#EA580C] to-orange-700 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-orange-500/20">
            <Zap className="absolute -right-4 -bottom-4 text-white/10 h-32 w-32 rotate-12" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Next Transfer Window</p>
            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-4">TODAY: <span className="text-orange-200">04:00 PM</span></h3>
            <p className="text-sm font-medium text-white/80 leading-relaxed mb-6">
              Total 120 items queued for Store transfer. Finalize the list before 3:30 PM.
            </p>
            <Button className="bg-white text-[#EA580C] hover:bg-orange-50 h-11 w-full rounded-xl font-black uppercase tracking-widest text-[9px]">
              Prepare Transfer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Settings icon for quick use
const Settings = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

export default GodownOverview;

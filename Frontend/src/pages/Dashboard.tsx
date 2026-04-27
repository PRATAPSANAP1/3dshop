import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar 
} from "recharts";
import PageTransition from "@/components/PageTransition";
import StatCard from "@/components/StatCard";
import SkeletonCard from "@/components/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, IndianRupee, AlertTriangle, TrendingUp, 
  RefreshCw, CheckCheck, ShoppingBag, PieChart as PieIcon,
  Zap, ArrowUpRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

const COLORS = ['#EA580C', '#D97706', '#F59E0B', '#10B981', '#F97316', '#92400E'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) return null;

  return (
    <PageTransition>
      <div className="space-y-4 max-w-7xl mx-auto px-4 -mt-4">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="space-y-0.5">
             <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                ADMIN <span className="text-orange-500 not-italic">ANALYTICS.</span>
             </h1>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Consolidated Performance Intelligence</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black tracking-widest text-slate-600 uppercase">Live Operations</span>
             <Button onClick={fetchStats} disabled={loading} variant="ghost" size="sm" className="h-7 rounded-lg font-black text-[8px] uppercase tracking-widest">
                <RefreshCw size={10} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
             </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard onClick={() => navigate("/products")} icon={Package} title="Total Products" value={stats?.totalProducts || 0} change={stats?.dynamicStats?.ordGrowth || "Tracking"} delay={0} accentColor="text-orange-500" accentBg="bg-orange-500/5" />
          <StatCard onClick={() => navigate("/orders")} icon={IndianRupee} title="Net Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} change={stats?.dynamicStats?.revGrowth || "Tracking"} delay={0.05} accentColor="text-emerald-500" accentBg="bg-emerald-500/5" />
          <StatCard onClick={() => navigate("/orders")} icon={ShoppingBag} title="Total Orders" value={stats?.totalOrders || 0} change="Live DB Count" delay={0.1} accentColor="text-blue-500" accentBg="bg-blue-500/5" />
          <StatCard onClick={() => navigate("/notifications")} icon={AlertTriangle} title="Critical Alerts" value={stats?.lowStock || 0} change="Live Priority" delay={0.15} accentColor="text-rose-500" accentBg="bg-rose-500/5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100/80 p-6 hover:border-slate-200 transition-all"
          >
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h2 className="font-heading text-base font-black text-slate-900 tracking-tight uppercase italic leading-none">Market Momentum</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">30D Revenue Trajectory</p>
               </div>
               <div className="px-3 py-1 rounded-lg bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest">Growth</div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats?.dailyData || []}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontWeight={900} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} fontWeight={900} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', fontWeight: '900', fontSize: '9px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="url(#revenueGrad)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900 rounded-[2.5rem] p-6 text-white border border-slate-800 relative overflow-hidden"
          >
             <div className="relative z-10 h-full flex flex-col">
               <h2 className="font-heading text-base font-black tracking-tight uppercase italic leading-none mb-1">Category Spread</h2>
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Revenue Weightage</p>
               
               <div className="h-48 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.categoryData || []}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {(stats?.categoryData || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
               </div>

               <div className="space-y-3 mt-auto pt-4">
                  {(stats?.categoryData || []).slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                       <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
                       </div>
                       <span className="text-[10px] font-black italic">₹{item.value.toLocaleString()}</span>
                    </div>
                  ))}
               </div>
             </div>
             <div className="absolute top-0 right-0 p-6 opacity-5">
                <PieIcon size={100} />
             </div>
          </motion.div>
        </div>
        {/* Compact bottom padding anchor */}
        <div className="h-2" />

        {/* Top Products */}
        {stats?.topProducts?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-[2.5rem] border border-slate-100/80 p-6 hover:border-slate-200 transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-base font-black text-slate-900 tracking-tight uppercase italic leading-none">Top Products</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">By Revenue Generated</p>
              </div>
              <div className="px-3 py-1 rounded-lg bg-orange-50 text-orange-600 text-[8px] font-black uppercase tracking-widest">Top 5</div>
            </div>
            <div className="space-y-3">
              {stats.topProducts.map((product: any, i: number) => {
                const maxRevenue = stats.topProducts[0]?.revenue || 1;
                const pct = Math.round((product.revenue / maxRevenue) * 100);
                return (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-black text-slate-800 truncate">{product.name}</p>
                        <span className="text-sm font-black text-orange-500 ml-2 shrink-0">₹{product.revenue.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.5 + i * 0.08, duration: 0.6 }}
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{product.stock} units</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default Dashboard;


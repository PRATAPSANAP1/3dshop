import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import PageTransition from "@/components/PageTransition";
import SkeletonCard from "@/components/SkeletonCard";

const COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(160, 84%, 39%)",
  "hsl(32, 95%, 44%)",
  "hsl(347, 77%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(189, 94%, 43%)",
];

import api from "@/lib/api";
import { RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const SmartStore = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchData = async (refresh = false) => {
    try {
      setLoading(true);
      const { data: result } = await api.get(`/smartstore/dashboard-data?refresh=${refresh}`);
      setData(result);
    } catch (err) {
      console.error("SmartStore Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) return null;

  const chartCard = (title: string, subtitle: string, children: React.ReactNode, delay: number, index: number) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={`stat-card border-none  bg-white group hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-heading text-base font-black text-slate-900 tracking-tight uppercase italic">{title}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${index % 2 === 0 ? "bg-indigo/5 text-indigo" : "bg-emerald/5 text-emerald"}`}>
           <Zap size={18} strokeWidth={3} />
        </div>
      </div>
      {children}
    </motion.div>
  );

  return (
    <PageTransition>
      <div className="space-y-6 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-black text-slate-900 tracking-tight uppercase italic">Smart<span className="text-indigo not-italic font-bold">Store</span> AI Explorer</h1>
            <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time computer vision metrics and flow optimization</p>
          </div>
          <Button onClick={() => fetchData(true)} className="h-12 px-6 rounded-2xl bg-indigo hover:bg-indigo/90 text-white gap-2 font-black uppercase tracking-widest text-xs shadow-sm shadow-indigo/20">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Re-Simulate AI Insights
          </Button>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="p-1 px-1 bg-gradient-to-r from-indigo/10 via-emerald/10 to-transparent rounded-2xl border border-indigo/5"
        >
           <div className="bg-white/40 backdrop-blur-md p-4 rounded-xl flex items-center gap-4">
              <div className="h-10 w-10 bg-indigo rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo/20">
                <Zap size={20} fill="white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo uppercase tracking-[0.2em] mb-0.5">Primary AI Recommendation</p>
                <p className="text-sm font-bold text-slate-700 italic">"{(data?.aiInsights && data.aiInsights[0]) || 'Gathering telemetry data...'}"</p>
              </div>
           </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {chartCard("Traffic Distribution", "By Store Zone", (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.zoneTraffic || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220,13%,95%)" />
                <XAxis dataKey="zoneName" fontSize={10} fontWeight={700} stroke="hsl(220,10%,60%)" axisLine={false} tickLine={false} label={{ value: 'Store Zones', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', fill: '#64748b' }} height={50} />
                <YAxis fontSize={10} fontWeight={700} stroke="hsl(220,10%,60%)" axisLine={false} tickLine={false} label={{ value: 'Visitor Score', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                <Bar dataKey="visitors" fill="#EA580C" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ), 0, 0)}

          {chartCard("Footfall Chronology", "Peak Hours Analysis", (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data?.trafficOverTime || []}>
                <defs>
                  <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220,13%,95%)" />
                <XAxis dataKey="time" fontSize={10} fontWeight={700} stroke="hsl(220,10%,60%)" axisLine={false} tickLine={false} label={{ value: 'Time of Day', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', fill: '#64748b' }} height={50} />
                <YAxis fontSize={10} fontWeight={700} stroke="hsl(220,10%,60%)" axisLine={false} tickLine={false} label={{ value: 'Active Users', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="visitors" stroke="#10B981" strokeWidth={4} fill="url(#colorVis)" />
              </AreaChart>
            </ResponsiveContainer>
          ), 0.05, 1)}

          {chartCard("Revenue Allocation", "Category Performance", (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie 
                  data={data?.categorySales || []} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={90} 
                  paddingAngle={8} 
                  dataKey="sales" 
                  nameKey="category"
                  stroke="none"
                >
                  {(data?.categorySales || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
              </PieChart>
            </ResponsiveContainer>
          ), 0.1, 2)}

          {chartCard("Zone Efficiency Matrix", "Revenue per Sq. Meter", (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data?.rackPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220,13%,95%)" />
                <XAxis dataKey="rackName" fontSize={10} fontWeight={700} stroke="hsl(220,10%,60%)" axisLine={false} tickLine={false} label={{ value: 'Racks', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', fill: '#64748b' }} height={50} />
                <YAxis fontSize={10} fontWeight={700} stroke="hsl(220,10%,60%)" axisLine={false} tickLine={false} label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                <Line type="stepAfter" dataKey="sales" stroke="#F59E0B" strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ), 0.15, 3)}
        </div>
      </div>
    </PageTransition>
  );
};

export default SmartStore;


import { useState } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  Download, 
  FileText, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Activity,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Reports = () => {
  const [timeRange, setTimeRange] = useState("30days");

  const stockData = [
    { name: "Rack A", units: 450 },
    { name: "Rack B", units: 320 },
    { name: "Rack C", units: 280 },
    { name: "Rack D", units: 510 },
    { name: "Rack E", units: 150 },
  ];

  const categoryData = [
    { name: "Grocery", value: 400, color: "#EA580C" },
    { name: "Dairy", value: 300, color: "#F97316" },
    { name: "Biscuits", value: 300, color: "#FB923C" },
    { name: "Oils", value: 200, color: "#FDBA74" },
  ];

  const movementData = [
    { day: "01", added: 40, transfer: 24 },
    { day: "05", added: 30, transfer: 13 },
    { day: "10", added: 20, transfer: 98 },
    { day: "15", added: 27, transfer: 39 },
    { day: "20", added: 18, transfer: 48 },
    { day: "25", added: 23, transfer: 38 },
    { day: "30", added: 34, transfer: 43 },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Godown <span className="text-[#EA580C] not-italic">Reports</span>
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
            Stock analytics and warehouse efficiency insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 px-5 rounded-2xl border-orange-100 text-[#EA580C] hover:bg-orange-50 font-black uppercase tracking-widest text-[9px] gap-2">
            <Calendar size={16} /> Last 30 Days
          </Button>
          <Button className="h-12 px-6 rounded-2xl bg-[#EA580C] text-white hover:bg-orange-600 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20 gap-2">
            <Download size={16} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Stock Level per Rack */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-orange-100 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic flex items-center gap-2">
               <Package size={16} className="text-[#EA580C]" /> Stock Level per Rack
            </h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} width={80} />
                <Tooltip cursor={{ fill: '#FFF7F3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="units" fill="#EA580C" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-orange-100 shadow-sm space-y-8">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic flex items-center gap-2">
             <Activity size={16} className="text-[#EA580C]" /> Category Allocation
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Stock Movement (Full Width) */}
        <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-[3rem] border border-orange-100 shadow-xl shadow-orange-500/5 space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-[0.15em] italic flex items-center gap-2">
                 <TrendingUp size={20} className="text-[#EA580C]" /> Movement Analytics
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Incoming vs Transferred Stock (Units)</p>
            </div>
            <div className="flex gap-6">
               <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#EA580C]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Added</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-200" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Transferred</span>
               </div>
            </div>
          </div>
          <div className="h-96 w-full px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementData}>
                <defs>
                  <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EA580C" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#EA580C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748B' }} />
                <Tooltip />
                <Area type="monotone" dataKey="added" stroke="#EA580C" strokeWidth={4} fillOpacity={1} fill="url(#colorAdded)" />
                <Area type="monotone" dataKey="transfer" stroke="#FED7AA" strokeWidth={4} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

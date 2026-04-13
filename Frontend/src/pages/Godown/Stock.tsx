import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Filter,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
  Package,
  MapPin,
  TrendingDown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const GodownStock = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const stockItems = [
    { 
      id: "SKU-9021", 
      name: "Organic Honey 500g", 
      category: "Grocery", 
      location: "G1 > R1 > S2", 
      qty: 240, 
      min: 50, 
      expiry: "24 Dec 2026", 
      status: "In Stock" 
    },
    { 
      id: "SKU-4412", 
      name: "Fresh Amul Butter 100g", 
      category: "Dairy", 
      location: "G1 > R2 > S1", 
      qty: 12, 
      min: 40, 
      expiry: "15 May 2026", 
      status: "Low Stock" 
    },
    { 
      id: "SKU-3122", 
      name: "Parle-G Gold 200g", 
      category: "Biscuits", 
      location: "G2 > R4 > S1", 
      qty: 850, 
      min: 100, 
      expiry: "10 Feb 2027", 
      status: "In Stock" 
    },
    { 
      id: "SKU-1029", 
      name: "Dhara Refined Oil 1L", 
      category: "Oils", 
      location: "G1 > R1 > S3", 
      qty: 0, 
      min: 20, 
      expiry: "N/A", 
      status: "Out of Stock" 
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Godown <span className="text-[#EA580C] not-italic">Stock</span>
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
            Inventory stored across your private warehouse network
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="h-12 px-5 rounded-2xl border-orange-100 text-slate-400 hover:text-[#EA580C] hover:bg-orange-50 font-black uppercase tracking-widest text-[9px] gap-2">
            <Download size={16} /> Export
          </Button>
          <Button variant="outline" className="h-12 px-5 rounded-2xl border-orange-100 text-slate-400 hover:text-[#EA580C] hover:bg-orange-50 font-black uppercase tracking-widest text-[9px] gap-2">
            <Upload size={16} /> Import
          </Button>
          <Button className="h-12 px-6 rounded-2xl bg-[#EA580C] text-white hover:bg-orange-600 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20 gap-2">
            <Plus size={16} strokeWidth={3} /> Add Stock
          </Button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="bg-[#FFF7F3] p-1 rounded-[2rem] border border-orange-100/50 shadow-inner grid grid-cols-2 lg:grid-cols-4">
         {[
           { label: "Total SKUs", val: "420", color: "text-[#EA580C]" },
           { label: "Total Units", val: "12,450", color: "text-[#EA580C]" },
           { label: "Near Expiry", val: "14", color: "text-amber-500" },
           { label: "Out of Stock", val: "5", color: "text-red-500" }
         ].map((item, i) => (
           <div key={i} className={`flex flex-col items-center justify-center py-6 px-4 ${i !== 3 ? 'border-r border-orange-100/30' : ''}`}>
             <p className={`text-2xl font-black font-mono tracking-tighter ${item.color}`}>{item.val}</p>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{item.label}</p>
           </div>
         ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search by Product name, SKU or Barcode..." 
            className="pl-14 h-14 rounded-2xl bg-white border-orange-100 focus-visible:ring-[#EA580C] font-bold text-sm shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <Button className="h-14 px-6 rounded-2xl bg-slate-900 border-none text-white hover:bg-[#EA580C] font-black uppercase tracking-widest text-[10px] gap-2 transition-all">
            <Filter size={16} /> Filters
          </Button>
          <Button variant="outline" className="h-14 px-6 rounded-2xl border-orange-100 text-[#EA580C] hover:bg-orange-50 font-black uppercase tracking-widest text-[10px]">
            Reset
          </Button>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-[2.5rem] border border-orange-100 shadow-xl shadow-orange-500/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800">
                <th className="px-8 py-6 text-left text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Product Intelligence</th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Storage Vector</th>
                <th className="px-6 py-6 text-center text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Live Stock</th>
                <th className="px-6 py-6 text-center text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Threshold</th>
                <th className="px-6 py-6 text-center text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Expiry Status</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {stockItems.map((item, i) => (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group hover:bg-[#FFF7F3] transition-colors"
                >
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-white border border-orange-50 flex items-center justify-center text-orange-200 group-hover:scale-110 transition-transform shadow-inner">
                        <Package size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight italic group-hover:text-[#EA580C] transition-colors">{item.name}</p>
                        <div className="flex items-center gap-3 mt-2">
                           <span className="font-mono text-[10px] font-black text-[#EA580C] bg-orange-50 px-2 py-0.5 rounded uppercase tracking-widest">{item.id}</span>
                           <Badge variant="outline" className="bg-slate-50 border-none text-[8px] font-black text-slate-400 tracking-[0.1em] uppercase px-2">{item.category}</Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-7">
                     <div className="flex items-center gap-2 text-slate-500">
                        <MapPin size={14} className="text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">{item.location}</span>
                     </div>
                  </td>
                  <td className="px-6 py-7 text-center">
                     <div className={`text-lg font-black font-mono tracking-tighter ${item.qty === 0 ? 'text-red-500' : item.qty < item.min ? 'text-amber-500' : 'text-slate-900'}`}>
                       {item.qty.toLocaleString()}
                     </div>
                     <p className={`text-[8px] font-black uppercase tracking-widest ${item.qty < item.min ? 'text-amber-500' : 'text-slate-400'}`}>
                        {item.status}
                     </p>
                  </td>
                  <td className="px-6 py-7 text-center">
                     <span className="text-xs font-black text-slate-400 font-mono italic">Min: {item.min}</span>
                  </td>
                  <td className="px-6 py-7 text-center">
                     <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.expiry}</span>
                     </div>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center justify-end gap-3">
                       <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white border border-orange-100 text-[#EA580C] hover:bg-[#EA580C] hover:text-white transition-all shadow-sm">
                          <ArrowRightLeft size={16} />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white border border-orange-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                          <ChevronRight size={16} />
                       </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GodownStock;

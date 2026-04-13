import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Layers,
  Box,
  Thermometer,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ManageShelves = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const shelves = [
    { id: "SHL-401", name: "Shelf 1 - Alpha", rack: "Alpha Main 1", level: 1, capacity: "80%", temp: "Normal", products: 24, status: "Active" },
    { id: "SHL-402", name: "Shelf 2 - Alpha", rack: "Alpha Main 1", level: 2, capacity: "45%", temp: "Cold", products: 12, status: "Active" },
    { id: "SHL-501", name: "Shelf 1 - Beta", rack: "Beta Side A", level: 1, capacity: "100%", temp: "Normal", products: 40, status: "Full" },
    { id: "SHL-502", name: "Shelf 2 - Beta", rack: "Beta Side A", level: 2, capacity: "20%", temp: "Frozen", products: 5, status: "Active" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Manage <span className="text-[#EA580C] not-italic">Shelves</span>
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
            Configure every shelf level in your racks
          </p>
        </div>
        <Button className="h-12 px-6 rounded-2xl bg-[#EA580C] text-white hover:bg-orange-600 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20 gap-2">
          <Plus size={16} strokeWidth={3} /> Add New Shelf
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFF7F3] p-4 md:p-6 rounded-[1.5rem] border border-orange-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search shelves by name or ID..." 
            className="pl-12 h-12 rounded-xl bg-white border-orange-100 focus-visible:ring-[#EA580C] font-bold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select className="flex-1 md:w-48 h-12 rounded-xl border border-orange-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#EA580C]">
            <option>All Racks</option>
            <option>Alpha Main 1</option>
            <option>Beta Side A</option>
          </select>
          <select className="flex-1 md:w-48 h-12 rounded-xl border border-orange-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#EA580C]">
            <option>All Temperatures</option>
            <option>Normal</option>
            <option>Cold</option>
            <option>Frozen</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-orange-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#FFF7F3] border-b-2 border-orange-200">
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">ID</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Shelf Name</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Parent Rack</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Level</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Zone</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Products</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Utilization</th>
              <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shelves.map((shelf, i) => (
              <motion.tr 
                key={shelf.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group border-b border-orange-50 hover:bg-orange-50/50 transition-colors"
              >
                <td className="px-6 py-6">
                  <span className="font-mono text-[11px] font-black text-[#EA580C] bg-orange-50 px-2 py-1 rounded-md">{shelf.id}</span>
                </td>
                <td className="px-6 py-6">
                   <p className="text-sm font-black text-slate-900 leading-none">{shelf.name}</p>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Standard Bin</p>
                </td>
                <td className="px-6 py-6">
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-slate-600">{shelf.rack}</span>
                     <ArrowRight size={10} className="text-slate-300" />
                   </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <Badge variant="outline" className="h-6 w-14 rounded-full border-2 border-orange-100 flex items-center justify-center text-[10px] font-black text-orange-500 italic bg-white">
                    LVL {shelf.level}
                  </Badge>
                </td>
                <td className="px-6 py-6 text-center">
                   <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                     <Thermometer size={12} className={shelf.temp === 'Normal' ? 'text-slate-400' : shelf.temp === 'Cold' ? 'text-blue-500' : 'text-indigo-600'} />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{shelf.temp}</span>
                   </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-sm font-black text-slate-900">{shelf.products}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase mt-0.5">Stored</span>
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                   <div className="w-24 mx-auto space-y-1.5">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${parseInt(shelf.capacity) > 90 ? 'bg-red-500' : 'bg-[#EA580C]'}`}
                          style={{ width: shelf.capacity }}
                        />
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{shelf.capacity} LOAD</p>
                   </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageShelves;

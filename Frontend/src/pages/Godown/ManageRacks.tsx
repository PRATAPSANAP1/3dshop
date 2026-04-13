import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Eye,
  Grid3X3,
  Layers,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ManageRacks = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const racks = [
    { id: "RCK-001", name: "Alpha Main 1", zone: "DRY STORE", pos: "0.0, 0.0, 0.0", shelves: 6, products: 45, status: "Active" },
    { id: "RCK-002", name: "Beta Side A", zone: "COLD STORE", pos: "2.4, 0.0, 1.2", shelves: 4, products: 12, status: "Active" },
    { id: "RCK-003", name: "Gamma Bulk 2", zone: "BULK AREA", pos: "5.0, 0.0, -2.0", shelves: 2, products: 8, status: "Inactive" },
    { id: "RCK-004", name: "Delta Front", zone: "DRY STORE", pos: "-1.2, 0.0, 4.5", shelves: 5, products: 30, status: "Active" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Manage <span className="text-[#EA580C] not-italic">Racks</span>
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
            All racks across your private godowns
          </p>
        </div>
        <Button className="h-12 px-6 rounded-2xl bg-[#EA580C] text-white hover:bg-orange-600 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20 gap-2">
          <Plus size={16} strokeWidth={3} /> Add New Rack
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFF7F3] p-4 md:p-6 rounded-[1.5rem] border border-orange-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search racks by name, ID or zone..." 
            className="pl-12 h-12 rounded-xl bg-white border-orange-100 focus-visible:ring-[#EA580C] font-bold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select className="flex-1 md:w-40 h-12 rounded-xl border border-orange-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#EA580C]">
            <option>All Godowns</option>
            <option>Godown 1</option>
            <option>Godown 2</option>
          </select>
          <select className="flex-1 md:w-40 h-12 rounded-xl border border-orange-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#EA580C]">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-[#EA580C]">
             Clear
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-orange-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#FFF7F3] border-b-2 border-orange-200">
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">ID</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Rack Details</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Zone</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Location (X,Y,Z)</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Shelves</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Stock</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Status</th>
              <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {racks.map((rack, i) => (
              <motion.tr 
                key={rack.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group border-b border-orange-50 hover:bg-orange-50/50 transition-colors"
              >
                <td className="px-6 py-6">
                  <span className="font-mono text-[11px] font-black text-[#EA580C] bg-orange-50 px-2 py-1 rounded-md">{rack.id}</span>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#EA580C] group-hover:scale-110 transition-transform">
                      <Grid3X3 size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 group-hover:text-[#EA580C] transition-colors">{rack.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Industrial Grade</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                   <Badge className="bg-orange-100/50 text-[#EA580C] border-none font-black text-[9px] uppercase tracking-widest px-2 py-1 italic">
                     {rack.zone}
                   </Badge>
                </td>
                <td className="px-6 py-6">
                  <span className="font-mono text-xs text-slate-500 font-bold tracking-tight">{rack.pos}</span>
                </td>
                <td className="px-6 py-6 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Layers size={14} className="text-orange-300" />
                    <span className="font-black text-slate-900">{rack.shelves}</span>
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <div className="inline-flex flex-col items-center">
                    <span className="font-black text-slate-900 leading-none">{rack.products}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase mt-1">SKUs</span>
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <Badge className={`border-none font-black text-[9px] uppercase tracking-widest ${rack.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {rack.status}
                  </Badge>
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

export default ManageRacks;

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Warehouse, 
  Store, 
  Package, 
  CheckCircle2, 
  Clock, 
  Plus,
  ArrowRightLeft,
  Calendar,
  User,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const StockTransfer = () => {
  const [transferType, setTransferType] = useState("GodownToStore");
  const [activeStep, setActiveStep] = useState(1);

  const history = [
    { id: "TRX-4421", product: "Organic Honey 500g", from: "Godown 1", to: "Main Store", qty: 40, status: "Completed", date: "Today, 11:30 AM" },
    { id: "TRX-4420", product: "Amul Butter 100g", from: "Godown 1", to: "Main Store", qty: 24, status: "Completed", date: "Today, 09:15 AM" },
    { id: "TRX-4419", product: "Parle-G Gold 200g", from: "Godown 2", to: "Store A", qty: 100, status: "Pending", date: "Scheduled 04:00 PM" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Stock <span className="text-[#EA580C] not-italic">Transfer</span>
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
            Move products between your warehouse and storefronts
          </p>
        </div>
      </div>

      {/* Type Selector */}
      <div className="flex p-2 bg-orange-50 rounded-2xl md:w-fit gap-2">
         {[
           { id: "GodownToStore", label: "Godown ➜ Store", icon: Store },
           { id: "GodownToGodown", label: "Godown ➜ Godown", icon: Warehouse },
           { id: "StoreToGodown", label: "Store ➜ Godown", icon: Package }
         ].map((t) => (
           <button
             key={t.id}
             onClick={() => setTransferType(t.id)}
             className={`flex items-center gap-2 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${transferType === t.id ? 'bg-[#EA580C] text-white shadow-lg' : 'text-slate-500 hover:bg-white/50'}`}
           >
             <t.icon size={16} />
             {t.label}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
         {/* Transfer Form */}
         <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-orange-100 shadow-2xl shadow-orange-500/5 p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-orange-50/50">
               <ArrowRightLeft size={120} />
            </div>

            <div className="relative space-y-12">
               {/* Location Selection */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
                  <div className="space-y-6">
                     <p className="text-[11px] font-black text-[#EA580C] uppercase tracking-[0.2em] mb-4">Origin Hub</p>
                     <div className="space-y-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Source Godown *</label>
                           <select className="flex h-12 w-full rounded-xl border border-orange-100 bg-white px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#EA580C]">
                              <option>Godown 1 (Central)</option>
                              <option>Godown 2 (North)</option>
                           </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rack</label>
                              <select className="flex h-12 w-full rounded-xl border border-orange-100 bg-white px-4 py-2 text-sm font-bold">
                                 <option>A-01</option>
                                 <option>B-04</option>
                              </select>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Shelf</label>
                              <select className="flex h-12 w-full rounded-xl border border-orange-100 bg-white px-4 py-2 text-sm font-bold">
                                 <option>Level 2</option>
                                 <option>Level 4</option>
                              </select>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-[#EA580C] items-center justify-center text-white shadow-xl z-10 border-4 border-white">
                     <ArrowRight size={24} strokeWidth={3} />
                  </div>

                  <div className="space-y-6">
                     <p className="text-[11px] font-black text-[#EA580C] uppercase tracking-[0.2em] mb-4">Target Destination</p>
                     <div className="space-y-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Destination *</label>
                           <select className="flex h-12 w-full rounded-xl border border-orange-100 bg-white px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#EA580C]">
                              <option>Main Storefront</option>
                              <option>Mini Outlet (Airport)</option>
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Store Rack Zone</label>
                           <select className="flex h-12 w-full rounded-xl border border-orange-100 bg-white px-4 py-2 text-sm font-bold">
                              <option>Entrance Highlights</option>
                              <option>Aisle 4 (Dairy)</option>
                           </select>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Product Info */}
               <div className="space-y-6 pt-6 border-t border-orange-50">
                  <p className="text-[11px] font-black text-[#EA580C] uppercase tracking-[0.2em]">Product Selection</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Search Product *</label>
                        <Input placeholder="Enter SKU or Product Name..." className="h-14 rounded-xl border-orange-100 font-bold" />
                     </div>
                     <div className="space-y-1 text-right">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Transfer Quantity *</label>
                        <div className="flex h-14 items-center justify-center bg-orange-50 rounded-xl px-4 border border-orange-100">
                           <Input type="number" defaultValue="1" className="bg-transparent border-none text-right font-mono text-2xl font-black text-[#EA580C] focus-visible:ring-0" />
                           <span className="text-[10px] font-black uppercase text-orange-400 ml-2">Units</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mr-2 mt-1">Available: 240 units</p>
                     </div>
                  </div>
               </div>

               {/* Checklist */}
               <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Verification Checklist</p>
                  <div className="space-y-3">
                     {[
                       "Stock count physically verified",
                       "Expiries and batches cross-checked",
                       "Packaging integrity inspection passed"
                     ].map((item, i) => (
                       <div key={i} className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-md border-2 border-orange-200 flex items-center justify-center bg-white cursor-pointer">
                             <Check size={12} className="text-[#EA580C]" />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{item}</span>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="pt-6 flex gap-4">
                  <Button variant="outline" className="h-14 flex-1 rounded-2xl border-orange-100 text-slate-500 font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                  <Button className="h-14 flex-[2] rounded-2xl bg-[#EA580C] text-white hover:bg-orange-600 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-orange-500/20">Confirm Stock Transfer</Button>
               </div>
            </div>
         </div>

         {/* Transfer History Sidebar */}
         <div className="space-y-6">
            <h2 className="font-heading text-xl font-black text-slate-900 uppercase italic">
               Transfer <span className="text-[#EA580C] not-italic">Ledger</span>
            </h2>
            <div className="space-y-4">
               {history.map((item, i) => (
                 <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm group hover:shadow-lg transition-all"
                 >
                   <div className="flex justify-between items-start mb-4">
                      <span className="font-mono text-[10px] font-black text-[#EA580C] bg-orange-50 px-2 py-1 rounded-md">{item.id}</span>
                      <Badge className={`border-none font-black text-[8px] uppercase tracking-widest ${item.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                         {item.status}
                      </Badge>
                   </div>
                   <h3 className="text-sm font-black text-slate-900 mb-4">{item.product}</h3>
                   <div className="flex items-center justify-between py-3 border-y border-orange-50 mb-4">
                      <div className="text-center flex-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">From</p>
                         <p className="text-[10px] font-black text-slate-700">{item.from}</p>
                      </div>
                      <ArrowRight size={14} className="text-orange-200 mx-2" />
                      <div className="text-center flex-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">To</p>
                         <p className="text-[10px] font-black text-slate-700">{item.to}</p>
                      </div>
                   </div>
                   <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1.5"><Calendar size={12} /> {item.date}</span>
                      <span className="text-slate-900 font-black">QTY: {item.qty}</span>
                   </div>
                 </motion.div>
               ))}
               <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-[#EA580C] hover:bg-orange-50">
                  Show Full Log
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StockTransfer;

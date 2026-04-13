import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Plus, Package, Trash2, X, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import SkeletonCard from "@/components/SkeletonCard";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const RACK_COLORS = [
  { border: "#EA580C", bg: "bg-orange-50", text: "text-orange-600", icon: "bg-orange-100 text-orange-600" },
  { border: "#10B981", bg: "bg-emerald-50", text: "text-emerald-600", icon: "bg-emerald-100 text-emerald-600" },
  { border: "#8B5CF6", bg: "bg-violet-50", text: "text-violet-600", icon: "bg-violet-100 text-violet-600" },
  { border: "#06B6D4", bg: "bg-cyan-50", text: "text-cyan-600", icon: "bg-cyan-100 text-cyan-600" },
  { border: "#F43F5E", bg: "bg-rose-50", text: "text-rose-600", icon: "bg-rose-100 text-rose-600" },
  { border: "#F59E0B", bg: "bg-amber-50", text: "text-amber-600", icon: "bg-amber-100 text-amber-600" },
  { border: "#14B8A6", bg: "bg-teal-50", text: "text-teal-600", icon: "bg-teal-100 text-teal-600" },
  { border: "#3B82F6", bg: "bg-blue-50", text: "text-blue-600", icon: "bg-blue-100 text-blue-600" },
];

const Racks = () => {
  const [loading, setLoading] = useState(true);
  const [racks, setRacks] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingRack, setEditingRack] = useState<any>(null);
  const [form, setForm] = useState({ 
    rackName: '', 
    positionX: 0, 
    positionY: 1.5, 
    positionZ: 0, 
    width: 2, 
    height: 3, 
    shelves: 4, 
    columns: 3,
    color: '#EA580C'
  });
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [racksRes, productsRes] = await Promise.all([
        api.get('/racks'),
        api.get('/products'),
      ]);
      setRacks(racksRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      console.error("Racks fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddRack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRack) {
        await api.put(`/racks/${editingRack._id}`, form);
        toast({ title: "Rack Updated", description: "Configuration saved successfully" });
      } else {
        await api.post('/racks', form);
        toast({ variant: "success", title: "Rack Created", description: `${form.rackName} added` });
      }
      setShowAdd(false);
      setEditingRack(null);
      setForm({ rackName: '', positionX: 0, positionY: 1.5, positionZ: 0, width: 2, height: 3, shelves: 4, columns: 3, color: '#EA580C' });
      fetchData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: editingRack ? "Update failed" : "Creation failed" });
    }
  };

  const openEdit = (rack: any) => {
    setEditingRack(rack);
    setForm({
      rackName: rack.rackName || '',
      positionX: rack.positionX || 0,
      positionY: rack.positionY || 1.5,
      positionZ: rack.positionZ || 0,
      width: rack.width || 2,
      height: rack.height || 3,
      shelves: rack.shelves || 4,
      columns: rack.columns || 3,
      color: rack.color || '#EA580C'
    });
    setShowAdd(true);
  };

  const handleDeleteRack = async (id: string) => {
    try {
      await api.delete(`/racks/${id}`);
      toast({ variant: "success", title: "Rack Deleted", description: "Rack has been removed" });
      fetchData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete rack" });
    }
  };

  const getProductCountForRack = (rackId: string) => {
    return products.filter(p => p.rackId?._id === rackId || p.rackId === rackId).length;
  };

  const getLowStockForRack = (rackId: string) => {
    return products.filter(p => (p.rackId?._id === rackId || p.rackId === rackId) && p.quantity < (p.minStockLevel || 10)).length;
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="skeleton-loader h-10 w-32 rounded-lg" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-40" />)}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-black text-primary tracking-tight uppercase italic">
            Rack<span className="text-slate-900 not-italic">Manager</span>
            <span className="text-slate-400 not-italic font-normal lowercase tracking-widest text-lg ml-2">/ {racks.length} units</span>
          </h1>
          <Button onClick={() => { if(showAdd) setEditingRack(null); setShowAdd(!showAdd); setForm({ rackName: '', positionX: 0, positionY: 1.5, positionZ: 0, width: 2, height: 3, shelves: 4, columns: 3, color: '#EA580C' }); }} className="gap-2 h-11 px-5 bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm transition-all active:scale-95">
            {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAdd ? "Cancel" : "Add Rack"}
          </Button>
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddRack}
              className="stat-card border-l-4 p-8 space-y-6 overflow-hidden"
               style={{ borderLeftColor: editingRack ? '#8B5CF6' : '#EA580C' }}
            >
              <h3 className="font-heading text-lg font-black text-slate-900 uppercase tracking-tight">
                {editingRack ? `Edit ${editingRack.rackName}` : 'New Rack Configuration'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Identity</label>
                  <Input value={form.rackName} onChange={e => setForm({...form, rackName: e.target.value})} placeholder="Rack ID" className="h-12 rounded-xl" required />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Spatial X</label>
                  <Input type="number" step="0.1" value={form.positionX} onChange={e => setForm({...form, positionX: +e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Spatial Z</label>
                  <Input type="number" step="0.1" value={form.positionZ} onChange={e => setForm({...form, positionZ: +e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Theme Color</label>
                  <div className="flex gap-2 h-12">
                    <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="h-12 w-12 rounded-xl border-none p-0 overflow-hidden cursor-pointer" />
                    <Input value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="flex-1 h-12 rounded-xl uppercase font-mono" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-50 pt-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Width (units)</label>
                  <Input type="number" step="0.1" value={form.width} onChange={e => setForm({...form, width: +e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Height (units)</label>
                  <Input type="number" step="0.1" value={form.height} onChange={e => setForm({...form, height: +e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Shelves</label>
                  <Input type="number" value={form.shelves} onChange={e => setForm({...form, shelves: +e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Columns</label>
                  <Input type="number" value={form.columns} onChange={e => setForm({...form, columns: +e.target.value})} className="h-12 rounded-xl" />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="h-11 px-8 bg-slate-900 hover:bg-orange-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-md shadow-slate-200">
                  {editingRack ? 'Save Configuration' : 'Create Rack Unit'}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {racks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stat-card p-16 text-center">
            <div className="mx-auto h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
              <Box className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="font-heading text-xl font-black text-slate-900">No Racks Yet</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">Create your first rack to start organizing your inventory spatially in the 3D shop environment.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {racks.map((rack, i) => {
              const colorSet = RACK_COLORS[i % RACK_COLORS.length];
              const productCount = getProductCountForRack(rack._id);
              const lowStock = getLowStockForRack(rack._id);

              return (
                <motion.div
                  key={rack._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="stat-card cursor-pointer border-l-4 group hover:-translate-y-1"
                  style={{ borderLeftColor: colorSet.border }}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorSet.icon} transition-transform group-hover:scale-110`}>
                      <Box className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      {lowStock > 0 && (
                        <span className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider bg-rose/10 text-rose animate-pulse">
                          {lowStock} Low
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(rack); }}
                          className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-violet-50 hover:text-violet-600 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteRack(rack._id); }}
                          className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose/10 hover:text-rose flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-black text-slate-900 leading-tight">{rack.rackName}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Position ({rack.positionX}, {rack.positionZ}) • {rack.shelves} Shelves
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <Package className="h-4 w-4 text-slate-400" />
                      {productCount} products
                    </div>
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: rack.color || colorSet.border }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Racks;

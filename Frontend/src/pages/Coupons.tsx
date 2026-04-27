import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ticket, Plus, X, Trash2, CheckCircle2, 
  AlertCircle, Search, Tag, Calendar, Clock,
  Edit2, Eye, Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import PageTransition from "@/components/PageTransition";

const Coupons = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ code: "", discountPercentage: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get("/coupons");
      setCoupons(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Fetch Failed", description: "Could not load coupon database" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discountPercentage) return;
    
    setIsSubmitting(true);
    try {
      await api.post("/coupons", {
        code: formData.code.toUpperCase(),
        discountPercentage: Number(formData.discountPercentage)
      });
      toast({ title: "Coupon Created", description: `Code ${formData.code.toUpperCase()} is now live!` });
      setFormData({ code: "", discountPercentage: "" });
      setShowAddModal(false);
      fetchCoupons();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to create coupon" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await api.put(`/coupons/${id}`, { isActive: !current });
      setCoupons(prev => prev.map(c => c._id === id ? { ...c, isActive: !current } : c));
      toast({ title: "Status Updated", description: "Coupon availability changed successfully" });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not toggle coupon status" });
    }
  };

  const deleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c._id !== id));
      toast({ title: "Coupon Deleted", description: "Coupon removed from system" });
    } catch (err) {
      toast({ variant: "destructive", title: "Delete Failed", description: "Could not remove coupon" });
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase())
  );



  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
              Coupon <span className="text-orange-500 not-italic">Engine.</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Manage marketing discounts & promotional codes</p>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="h-12 px-6 rounded-2xl bg-slate-900 text-white hover:bg-orange-500 font-black uppercase tracking-widest text-[10px] gap-2 transition-all shadow-md active:scale-95"
          >
            <Plus size={16} strokeWidth={3} /> GENERATE COUPON
          </Button>
        </header>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search by code (e.g. SUMMER25)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-14 pl-12 rounded-2xl border-slate-100 bg-white shadow-sm font-bold text-slate-700 focus:border-orange-200 focus:ring-orange-500/10"
          />
        </div>

        {/* Coupon Grid */}
        {filteredCoupons.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-100 italic font-bold text-slate-300">
            <Ticket size={48} className="mx-auto mb-4 opacity-20 text-slate-900" />
            No active coupons found in the system.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredCoupons.map((coupon, i) => (
                <motion.div
                  key={coupon._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative group bg-white rounded-[2.5rem] border border-slate-100 p-6 hover:border-orange-100 hover:shadow-xl hover:shadow-orange-500/5 transition-all overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${coupon.isActive ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'}`}>
                      <Ticket size={24} />
                    </div>
                    <Badge className={`border-none text-[8px] font-black uppercase tracking-widest py-1 px-3 ${coupon.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {coupon.isActive ? 'Active' : 'Paused'}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">PROMO CODE</p>
                      <h3 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">{coupon.code}</h3>
                    </div>

                    <div className="flex items-baseline gap-2">
                       <p className="text-5xl font-black italic text-orange-500 leading-none">{coupon.discountPercentage}</p>
                       <p className="text-xl font-black text-slate-900">% <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest not-italic">Discount</span></p>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                          <Clock size={12} /> Created: {new Date(coupon.createdAt).toLocaleDateString()}
                       </div>
                       <div className="flex gap-2">
                         <button 
                           onClick={() => toggleStatus(coupon._id, coupon.isActive)}
                           className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${coupon.isActive ? 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white' : 'bg-orange-500 text-white'}`}
                           title={coupon.isActive ? 'Pause Coupon' : 'Resume Coupon'}
                         >
                           {coupon.isActive ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                         </button>
                         <button 
                           onClick={() => deleteCoupon(coupon._id, coupon.code)}
                           className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                           title="Delete Coupon"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                    </div>
                  </div>
                  
                  {/* Decorative element */}
                  <div className="absolute -top-6 -right-6 h-20 w-20 bg-orange-500/5 rounded-full" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowAddModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl flex flex-col gap-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">CREATE <span className="text-orange-500 not-italic">OFFER.</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Define new discount parameters</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:text-rose-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddCoupon} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">COUPON CODE</label>
                    <div className="relative">
                       <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <Input 
                        placeholder="e.g. MEGA50"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-black tracking-widest text-slate-900 placeholder:font-bold"
                        required
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DISCOUNT (%)</label>
                    <div className="relative">
                       <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <Input 
                        type="number"
                        placeholder="e.g. 15"
                        value={formData.discountPercentage}
                        onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                        className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-black italic text-orange-500 text-xl"
                        min="1"
                        max="100"
                        required
                       />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-16 rounded-2xl bg-slate-900 text-white hover:bg-orange-500 font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95"
                  >
                    {isSubmitting ? "SYNCING..." : "DEPLOY COUPON"}
                  </Button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default Coupons;

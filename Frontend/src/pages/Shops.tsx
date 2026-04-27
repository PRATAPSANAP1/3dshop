import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, Search, Plus, MapPin, Package, Users, 
  ExternalLink, Trash2, ShieldCheck, AlertCircle,
  Building2, Globe, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const Shops = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchShops = async () => {
    try {
      const { data } = await api.get('/shops');
      setShops(data);
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Access Denied", 
        description: "Failed to fetch shops list. Ensure you have administrative privileges." 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleDeleteShop = async (shopId: string) => {
    if (!window.confirm("Are you sure you want to deactivate this shop?")) return;
    try {
      await api.delete(`/shops/${shopId}`);
      setShops(prev => prev.map(s => s._id === shopId ? { ...s, isActive: false } : s));
      toast({ title: "Shop Deactivated", description: "The shop has been successfully removed from the active directory." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to deactivate shop." });
    }
  };

  const filteredShops = shops.filter(s => 
    s.displayName.toLowerCase().includes(search.toLowerCase()) || 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">
              SHOP <span className="text-orange-500 not-italic">DIRECTORY</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
              Centralized Control Hub for Multi-Tenant Instances
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shops..."
                className="pl-12 h-12 rounded-2xl border-slate-200 shadow-sm font-bold text-slate-700"
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[2.5rem]" />
              ))
            ) : filteredShops.map((shop, idx) => (
              <motion.div
                key={shop._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white rounded-[2.5rem] border p-8 shadow-sm hover:border-orange-100 transition-all group relative overflow-hidden ${
                  !shop.isActive ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt={shop.displayName} className="h-10 w-10 object-contain" />
                    ) : (
                      <Store className="text-orange-500" size={28} />
                    )}
                  </div>
                  <Badge className={`${shop.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} border-none font-black uppercase text-[8px] px-3 py-1`}>
                    {shop.isActive ? 'Active' : 'Deactivated'}
                  </Badge>
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-black italic text-slate-900 leading-tight truncate">{shop.displayName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Globe size={12} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-400">/{shop.name}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Building2 size={16} className="text-slate-300 shrink-0" />
                    <span className="text-sm font-bold truncate">Owner: {shop.ownerUserId?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Clock size={16} className="text-slate-300 shrink-0" />
                    <span className="text-sm font-bold text-[10px]">Plan: <span className="uppercase">{shop.plan}</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                  <Button
                    onClick={() => navigate(`/shop-builder?shopId=${shop._id}`)}
                    className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[9px] gap-2 hover:bg-orange-600 transition-all"
                  >
                    Manage <ExternalLink size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteShop(shop._id)}
                    className="h-12 w-12 rounded-xl border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!loading && filteredShops.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
             <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
             <h3 className="text-xl font-black text-slate-400 uppercase italic">No shops found</h3>
             <p className="text-sm font-bold text-slate-400">Refine your search or check your permissions.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Shops;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Store, Users, TrendingUp, Shield, Plus, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data } = await api.get("/shops");
        setShops(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-10 py-6 px-4">
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
              <Shield size={12} className="text-orange-500" />
              <span>superadmin control center</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Platform <span className="text-orange-500 not-italic">Overview.</span>
            </h1>
          </div>
          <Button
            onClick={() => navigate("/superadmin/shops/create")}
            className="h-12 px-6 rounded-xl bg-slate-900 text-white hover:bg-orange-500 font-black uppercase tracking-widest text-[10px] gap-2"
          >
            <Plus size={16} /> New Shop
          </Button>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Store size={16} className="text-orange-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Shops</span>
            </div>
            <p className="text-2xl font-black italic text-slate-900">{shops.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-emerald-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active</span>
            </div>
            <p className="text-2xl font-black italic text-emerald-600">{shops.filter(s => s.isActive).length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-blue-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pro Plans</span>
            </div>
            <p className="text-2xl font-black italic text-blue-600">{shops.filter(s => s.plan === 'pro').length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-purple-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enterprise</span>
            </div>
            <p className="text-2xl font-black italic text-purple-600">{shops.filter(s => s.plan === 'enterprise').length}</p>
          </div>
        </div>

        {/* Shop List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All Shops ({shops.length})</p>
          </div>
          {shops.map((shop, i) => (
              <motion.div
                key={shop._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group"
                onClick={() => navigate(`/dashboard`)}
              >
                <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 font-black text-lg shrink-0">
                  {shop.displayName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-slate-900 uppercase tracking-tight">{shop.displayName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">/{shop.name} · {shop.plan}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    shop.isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                  }`}>
                    {shop.isActive ? "Active" : "Inactive"}
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default SuperAdminDashboard;

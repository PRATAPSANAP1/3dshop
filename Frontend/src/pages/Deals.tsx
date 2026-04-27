import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Sparkles, Tag, ShoppingBag, Clock, Percent, AlertTriangle, ArrowRight } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const Deals = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAddToCart = async (e: React.MouseEvent, productId: string, productName: string) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    try {
      await api.post('/cart/add', { productId, qty: 1 });
      toast({ title: '✓ Added to Cart', description: `${productName} added successfully` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add to cart' });
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/public/all');
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const dealProducts = useMemo(() => {
    // Low stock (urgency) OR budget-friendly (under ₹500)
    return products
      .filter(p => p.quantity > 0 && (p.quantity < 15 || p.price < 500))
      .sort((a, b) => a.quantity - b.quantity) // most urgent first
      .slice(0, 12);
  }, [products]);



  return (
    <PageTransition>
      <div className="space-y-12 pb-20 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full -z-10" />

        <div className="relative h-96 rounded-[3rem] overflow-hidden bg-slate-900 border border-white/5 shadow-sm flex items-center">
           <div className="absolute top-0 right-0 h-full w-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #EF4444 0%, transparent 60%)' }} />
           
           <div className="relative z-10 px-12 sm:px-20 max-w-3xl">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 px-4 py-1 bg-red-500/20 backdrop-blur-md rounded-full border border-red-500/30 text-red-500 w-fit mb-6"
              >
                 <Flame size={14} fill="currentColor" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em]">Live Now • Limited Offers</span>
              </motion.div>
              
              <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.8] text-white italic mb-6">
                HOT <br /> <span className="text-red-500 not-italic">DEALS.</span>
              </h1>
              
              <p className="text-lg text-slate-400 font-medium italic mb-10 max-w-lg leading-relaxed">
                Unlock exclusive inventory access. These premium items are in high demand and won't last long in the SmartStore registry.
              </p>
              
              <div className="flex gap-4">
                 <div className="flex items-center gap-3 py-3 px-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-white">
                    <Clock size={20} className="text-red-500" />
                    <div>
                       <p className="text-xs font-black uppercase tracking-widest leading-none mb-1 text-slate-500">Expiring</p>
                       <p className="text-sm font-black italic">Next 24 Hours</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 py-3 px-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-white">
                    <Percent size={20} className="text-orange-500" />
                    <div>
                       <p className="text-xs font-black uppercase tracking-widest leading-none mb-1 text-slate-500">Maximum Saver</p>
                       <p className="text-sm font-black italic">Up to ₹200 OFF</p>
                    </div>
                 </div>
              </div>
           </div>

           <motion.div
             animate={{ y: [0, -20, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
             className="absolute right-20 top-20 hidden lg:flex flex-col items-center gap-2 p-6 rounded-[2rem] bg-white shadow-sm rotate-12"
           >
              <div className="h-16 w-16 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-sm shadow-red-500/30 mb-2">
                 <Tag size={32} />
              </div>
              <p className="font-heading font-black text-2xl tracking-tighter text-slate-900 leading-none uppercase italic">SAVE<span className="text-red-500 not-italic">50%</span></p>
           </motion.div>
        </div>

        <div className="space-y-8">
           <div className="flex items-end justify-between px-2">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Live Inventory</p>
                 <h2 className="text-4xl font-black italic text-slate-900 tracking-tighter uppercase leading-none">HOT <span className="text-red-500 not-italic">OPPORTUNITIES</span></h2>
              </div>
              <div className="hidden sm:flex gap-4">
                 <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 hover:bg-slate-100 transition-all cursor-pointer">
                    <Sparkles size={20} />
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                 {dealProducts.map((p, i) => (
                    <motion.div
                       key={p._id}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: i * 0.05 }}
                       className="group relative h-[360px] rounded-[2.5rem] bg-white border border-slate-100  overflow-hidden hover:border-slate-200 hover:-translate-y-2 transition-all duration-500 cursor-pointer"
                       onClick={() => navigate(`/product/${p._id}`)}
                    >
                       <div className="relative h-1/2 bg-slate-50 flex items-center justify-center overflow-hidden">
                          <ShoppingBag size={48} className="text-slate-100 group-hover:scale-125 transition-all duration-1000" />
                          <div className="absolute top-5 left-5 px-3 py-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm shadow-red-500/30">
                             Flash Deal
                          </div>
                          {p.quantity < 5 && (
                             <div className="absolute top-5 right-5 h-10 w-10 bg-white/90 backdrop-blur-md rounded-xl border border-red-100 shadow-sm flex items-center justify-center text-red-500 animate-pulse">
                                <AlertTriangle size={18} />
                             </div>
                          )}
                       </div>
                       
                       <div className="p-6 h-1/2 flex flex-col justify-between">
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{p.category}</p>
                             <h4 className="text-lg font-black text-slate-900 leading-tight group-hover:text-red-500 transition-colors uppercase italic truncate">{p.productName}</h4>
                             <p className="text-[10px] font-bold text-slate-400 mt-2 line-clamp-2">Exclusive registry item with limited 3D availability.</p>
                          </div>
                          
                          <div className="flex items-end justify-between border-t border-slate-50 pt-5 mt-auto">
                             <div className="flex flex-col">
                                <span className="text-[10px] line-through text-slate-300 font-bold decoration-red-500/50 decoration-2">₹{Math.floor(p.price * 1.5)}</span>
                                <span className="text-2xl font-black text-slate-900 leading-none italic mt-1">₹{p.price}</span>
                             </div>
                             <button
                                onClick={(e) => handleAddToCart(e, p._id, p.productName)}
                                className="h-14 w-14 rounded-[1.25rem] bg-slate-900 border-none flex items-center justify-center text-white shadow-sm shadow-slate-900/10 hover:bg-red-500 hover:shadow-red-500/30 transition-all active:scale-95">
                                <ShoppingBag size={20} />
                             </button>
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </AnimatePresence>
           </div>
        </div>

        <div className="mt-20 overflow-hidden py-10 bg-red-500 rounded-[3rem] relative ">
           <div className="flex whitespace-nowrap animate-shimmer-fast">
              {Array.from({ length: 4 }).map((_, j) => (
                 <div key={j} className="flex shrink-0 items-center gap-20 px-10">
                    <div className="flex items-center gap-6">
                       <span className="text-4xl font-black italic text-white/20 tracking-tighter">NEW SKU INCOMING</span>
                       <span className="text-xl font-black text-white italic tracking-widest">FLASH DEALS 50% OFF</span>
                       <Flame className="text-white h-8 w-8" />
                       <span className="text-xl font-black text-white italic tracking-widest">LIMITED REGISTRY ACCESS</span>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Deals;

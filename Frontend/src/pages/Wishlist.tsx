import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ShoppingBag, Heart, ArrowRight, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchWishlist = async () => {
    try {
      const { data } = await api.get("/wishlist");
      setWishlist(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load wishlist" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeItem = async (productId: string) => {
    try {
      const { data } = await api.delete(`/wishlist/${productId}`);
      setWishlist(data);
      toast({ title: "Removed", description: "Item removed from wishlist" });
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not remove item" });
    }
  };

  const moveToCart = async (productId: string) => {
    try {
      await api.post("/cart/add", { productId, qty: 1 });
      await api.delete(`/wishlist/${productId}`);
      const { data } = await api.get("/wishlist");
      setWishlist(data);
      toast({ title: "Moved to Cart", description: "Item moved to your shopping cart" });
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not move item to cart" });
    }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="page-loader" /></div>;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-4 mb-10 md:mb-16">
          <div className="h-14 w-14 md:h-16 md:w-16 rounded-[1.5rem] bg-orange-500 flex items-center justify-center text-white ">
            <Heart size={28} className="md:w-8 md:h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
              <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>home</span>
              <span className="text-slate-300">/</span>
              <span className="text-primary">wishlist</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-slate-900 leading-none">MY <span className="text-orange-500 not-italic">WISHLIST</span></h1>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[8px] md:text-[10px] mt-1 md:mt-2 italic">Your curated collection of favorites</p>
          </div>
        </div>

        {wishlist?.products?.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 sm:p-16 md:p-24 text-center border border-slate-100 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 bg-orange-500/5 blur-[100px] md:blur-[120px] rounded-full group-hover:bg-orange-500/15 transition-colors duration-700" />

            <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 bg-slate-50 border border-slate-100 shadow-inner rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8">
               <motion.div 
                  animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               >
                  <Heart size={40} className="md:w-12 md:h-12 text-slate-300 drop-shadow-sm" />
               </motion.div>
            </div>
            
            <h2 className="relative z-10 text-3xl md:text-4xl font-black italic tracking-tighter text-slate-900 mb-2 md:mb-3 uppercase">Wishlist is <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Empty.</span></h2>
            <p className="relative z-10 text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px] max-w-sm mx-auto leading-relaxed mb-8 md:mb-12">Looks like you haven't added anything to your wishlist yet. Discover professional designs and curate your collection.</p>
            
            <Button onClick={() => navigate('/catalog')} className="relative z-10 h-14 md:h-16 px-8 md:px-12 rounded-2xl bg-slate-900 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-[10px] md:text-xs gap-3 shadow-sm transition-all hover:scale-105 active:scale-95 group/btn">
              DISCOVER PRODUCTS <ArrowRight size={16} className="md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
            <AnimatePresence mode="popLayout">
              {wishlist.products.map((p: any) => (
                <motion.div
                  key={p._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  className="group relative bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:border-slate-200 hover:-translate-y-3 transition-all duration-500"
                >
                  <div className="relative aspect-[4/5] bg-slate-50 flex items-center justify-center">
                     <ShoppingBag size={64} className="text-slate-100 group-hover:scale-125 group-hover:rotate-6 transition-transform duration-700" />
                     
                     <div className="absolute top-4 left-4 md:top-6 md:left-6">
                        <div className="px-3 md:px-4 py-1.5 md:py-2 bg-white/90 backdrop-blur-xl rounded-full border border-slate-100 shadow-sm flex items-center gap-1.5 md:gap-2">
                           <Tag size={10} className="text-orange-500 md:w-3 md:h-3" />
                           <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">{p.category}</span>
                        </div>
                     </div>

                     <div className="absolute top-4 right-4 md:top-6 md:right-6">
                        <button 
                          onClick={() => removeItem(p._id)}
                          className="h-8 w-8 md:h-10 md:w-10 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center text-slate-300 hover:text-orange-500 hover:scale-110 shadow-sm transition-all"
                        >
                           <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                     </div>
                  </div>

                  <div className="p-6 md:p-8">
                     <div className="mb-6 md:mb-8">
                        <h3 className="text-lg md:text-xl font-black italic text-slate-900 group-hover:text-orange-500 transition-colors duration-300">{p.productName}</h3>
                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 md:mt-2 flex items-center gap-1.5 leading-none">
                           <Sparkles size={10} className="text-amber-400 md:w-3 md:h-3" /> Premium Selection
                        </p>
                     </div>

                     <div className="flex items-center justify-between pt-5 md:pt-6 border-t border-slate-50">
                        <div>
                           <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none shadow-slate-100">Price</p>
                           <span className="text-2xl md:text-3xl font-black italic text-slate-900 tracking-tighter">₹{p.price}</span>
                        </div>
                        
                        <Button 
                          onClick={() => moveToCart(p._id)}
                          className="h-10 w-10 md:h-12 md:w-12 p-0 rounded-xl md:rounded-2xl bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm active:scale-90"
                        >
                           <ShoppingBag size={18} className="md:w-5 md:h-5" />
                        </Button>
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Wishlist;

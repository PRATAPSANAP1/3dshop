import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const [cart, setCart] = useState<any>({ items: [] });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const { data } = await api.get("/cart");
      setCart(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load cart" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQty = async (productId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      const { data } = await api.put("/cart/update-qty", { productId, qty: newQty });
      setCart(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update quantity" });
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const { data } = await api.delete(`/cart/${productId}`);
      setCart(data);
      toast({ title: "Removed", description: "Item removed from cart" });
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not remove item" });
    }
  };

  const totalPrice = cart?.items?.reduce((acc: number, item: any) => acc + (item.product?.price || 0) * item.qty, 0) || 0;

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="page-loader" /></div>;

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-4 mb-8 md:mb-12">
          <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white ">
            <ShoppingCart size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
              <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>home</span>
              <span className="text-slate-300">/</span>
              <span className="text-primary">cart</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-slate-900 leading-none">CART</h1>
          </div>
        </div>

        {cart?.items?.length === 0 ? (
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
                  <ShoppingCart size={40} className="md:w-12 md:h-12 text-slate-300 drop-shadow-sm" />
               </motion.div>
            </div>
            
            <h2 className="relative z-10 text-3xl md:text-4xl font-black italic tracking-tighter text-slate-900 mb-8 uppercase">Cart is <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Empty.</span></h2>
            
            <Button onClick={() => navigate('/catalog')} className="relative z-10 h-14 md:h-16 px-8 md:px-12 rounded-2xl bg-slate-900 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-[10px] md:text-xs gap-3 shadow-sm transition-all hover:scale-105 active:scale-95 group/btn">
              Start Shopping <ArrowRight size={16} className="md:w-[18px] md:h-[18px] group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="popLayout">
                {cart?.items?.map((item: any) => (
                  <motion.div 
                    key={item.product?._id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-4 p-4 sm:p-6 bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm hover:border-orange-100 transition-all group"
                  >
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                       <ShoppingCart size={32} className="text-slate-100 group-hover:scale-110 transition-transform" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-2">
                       <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-black italic text-slate-900 leading-tight mb-1">{item.product?.productName}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.product?.category}</p>
                          </div>
                          <button onClick={() => removeItem(item.product?._id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                            <Trash2 size={20} />
                          </button>
                       </div>

                       <div className="flex items-center justify-between mt-6">
                          <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
                             <button 
                               onClick={() => updateQty(item.product?._id, item.qty - 1)}
                               className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
                             >
                                <Minus size={14} className="text-slate-400" />
                             </button>
                             <span className="w-8 text-center font-black italic text-slate-900">{item.qty}</span>
                             <button 
                               onClick={() => updateQty(item.product?._id, item.qty + 1)}
                               className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
                             >
                                <Plus size={14} className="text-orange-500" />
                             </button>
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Item Total</p>
                             <p className="text-2xl font-black italic text-slate-900">₹{(item.product?.price || 0) * item.qty}</p>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="space-y-6">
               <div className="bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 text-white sticky top-24">
                  <h3 className="text-xl font-black italic mb-8 flex items-center gap-2">
                    <CreditCard size={20} className="text-orange-500" /> ORDER SUMMARY
                  </h3>
                  
                  <div className="space-y-4 mb-8">
                     <div className="flex justify-between items-center text-slate-400">
                        <span className="font-bold text-xs uppercase tracking-widest">Subtotal</span>
                        <span className="font-black italic">₹{totalPrice}</span>
                     </div>
                     <div className="flex justify-between items-center text-slate-400">
                        <span className="font-bold text-xs uppercase tracking-widest">Shipping</span>
                        <span className="font-black italic text-orange-500">FREE</span>
                     </div>
                     <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="font-black text-lg italic tracking-tighter">TOTAL</span>
                        <span className="text-3xl font-black text-orange-500 italic leading-none">₹{totalPrice}</span>
                     </div>
                  </div>

                  <Button onClick={() => navigate('/checkout')} className="w-full h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-sm  gap-3 group">
                    PROCEED TO PAY <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                     <ShieldCheck size={14} className="text-emerald-500" /> Encrypted & Secure Checkout
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Cart;

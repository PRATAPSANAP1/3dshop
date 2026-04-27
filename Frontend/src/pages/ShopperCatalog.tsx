import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Heart, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const PALETTES = [
  { grad: "from-slate-800 to-slate-900", soft: "bg-slate-50/50", txt: "text-slate-800", border: "border-slate-200", dot: "#1e293b", btn: "bg-slate-100 text-slate-800 hover:bg-slate-900 hover:text-white" },
  { grad: "from-amber-400 to-orange-600", soft: "bg-orange-50/50", txt: "text-orange-600", border: "border-orange-100", dot: "#f59e0b", btn: "bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white" },
  { grad: "from-violet-500 to-indigo-600", soft: "bg-violet-50/50", txt: "text-violet-600", border: "border-violet-100", dot: "#8b5cf6", btn: "bg-violet-50 text-violet-500 hover:bg-violet-500 hover:text-white" },
  { grad: "from-cyan-400 to-blue-600", soft: "bg-cyan-50/50", txt: "text-cyan-600", border: "border-cyan-100", dot: "#06b6d4", btn: "bg-cyan-50 text-cyan-500 hover:bg-cyan-500 hover:text-white" },
  { grad: "from-emerald-400 to-teal-600", soft: "bg-emerald-50/50", txt: "text-emerald-600", border: "border-emerald-100", dot: "#10b981", btn: "bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white" },
  { grad: "from-rose-400 to-pink-600", soft: "bg-rose-50/50", txt: "text-rose-600", border: "border-rose-100", dot: "#f43f5e", btn: "bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white" },
  { grad: "from-sky-400 to-indigo-500", soft: "bg-sky-50/50", txt: "text-sky-600", border: "border-sky-100", dot: "#0ea5e9", btn: "bg-sky-50 text-sky-500 hover:bg-sky-500 hover:text-white" },
  { grad: "from-fuchsia-500 to-purple-600", soft: "bg-fuchsia-50/50", txt: "text-fuchsia-600", border: "border-fuchsia-100", dot: "#d946ef", btn: "bg-fuchsia-50 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-white" },
];

const getColorIndex = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % PALETTES.length;
};

const ShopperCatalog = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    api.get('/public/all')
      .then(({ data }) => setProducts(data))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to load catalog" }))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, productId: string, productName: string) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    try {
      await api.post('/cart/add', { productId, qty: 1 });
      toast({ title: '✓ Added to Cart', description: `${productName} added successfully` });
    } catch {
      toast({ variant: 'destructive', title: 'Could not add to cart' });
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent, productId: string, productName: string) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    try {
      await api.post('/wishlist/add', { productId });
      toast({ title: '✓ Saved to Wishlist', description: `${productName} added to wishlist` });
    } catch {
      toast({ variant: 'destructive', title: 'Could not add to wishlist' });
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(cats) as string[]];
  }, [products]);

  const filteredProducts = products.filter(
    (p) =>
      (activeCategory === "All" || p.category === activeCategory) &&
      (p.productName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Search + filter bar */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl pt-1 pb-4 space-y-4">
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center z-10 shadow-sm">
              <Search size={13} className="text-white" />
            </div>
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-12 pr-4 rounded-2xl border-slate-200 focus:border-orange-400 focus:ring-orange-500/10 font-bold text-slate-700 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-wrap">
            {categories.map((cat) => {
               const ci = cat === "All" ? 0 : getColorIndex(cat);
               const p = PALETTES[ci];
               const isActive = activeCategory === cat;
               return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2 ${
                      isActive
                        ? "text-white border-transparent shadow-md"
                        : `bg-white ${p.txt} ${p.border} hover:scale-105`
                    }`}
                    style={isActive ? { background: `linear-gradient(135deg, ${p.dot}, ${p.dot}cc)` } : {}}
                  >
                    {cat}
                  </button>
               )
            })}
          </div>
        </div>

        {/* Product grid */}
        {filteredProducts.length === 0 && !loading ? (
          <div className="text-center py-20">
            <ShoppingBag size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold text-sm">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((p, i) => {
                const ci = getColorIndex(p.category || 'General');
                const pal = PALETTES[ci];
                return (
                  <motion.div
                    key={p._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ delay: i * 0.03, type: 'spring', damping: 20 }}
                    className="group relative flex flex-col bg-white rounded-2xl sm:rounded-[2.5rem] border-2 border-slate-100 overflow-hidden shadow-sm hover:border-transparent hover:shadow-xl transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/product/${p._id}`)}
                  >
                    {/* Gradient Banner */}
                    <div className={`relative h-24 sm:h-32 flex flex-col justify-between p-3 sm:p-5 bg-gradient-to-br ${pal.grad} overflow-hidden`}>
                      {/* Decorative blurred circles */}
                      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/20 blur-xl" />
                      <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-black/10 blur-2xl" />

                      <div className="relative z-10 flex items-start justify-between">
                        <span className="px-2.5 py-1 bg-white/25 backdrop-blur-md rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white border border-white/20">
                          {p.category || 'General'}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          onClick={(e) => handleAddToWishlist(e, p._id, p.productName)}
                          className="p-2 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-rose-500 transition-all shadow-sm"
                        >
                          <Heart size={14} fill="currentColor" className="sm:w-4 sm:h-4" />
                        </motion.button>
                      </div>

                      {/* Quick view on hover */}
                      <div className="relative z-10 hidden sm:block overflow-hidden">
                        <motion.button
                          initial={{ y: 20, opacity: 0 }}
                          whileHover={{ scale: 1.02 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="w-full h-8 bg-white/90 hover:bg-white backdrop-blur-md rounded-xl text-slate-900 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-sm translate-y-10 group-hover:translate-y-0 duration-300"
                          onClick={(e) => { e.stopPropagation(); navigate(`/product/${p._id}`); }}
                        >
                          Quick View <ChevronRight size={12} strokeWidth={3} />
                        </motion.button>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className={`p-4 sm:p-6 flex flex-col flex-1 ${pal.soft} transition-colors duration-300`}>
                      <div className="mb-4">
                        <h3 className="text-sm sm:text-[15px] font-black text-slate-900 leading-snug line-clamp-2 mb-1.5 group-hover:text-slate-700 transition-colors">
                          {p.productName}
                        </h3>
                        <div className="flex items-center gap-1.5 opacity-60">
                           <Sparkles size={10} className={pal.txt} />
                           <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                             {p.category || 'Premium Selection'}
                           </p>
                        </div>
                      </div>

                      <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-200/50">
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5 ml-0.5">Price</span>
                           <span className={`text-xl sm:text-2xl font-black italic tracking-tighter ${pal.txt} leading-none`}>₹{p.price}</span>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          onClick={(e) => handleAddToCart(e, p._id, p.productName)}
                          className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl ${pal.btn} transition-all flex items-center justify-center shadow-sm active:scale-90`}
                        >
                          <ShoppingBag size={16} strokeWidth={2.5} className="sm:w-5 sm:h-5" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Bottom accent strip */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${pal.grad} opacity-40 group-hover:opacity-100 transition-opacity duration-500`} />

                    {p.quantity === 0 && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none">
                        <div className="px-6 py-2 bg-rose-500 text-white rounded-2xl rotate-[-10deg] shadow-lg">
                          <p className="font-black uppercase tracking-widest text-xs">Out of Stock</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default ShopperCatalog;

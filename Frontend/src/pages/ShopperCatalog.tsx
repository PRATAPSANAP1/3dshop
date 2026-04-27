import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Heart, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

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

  const GRADIENTS = [
    'from-orange-500 to-amber-500',
    'from-violet-500 to-purple-500',
    'from-cyan-500 to-blue-500',
    'from-emerald-500 to-green-500',
    'from-rose-500 to-pink-500',
  ];



  const SOFT_COLORS = [
    'bg-orange-50/50',
    'bg-violet-50/50',
    'bg-cyan-50/50',
    'bg-emerald-50/50',
    'bg-rose-50/50',
  ];

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Search + filter bar */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl pt-1 pb-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-11 pr-4 rounded-2xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/10 font-bold text-slate-700"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                  activeCategory === cat
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold text-sm">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((p, i) => (
                <motion.div
                  key={p._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className={`group relative flex flex-col ${SOFT_COLORS[i % SOFT_COLORS.length]} rounded-2xl sm:rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:border-orange-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
                  onClick={() => navigate(`/product/${p._id}`)}
                >
                  {/* Color banner */}
                  <div className={`relative h-20 sm:h-28 flex flex-col justify-between p-2.5 sm:p-4 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`}>
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/90">
                        {p.category || 'General'}
                      </span>
                      <button
                        onClick={(e) => handleAddToWishlist(e, p._id, p.productName)}
                        className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white hover:text-rose-500 transition-all active:scale-95"
                      >
                        <Heart size={12} className="sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                    {/* Quick view on hover — desktop only */}
                    <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/product/${p._id}`); }}
                        className="w-full h-7 bg-white/20 hover:bg-white backdrop-blur-sm rounded-lg text-white hover:text-slate-900 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                      >
                        Quick View <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 sm:p-5 flex flex-col flex-1">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight line-clamp-2 mb-1 group-hover:text-orange-500 transition-colors">
                      {p.productName}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      {p.category || 'Collection'}{[p.brand, p.size].filter(Boolean).map(text => ` • ${text}`).join('')}
                    </p>
                    <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-2.5 sm:pt-4">
                      <span className="text-base sm:text-xl font-black text-slate-900">₹{p.price}</span>
                      <button
                        onClick={(e) => handleAddToCart(e, p._id, p.productName)}
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center active:scale-95"
                      >
                        <ShoppingBag size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>

                  {p.quantity === 0 && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none">
                      <div className="px-4 py-1.5 bg-rose-500 text-white rounded-xl rotate-[-10deg]">
                        <p className="font-black uppercase tracking-widest text-[10px]">Out of Stock</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default ShopperCatalog;

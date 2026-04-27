import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  Search, ShoppingCart, Bell, User, ChevronRight,
  Package, Truck, ArrowRight, BarChart3, Box,
  X, ShieldCheck, Clock, Heart, Apple, Cpu, Shirt, Layers, Zap, ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Hero3DScene from '@/components/Hero3DScene';

interface Product {
  _id: string;
  productName: string;
  price: number;
  category: string;
  brand?: string;
  size?: string;
}

const PALETTES = [
  { grad: "from-orange-400 to-amber-600", soft: "bg-orange-50/50", txt: "text-orange-600", border: "border-orange-100", dot: "#f59e0b", btn: "bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white" },
  { grad: "from-violet-500 to-indigo-600", soft: "bg-violet-50/50", txt: "text-violet-600", border: "border-violet-100", dot: "#8b5cf6", btn: "bg-violet-50 text-violet-500 hover:bg-violet-500 hover:text-white" },
  { grad: "from-cyan-400 to-blue-600", soft: "bg-cyan-50/50", txt: "text-cyan-600", border: "border-cyan-100", dot: "#06b6d4", btn: "bg-cyan-50 text-cyan-500 hover:bg-cyan-500 hover:text-white" },
  { grad: "from-emerald-400 to-teal-600", soft: "bg-emerald-50/50", txt: "text-emerald-600", border: "border-emerald-100", dot: "#10b981", btn: "bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white" },
  { grad: "from-rose-400 to-pink-600", soft: "bg-rose-50/50", txt: "text-rose-600", border: "border-rose-100", dot: "#f43f5e", btn: "bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white" },
  { grad: "from-sky-400 to-indigo-500", soft: "bg-sky-50/50", txt: "text-sky-600", border: "border-sky-100", dot: "#0ea5e9", btn: "bg-sky-50 text-sky-500 hover:bg-sky-500 hover:text-white" },
  { grad: "from-fuchsia-500 to-purple-600", soft: "bg-fuchsia-50/50", txt: "text-fuchsia-600", border: "border-fuchsia-100", dot: "#d946ef", btn: "bg-fuchsia-50 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-white" },
  { grad: "from-indigo-600 to-blue-700", soft: "bg-indigo-50/50", txt: "text-indigo-600", border: "border-indigo-100", dot: "#4f46e5", btn: "bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white" },
];

const getColorIndex = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % PALETTES.length;
};

const getCategoryIcon = (cat: string) => {
  const c = cat.toLowerCase();
  if (c.includes('fruit') || c.includes('veg') || c.includes('food')) return Apple;
  if (c.includes('elec') || c.includes('gadget') || c.includes('tech')) return Cpu;
  if (c.includes('cloth') || c.includes('fashion') || c.includes('wear')) return Shirt;
  if (c.includes('home') || c.includes('furni')) return Layers;
  if (c.includes('sale') || c.includes('deal')) return Zap;
  return Box;
};

const MobileSearchOverlay = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const debounce = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/public/search?query=${query}`);
        setResults(data.slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] bg-white flex flex-col"
        >
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-base font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <button onClick={onClose} className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-slate-50/50">
            {query.trim() && results.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-bold text-slate-400">No products found for "{query}"</p>
              </div>
            ) : results.length > 0 ? (
              <div className="p-4 space-y-3">
                <p className="px-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">Search Results ({results.length})</p>
                {results.map((p) => (
                  <motion.div
                    key={p._id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { onClose(); navigate(`/product/${p._id}`); }}
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 active:border-orange-200 transition-colors"
                  >
                    <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-orange-500">
                      <Box size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-slate-900 truncate uppercase mt-0.5">{p.productName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {p.category}{p.brand ? ` • ${p.brand}` : ''}{p.size ? ` • ${p.size}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-black text-slate-900">₹{p.price}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Search size={48} className="mx-auto mb-4 text-slate-100" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Start typing to search...</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ProductCard = ({ product, index }: { product: Product; index: number }) => {
  const navigate = useNavigate();
  const palette = PALETTES[getColorIndex(product.category)];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="w-[280px] md:w-[360px] bg-white border border-slate-100 p-6 snap-start cursor-pointer relative overflow-hidden rounded-[2.5rem] shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex-shrink-0 group"
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <button className="absolute top-4 right-4 h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-100 z-10">
        <Heart size={18} />
      </button>
      
      <div className={`h-40 w-full bg-gradient-to-br ${palette.grad} rounded-[1.5rem] mb-4 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
        <div className="relative">
          <Box size={48} className="text-white/40 drop-shadow-lg" />
          <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="font-black text-base text-slate-900 tracking-tight truncate uppercase">{product.productName}</h3>
        <p className={`text-[10px] font-black ${palette.txt} uppercase tracking-[0.2em]`}>{product.category}</p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Price</span>
          <span className="text-2xl font-black text-slate-900 leading-none italic">₹{product.price}</span>
        </div>
        <div className={`h-11 w-11 rounded-2xl ${palette.btn} flex items-center justify-center transition-all group-hover:scale-110 shadow-sm shadow-orange-500/10`}>
          <ShoppingBag size={20} />
        </div>
      </div>
    </motion.div>
  );
};

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const { data: shops } = await api.get('/shop-config/public/shops/list');
        if (shops?.length > 0) {
          const { data: racks } = await api.get(`/public/racks/${shops[0]}`);
          
          // Parallel fetch for rack products
          const rackPromises = racks.slice(0, 3).map((r: any) => api.get(`/public/products/rack/${r._id}`));
          const rackResults = await Promise.all(rackPromises);
          
          let prods: Product[] = [];
          rackResults.forEach(res => prods.push(...res.data));
          
          setTrending(prods.slice(0, 10));
          setCategories(Array.from(new Set(prods.map((p) => p.category))).slice(0, 8) as string[]);
        }
      } catch (err) {
        console.error("Public fetch failed", err);
      }
    };

    const fetchUserData = async () => {
      if (!user) {
        setActiveOrders([]);
        setCartCount(0);
        return;
      }
      try {
        const [ordersRes, cartRes] = await Promise.all([
          api.get('/orders/mine'),
          api.get('/cart')
        ]);
        setActiveOrders(ordersRes.data.filter((o: any) => !['Delivered', 'Cancelled'].includes(o.orderStatus)));
        setCartCount(cartRes.data.items?.length || 0);
      } catch (err) {
        console.error("User data fetch failed", err);
      }
    };

    const initialize = async () => {
      setLoading(true);
      await Promise.all([fetchPublicData(), fetchUserData()]);
      setLoading(false);
    };

    initialize();
  }, [user]);

  const FEATURES = [
    { icon: Box, title: 'Immersive 3D Shopping', desc: 'Walk through aisles in a spatial 3D environment', color: 'text-orange-500', bg: 'bg-orange-50', primary: true },
    { icon: Search, title: 'Instant Search', desc: 'SKU-level search with real-time results', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: ShieldCheck, title: 'Secure Payments', desc: 'UPI, Card & Netbanking via Razorpay', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: Truck, title: 'Live Tracking', desc: 'Real-time delivery with OTP verification', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: BarChart3, title: 'AI Analytics', desc: 'Heatmaps, footfall & zone efficiency', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Package, title: 'Scanner & POS', desc: 'Dual-mode QR for billing or stock updates', color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <MobileSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* ── STICKY NAVBAR ── */}
      <motion.nav
        className="sticky top-0 z-50 h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">3D<span className="text-primary uppercase italic">shop.</span></span>
          </Link>

          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full group cursor-pointer" onClick={() => setIsSearchOpen(true)}>
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-orange-500 transition-colors" />
              <div className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-100/50 border border-slate-200 text-sm font-bold text-slate-400 flex items-center transition-all hover:bg-slate-100">
                Search products, brands and departments...
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setIsSearchOpen(true)} className="lg:hidden h-10 w-10 flex items-center justify-center text-slate-400 hover:text-orange-500 transition-colors">
              <Search size={22} />
            </button>
            
            <button
              onClick={() => user ? navigate('/notifications') : navigate('/login')}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors"
            >
              <Bell size={22} />
            </button>

            <button
              onClick={() => user ? navigate('/cart') : navigate('/login')}
              className="relative group"
            >
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                <ShoppingCart size={22} />
              </div>
              {cartCount > 0 && <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full animate-ping" />}
              {cartCount > 0 && <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full shadow-sm" />}
            </button>

            <button
              onClick={() => user ? navigate('/profile') : navigate('/login')}
              className="h-10 w-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm hover:ring-2 hover:ring-orange-200 transition-all"
            >
              {user ? (
                <div className="h-full w-full bg-orange-500 flex items-center justify-center text-white font-black text-sm">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              ) : (
                <User size={20} className="text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-slate-200/20 blur-[120px] rounded-full" 
          />
          <motion.div 
            animate={{ opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" 
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 w-full py-20">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95] mb-6 uppercase">
              Your Daily
              <br />
              <span className="italic">Grocery,</span>
              <br />
              <span className="text-slate-600 underline decoration-primary/30 underline-offset-8">Delivered</span>
              <br />
              <span className="text-slate-400">Smart.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 font-medium mb-12 max-w-md">
              Walk through a virtual supermarket, pick what you need, and get it delivered to your door — with live tracking and OTP-verified delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => user ? navigate('/catalog') : navigate('/login')}
                className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-xs transition-all gap-3 group border-none shadow-xl shadow-primary/20"
              >
                Enter 3D Store <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </Button>
              <Button
                onClick={() => navigate('/catalog')}
                className="h-14 px-10 rounded-2xl border border-slate-200 bg-white text-slate-900 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all shadow-sm"
              >
                View All Products
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative w-[500px]">
              <div className="absolute inset-0 bg-orange-500/5 blur-[100px] rounded-full" />
              <div className="relative bg-white border border-slate-100 p-8 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/40 ring-1 ring-slate-100/50">
                <div className="h-72 w-full bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-slate-100 overflow-hidden shadow-inner">
                  <Suspense fallback={<div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-300 font-black italic uppercase">Loading 3D Scene...</div>}>
                    <Hero3DScene />
                  </Suspense>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── LIVE ORDER PILL ── */}
      {activeOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-4 -mt-8 mb-12 relative z-20"
        >
          <motion.div
            whileHover={{ scale: 1.01, y: -2 }}
            className="flex items-center gap-4 p-4 md:p-5 bg-white border border-slate-100 rounded-3xl shadow-lg shadow-slate-200/30 cursor-pointer overflow-hidden group"
            onClick={() => navigate('/orders')}
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 relative overflow-hidden shrink-0">
              <Truck size={24} className="z-10 group-hover:translate-x-1 transition-transform" />
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100 to-transparent"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">On Its Way</p>
                {activeOrders.length > 1 && (
                  <span className="bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">+{activeOrders.length - 1} More</span>
                )}
              </div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                Order #{activeOrders[0]?._id?.slice(-6)} is currently {activeOrders[0]?.orderStatus?.toLowerCase?.() || 'in progress'}.
              </p>
            </div>
            <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </motion.div>
        </motion.div>
      )}

      {/* ── TRENDING PRODUCTS ── */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-16 md:py-24 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 mb-12 flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.3em] mb-2">Curated Trends</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              The <span className="italic underline decoration-primary/20 underline-offset-8">Hotlist.</span>
            </h2>
          </div>
          <Link to="/catalog" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-orange-500 transition-colors flex items-center gap-2 group">
            View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="flex gap-6 overflow-x-auto px-6 md:px-12 pb-8 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
          {loading
            ? Array(4).fill(0).map((_, i) => <div key={i} className="min-w-[280px] h-64 bg-slate-100 rounded-[2.5rem] animate-pulse flex-shrink-0" />)
            : trending.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)
          }
        </div>
      </motion.section>

      {/* ── CATEGORY GRID ── */}
      {categories.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-16 md:py-24 bg-slate-50/50 border-y border-slate-100"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <p className="text-[11px] font-black text-purple-500 uppercase tracking-[0.3em] mb-2">Market Segments</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">Departments.</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {categories.map((cat, i) => {
                const palette = PALETTES[getColorIndex(cat)];
                const Icon = getCategoryIcon(cat);
                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -8, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-slate-200 p-8 rounded-[2.5rem] hover:border-orange-200 transition-all cursor-pointer group shadow-sm"
                    onClick={() => navigate(`/catalog?category=${cat}`)}
                  >
                    <div className={`h-16 w-16 rounded-[1.25rem] ${palette.soft} flex items-center justify-center ${palette.txt} mb-8 group-hover:${palette.btn.split(' ')[2]} group-hover:text-white transition-all duration-500 group-hover:rotate-12`}>
                      <Icon size={28} />
                    </div>
                    <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight leading-none mb-1 group-hover:text-orange-500 transition-colors">{cat}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">Curated Collection</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* ── FEATURES GRID ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Platform Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Everything <span className="italic underline decoration-primary/20 underline-offset-8">Reimagined.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className={`bg-white border border-slate-100 p-8 rounded-[3rem] hover:border-slate-200 hover:shadow-xl transition-all group ${f.primary ? 'lg:col-span-2' : ''}`}
              >
                <div className={`h-14 w-14 rounded-2xl ${f.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm`}>
                  <f.icon size={26} className={f.color} />
                </div>
                <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight mb-3 group-hover:text-orange-500 transition-colors">{f.title}</h3>
                <p className="text-sm text-slate-400 font-semibold leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="py-20 bg-slate-50/50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: <ShieldCheck size={32} />, bg: 'bg-emerald-50 text-emerald-500', title: 'Secure Checkout', desc: 'End-to-end encryption for all transactions.' },
            { icon: <Clock size={32} />, bg: 'bg-amber-50 text-amber-500', title: 'Fast Delivery', desc: 'Real-time dispatch and live tracking.' },
            { icon: <BarChart3 size={32} />, bg: 'bg-orange-50 text-orange-500', title: 'Smart Catalog', desc: 'Personalized product discoveries.' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-6 group">
              <div className={`h-16 w-16 ${f.bg} rounded-2xl flex items-center justify-center border border-white shadow-md shrink-0 group-hover:rotate-6 transition-transform`}>{f.icon}</div>
              <div>
                <h4 className="text-base font-black text-slate-900 uppercase tracking-tight mb-1">{f.title}</h4>
                <p className="text-xs font-semibold text-slate-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-3 gap-6 md:gap-12 text-center bg-white rounded-[4rem] border border-slate-100 p-12 shadow-sm">
          <div>
            <p className="text-3xl md:text-6xl font-black text-primary mb-2 md:mb-4 tracking-tighter italic">50k+</p>
            <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">Customers</p>
          </div>
          <div>
            <p className="text-3xl md:text-6xl font-black text-slate-900 mb-2 md:mb-4 tracking-tighter">30min</p>
            <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">Avg. Dispatch</p>
          </div>
          <div>
            <p className="text-3xl md:text-6xl font-black text-slate-900 mb-2 md:mb-4 tracking-tighter italic">99.9%</p>
            <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">Uptime</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-50 text-slate-900 pt-16 md:pt-24 pb-16 md:pb-12 border-t-2 border-slate-100">
        <div className="max-w-7xl mx-auto h-full px-6 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 mb-12 md:mb-24">
          <div className="col-span-2 md:col-span-2">
            <div className="h-12 w-12 md:h-14 md:w-14 bg-orange-500 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center font-black mb-6 md:mb-8 text-xl text-white shadow-lg shadow-orange-500/20">
              <Zap size={24} fill="currentColor" />
            </div>
            <h2 className="text-2xl md:text-4xl font-black mb-4 md:mb-6 uppercase tracking-tighter italic">3D<span className="text-orange-500">shop.</span></h2>
            <p className="text-slate-500 text-sm md:text-base font-semibold max-w-sm mb-8 md:mb-12 leading-relaxed">
              Experience the future of commerce with our immersive 3D spatial storefront. Shop smarter, track live, and receive securely.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/catalog')}
                className="h-12 md:h-14 px-8 md:px-10 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/10"
              >
                Start Shopping
              </button>
              <button
                onClick={() => user ? navigate('/profile') : navigate('/login')}
                className="h-12 md:h-14 px-8 md:px-10 rounded-2xl bg-white border border-slate-200 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-900 shadow-sm"
              >
                My Account
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 md:mb-8">Shop</p>
            <div className="space-y-3 md:space-y-4">
              {['All Products', 'New Arrivals', 'Deals', 'Categories'].map((link) => (
                <p key={link} className="text-sm md:text-base font-bold text-slate-500 hover:text-orange-500 transition-all cursor-pointer"
                  onClick={() => navigate('/catalog')}>
                  {link}
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 md:mb-8">Support</p>
            <div className="space-y-3 md:space-y-4">
              {[{ label: 'Track Order', path: '/orders' }, { label: 'Help Center', path: '/help' }, { label: 'Returns', path: '/orders' }, { label: 'Contact Us', path: '/help' }].map((item) => (
                <p key={item.label} className="text-sm md:text-base font-bold text-slate-500 hover:text-orange-500 transition-all cursor-pointer"
                  onClick={() => navigate(item.path)}>
                  {item.label}
                </p>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-8 md:pt-12">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center sm:text-left">© 2026 3Dshop Premium Suite · All Rights Reserved.</p>
          <div className="flex items-center gap-4 md:gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span className="cursor-pointer hover:text-orange-500 transition-colors">Privacy</span>
            <span className="cursor-pointer hover:text-orange-500 transition-colors">Terms</span>
            <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">v2.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

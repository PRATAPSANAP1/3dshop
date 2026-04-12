import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  Search, ShoppingCart, Bell, User, ChevronRight,
  Package, Truck, ArrowRight, BarChart3, Box,
  X, ShieldCheck, Clock, Heart
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
        setResults(data.slice(0, 10)); // Limit to 10 for performance
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
            {loading ? (
              <div className="p-12 text-center">
                <div className="h-10 w-10 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Searching products...</p>
              </div>
            ) : query.trim() && results.length === 0 ? (
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
                    <span className="text-sm font-black text-orange-600">₹{p.price}</span>
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
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="w-[280px] md:w-[360px] bg-white border border-slate-100 p-6 snap-start cursor-pointer relative overflow-hidden rounded-[2rem] shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex-shrink-0"
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <button className="absolute top-4 right-4 h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-orange-500 transition-colors border border-slate-100">
        <Heart size={16} />
      </button>
      <div className="h-32 w-full bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl mb-4 flex items-center justify-center">
        <Box size={40} className="text-orange-300" />
      </div>
      <h3 className="font-black text-sm text-slate-900 tracking-tight mb-1 truncate uppercase">{product.productName}</h3>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{product.category}</p>
      <div className="flex items-center justify-between">
        <span className="text-xl font-black text-slate-900">₹{product.price}</span>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/product/${product._id}`); }}
          className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white hover:bg-orange-500 transition-colors"
        >
          <ArrowRight size={16} />
        </button>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: shops } = await api.get('/shop-config/public/shops/list');
        if (shops?.length > 0) {
          const { data: racks } = await api.get(`/public/racks/${shops[0]}`);
          let prods: Product[] = [];
          for (const r of racks.slice(0, 3)) {
            const { data: p } = await api.get(`/public/products/rack/${r._id}`);
            prods.push(...p);
          }
          setTrending(prods.slice(0, 10));
          setCategories(Array.from(new Set(prods.map((p) => p.category))).slice(0, 8) as string[]);
        }
        if (user) {
          const { data: orders } = await api.get('/orders/mine');
          setActiveOrders(orders.filter((o: any) => !['Delivered', 'Cancelled'].includes(o.orderStatus)));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const FEATURES = [
    { icon: Box, title: 'Immersive 3D Shopping', desc: 'Walk through aisles in a spatial 3D environment', color: 'text-orange-500', bg: 'bg-orange-50' },
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
            <div className="h-10 w-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-lg group-hover:rotate-6 transition-transform">3D</div>
            <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">3D<span className="text-orange-500">shop.</span></span>
          </Link>

          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
              <input
                placeholder="Search products, brands and departments..."
                className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                onClick={() => setIsSearchOpen(true)}
                readOnly
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setIsSearchOpen(true)} className="lg:hidden h-10 w-10 flex items-center justify-center text-slate-400">
              <Search size={22} />
            </button>
            <button
              onClick={() => user ? navigate('/cart') : navigate('/login')}
              className="relative"
            >
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-orange-50 hover:text-orange-500 transition-colors">
                <ShoppingCart size={22} />
              </div>
              {user && <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full animate-ping" />}
              {user && <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full" />}
            </button>
            <button
              onClick={() => user ? navigate('/notifications') : navigate('/login')}
              className="hidden md:flex h-10 w-10 rounded-xl items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors"
            >
              <Bell size={22} />
            </button>
            <button
              onClick={() => user ? navigate('/profile') : navigate('/login')}
              className="h-10 w-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm"
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
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/5 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02]"
            style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 w-full py-20">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95] mb-6 uppercase">
              Your Daily
              <br />
              <span className="text-orange-500">Grocery,</span>
              <br />
              Delivered
              <br />
              <span className="text-slate-400">Smart.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 font-medium mb-12 max-w-md">
              Walk through a virtual supermarket, pick what you need, and get it delivered to your door — with live tracking and OTP-verified delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => user ? navigate('/') : navigate('/login')}
                className="h-16 px-10 rounded-2xl bg-orange-500 hover:bg-slate-900 text-white font-black uppercase tracking-widest text-xs transition-all gap-3 group border-none"
              >
                Enter 3D Store <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </Button>
              <Button
                onClick={() => navigate('/catalog')}
                className="h-16 px-10 rounded-2xl border border-slate-200 bg-white text-slate-900 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
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
              <div className="absolute inset-0 bg-orange-500/10 blur-[100px] rounded-full animate-pulse" />
              <div className="relative bg-white border border-slate-100 p-8 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                <div className="h-72 w-full bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100 overflow-hidden">
                  <Hero3DScene />
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
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 p-4 md:p-5 bg-white border border-slate-100 rounded-3xl shadow-sm cursor-pointer"
            onClick={() => navigate('/orders')}
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 relative overflow-hidden">
              <Truck size={24} className="z-10" />
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100 to-transparent"
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5 animate-pulse">On Its Way</p>
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Your order is currently {activeOrders[0]?.orderStatus?.toLowerCase?.() || 'in progress'}.
              </p>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
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
              The <span className="text-orange-500">Hotlist.</span>
            </h2>
          </div>
          <Link to="/catalog" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-orange-500 transition-colors flex items-center gap-2">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex gap-6 overflow-x-auto px-6 md:px-12 pb-8 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
          {loading
            ? Array(4).fill(0).map((_, i) => <div key={i} className="min-w-[280px] h-64 bg-slate-100 rounded-[2rem] animate-pulse flex-shrink-0" />)
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
          className="py-16 md:py-24 bg-slate-50/50"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <p className="text-[11px] font-black text-purple-500 uppercase tracking-[0.3em] mb-2">Market Segments</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Departments.</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white border border-slate-100 p-6 rounded-[2rem] hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => navigate('/catalog')}
                >
                  <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <Box size={24} />
                  </div>
                  <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight leading-none mb-1">{cat}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Browse products</p>
                </motion.div>
              ))}
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
              Everything <span className="text-orange-500">Reimagined.</span>
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
                className="bg-white border border-slate-100 p-6 rounded-[2rem] hover:border-slate-200 hover:shadow-sm transition-all group"
              >
                <div className={`h-12 w-12 rounded-2xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon size={22} className={f.color} />
                </div>
                <h3 className="font-black text-base text-slate-900 uppercase tracking-tight mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="py-16 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: <ShieldCheck size={32} className="text-emerald-500" />, title: 'Secure Checkout', desc: 'End-to-end encryption for all transactions.' },
            { icon: <Clock size={32} className="text-amber-500" />, title: 'Fast Delivery', desc: 'Real-time dispatch and live tracking.' },
            { icon: <BarChart3 size={32} className="text-orange-500" />, title: 'Smart Catalog', desc: 'Personalized product discoveries.' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-6">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm shrink-0">{f.icon}</div>
              <div>
                <h4 className="text-base font-black text-slate-900 uppercase tracking-tight mb-1">{f.title}</h4>
                <p className="text-xs font-medium text-slate-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-3 gap-6 md:gap-12 text-center">
          <div>
            <p className="text-3xl md:text-5xl font-black text-slate-900 mb-2 md:mb-4 tracking-tighter">50k+</p>
            <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">Customers</p>
          </div>
          <div>
            <p className="text-3xl md:text-5xl font-black text-orange-500 mb-2 md:mb-4 tracking-tighter">30min</p>
            <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">Avg. Dispatch</p>
          </div>
          <div>
            <p className="text-3xl md:text-5xl font-black text-slate-900 mb-2 md:mb-4 tracking-tighter">99.9%</p>
            <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">Uptime</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white text-slate-900 pt-12 md:pt-24 pb-24 md:pb-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 mb-10 md:mb-24">
          <div className="col-span-2 md:col-span-2">
            <div className="h-10 w-10 md:h-12 md:w-12 bg-orange-500 rounded-xl md:rounded-2xl flex items-center justify-center font-black mb-5 md:mb-8 text-base md:text-xl text-white">3D</div>
            <h2 className="text-2xl md:text-4xl font-black mb-3 md:mb-6 uppercase tracking-tighter">3Dshop.</h2>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-sm mb-6 md:mb-12">
              Your neighbourhood supermarket, now in 3D. Shop smarter, track live, receive securely.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => user ? navigate('/catalog') : navigate('/login')}
                className="h-10 md:h-12 px-5 md:px-8 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all"
              >
                Start Shopping
              </button>
              <button
                onClick={() => user ? navigate('/profile') : navigate('/login')}
                className="h-10 md:h-12 px-5 md:px-8 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-slate-900"
              >
                My Account
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-5 md:mb-8">Shop</p>
            <div className="space-y-3 md:space-y-4">
              {['All Products', 'New Arrivals', 'Deals', 'Categories'].map((link) => (
                <p key={link} className="text-sm md:text-base font-black text-slate-400 hover:text-orange-500 transition-all cursor-pointer"
                  onClick={() => user ? navigate('/catalog') : navigate('/login')}>
                  {link}
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-5 md:mb-8">Support</p>
            <div className="space-y-3 md:space-y-4">
              {[{ label: 'Track Order', path: '/orders' }, { label: 'Help Center', path: '/help' }, { label: 'Returns', path: '/orders' }, { label: 'Contact Us', path: '/help' }].map((item) => (
                <p key={item.label} className="text-sm md:text-base font-black text-slate-400 hover:text-orange-500 transition-all cursor-pointer"
                  onClick={() => navigate(item.path)}>
                  {item.label}
                </p>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6 md:pt-12">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center sm:text-left">© 2026 3Dshop Premium Suite · All Rights Reserved.</p>
          <div className="flex items-center gap-4 md:gap-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <span className="cursor-pointer hover:text-slate-500">Privacy</span>
            <span className="cursor-pointer hover:text-slate-500">Terms</span>
            <span className="text-orange-500">v2.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

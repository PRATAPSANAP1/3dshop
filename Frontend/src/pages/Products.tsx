import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Package, AlertTriangle, X, IndianRupee, Layers, Tag, TrendingUp, ShoppingBag, Edit2, Trash2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import SkeletonCard from "@/components/SkeletonCard";
import QRLabelModal from "@/components/QRLabelModal";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const CARD_COLORS = [
  { bg: "from-orange-500 to-amber-500", light: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-200" },
  { bg: "from-violet-500 to-purple-500", light: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-200" },
  { bg: "from-cyan-500 to-blue-500", light: "bg-cyan-50", text: "text-cyan-600", ring: "ring-cyan-200" },
  { bg: "from-emerald-500 to-green-500", light: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-200" },
  { bg: "from-rose-500 to-pink-500", light: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-200" },
  { bg: "from-amber-500 to-yellow-500", light: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-200" },
  { bg: "from-indigo-500 to-blue-600", light: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-200" },
  { bg: "from-teal-500 to-emerald-500", light: "bg-teal-50", text: "text-teal-600", ring: "ring-teal-200" },
];

const getColorIndex = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % CARD_COLORS.length;
};

const Products = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form, setForm] = useState({ productName: '', category: '', price: '', quantity: '', minStockLevel: '' });
  const [qrProduct, setQrProduct] = useState<any>(null);
  const { toast } = useToast();

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(cats) as string[]];
  }, [products]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Fetch Error", description: "Failed to load products" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, form);
        toast({ variant: "success", title: "Product Updated", description: `${form.productName} has been updated` });
      } else {
        await api.post('/products', form);
        toast({ variant: "success", title: "Product Added", description: `${form.productName} is now live` });
      }
      setShowAddModal(false);
      setEditingProduct(null);
      setForm({ productName: '', category: '', price: '', quantity: '', minStockLevel: '' });
      fetchProducts();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: editingProduct ? "Could not update product" : "Could not add product" });
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast({ variant: "success", title: "Deleted", description: `${name} removed from catalog` });
      fetchProducts();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete product" });
    }
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setForm({
      productName: product.productName || '',
      category: product.category || '',
      price: String(product.price || ''),
      quantity: String(product.quantity || ''),
      minStockLevel: String(product.minStockLevel || ''),
    });
    setShowAddModal(true);
  };

  const filtered = products.filter(
    (p) =>
      (activeCategory === "All" || p.category === activeCategory) &&
      (p.productName || p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = products.reduce((s, p) => s + (p.quantity || 0), 0);
  const totalValue = products.reduce((s, p) => s + ((p.price || 0) * (p.quantity || 0)), 0);
  const lowStockCount = products.filter(p => p.quantity < p.minStockLevel).length;

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-[2rem] bg-slate-100 animate-pulse" />)}
          </div>
          <div className="h-16 bg-slate-100 rounded-[2rem] animate-pulse" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-[2rem] bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              PRODUCT <span className="text-orange-500 not-italic">CATALOG.</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{products.length} SKUs Registered</p>
          </div>
          <Button onClick={() => { setEditingProduct(null); setForm({ productName: '', category: '', price: '', quantity: '', minStockLevel: '' }); setShowAddModal(true); }} className="gap-2 h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm shadow-orange-500/20 border-none text-white" style={{ background: 'linear-gradient(135deg, #EA580C 0%, #D97706 100%)' }}>
            <Plus className="h-4 w-4" strokeWidth={3} />
            Add Product
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-[2rem] border border-slate-100 p-6 flex items-center gap-4 group hover:border-orange-200 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-orange-200 group-hover:scale-110 transition-transform">
              <Layers size={22} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Stock</p>
              <p className="text-2xl font-black text-slate-900 italic leading-none mt-1">{totalStock.toLocaleString()}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-[2rem] border border-slate-100 p-6 flex items-center gap-4 group hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200 group-hover:scale-110 transition-transform">
              <IndianRupee size={22} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inventory Value</p>
              <p className="text-2xl font-black text-slate-900 italic leading-none mt-1">₹{totalValue.toLocaleString()}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-[2rem] border border-slate-100 p-6 flex items-center gap-4 group hover:border-rose-200 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-sm shadow-rose-200 group-hover:scale-110 transition-transform">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Low Stock Alerts</p>
              <p className="text-2xl font-black text-slate-900 italic leading-none mt-1">{lowStockCount} <span className="text-sm font-normal text-slate-300">items</span></p>
            </div>
          </motion.div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-white p-3 rounded-[2rem] border border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-xl border-slate-200 focus:ring-orange-500/10 focus:border-orange-400 transition-all font-bold text-slate-700"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const ci = cat === "All" ? -1 : getColorIndex(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                    activeCategory === cat
                      ? "text-white shadow-sm"
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100"
                  }`}
                  style={activeCategory === cat ? {
                    background: cat === "All"
                      ? "linear-gradient(135deg, #0f172a 0%, #334155 100%)"
                      : `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                    ...(cat !== "All" && { background: `linear-gradient(135deg, ${['#EA580C','#8B5CF6','#06B6D4','#10B981','#F43F5E','#F59E0B','#6366F1','#14B8A6'][ci]} 0%, ${['#D97706','#A855F7','#3B82F6','#22C55E','#EC4899','#EAB308','#818CF8','#10B981'][ci]} 100%)` })
                  } : {}}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((product, i) => {
              const isLow = product.quantity < product.minStockLevel;
              const ci = getColorIndex(product.category || 'Uncategorized');
              const palette = CARD_COLORS[ci];
              return (
                <motion.div
                  key={product._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ delay: i * 0.03, type: "spring", damping: 20 }}
                  className="group relative bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:border-slate-300 hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col h-full"
                >
                  {/* Edit / Delete / QR overlay */}
                  <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {product.qrCode && (
                      <button
                        onClick={e => { e.stopPropagation(); setQrProduct(product); }}
                        className="h-8 w-8 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-violet-500 hover:border-violet-300 transition-colors shadow-sm"
                        title="QR Label (Print / PDF)"
                      >
                        <QrCode size={13} />
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(product); }}
                      className="h-8 w-8 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-orange-500 hover:border-orange-300 transition-colors shadow-sm"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteProduct(product._id, product.productName); }}
                      className="h-8 w-8 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:border-rose-300 transition-colors shadow-sm"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {/* Gradient Header */}
                  <div className={`relative h-10 bg-gradient-to-br ${palette.bg} p-5 flex flex-col justify-between overflow-hidden`}>
                    <div className="flex items-start justify-between relative z-10">
                      <div className={`px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/10`}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/90">{product.category || "General"}</p>
                      </div>
                      {isLow && (
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                          className="flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md px-2.5 py-1 border border-white/10"
                        >
                          <AlertTriangle size={10} className="text-white" />
                          <span className="text-[8px] font-black text-white uppercase tracking-wider">Low</span>
                        </motion.div>
                      )}
                    </div>
                    <div className="absolute -bottom-4 -right-4 opacity-10">
                      <ShoppingBag size={80} className="text-white" />
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-base font-black text-slate-900 leading-tight tracking-tight group-hover:text-orange-600 transition-colors line-clamp-2">
                      {product.productName || product.name || 'Unnamed'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 mb-5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {product.rackId?.rackName || "Unassigned"} • Shelf {product.shelfNumber || "—"}
                      </p>
                      {product.qrCode && (
                        <button
                          onClick={e => { e.stopPropagation(); setQrProduct(product); }}
                          className="ml-auto h-7 px-2 rounded-lg bg-violet-50 border border-violet-100 flex items-center gap-1 text-violet-500 hover:bg-violet-100 transition-colors"
                          title="Generate QR Label"
                        >
                          <QrCode size={11} />
                          <span className="text-[8px] font-black uppercase tracking-wider">QR</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-3">
                      <div className={`${palette.light} rounded-xl p-3 border border-slate-50`}>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Price</p>
                        <p className="text-lg font-black text-slate-900 italic leading-none truncate">₹{product.price}</p>
                      </div>
                      <div className={`${isLow ? 'bg-rose-50' : palette.light} rounded-xl p-3 border ${isLow ? 'border-rose-100' : 'border-slate-50'}`}>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock</p>
                        <p className={`text-lg font-black italic leading-none truncate ${isLow ? 'text-rose-500' : 'text-slate-900'}`}>
                          {product.quantity} <span className="text-[10px] font-normal text-slate-300">units</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hover Shine */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-6">
              <Package size={36} className="text-slate-200" />
            </div>
            <p className="text-lg font-black text-slate-900 italic">No products found</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Try adjusting your search or category filter</p>
          </div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 backdrop-blur-sm p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 sm:p-10 relative overflow-visible"
              >
                <button onClick={() => setShowAddModal(false)} className="absolute top-5 right-5 h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 hover:rotate-90 transition-all">
                  <X size={14} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #EA580C 0%, #D97706 100%)' }}>
                    {editingProduct ? <Edit2 size={24} /> : <Plus size={28} strokeWidth={3} />}
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
                      {editingProduct ? 'Edit' : 'Add'} <span className="text-orange-500 not-italic">Product</span>
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{editingProduct ? 'Update SKU details' : 'Register new SKU'}</p>
                  </div>
                </div>
                
                <form onSubmit={handleAddProduct} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                       <Input value={form.productName} onChange={(e) => setForm({...form, productName: e.target.value})} placeholder="Full Product Name" className="h-12 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                       <Input value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} placeholder="e.g. Electronics" className="h-12 rounded-xl" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₹)</label>
                      <Input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="0" className="h-12 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qty</label>
                      <Input type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} placeholder="0" className="h-12 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Alert</label>
                      <Input type="number" value={form.minStockLevel} onChange={(e) => setForm({...form, minStockLevel: e.target.value})} placeholder="5" className="h-12 rounded-xl" required />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-2xl text-white font-black uppercase tracking-[0.2em] shadow-sm transition-all active:scale-95 text-[10px] border-none" style={{ background: 'linear-gradient(135deg, #EA580C 0%, #D97706 100%)' }}>
                    {editingProduct ? 'Save Changes' : 'Add to Catalog'}
                  </Button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR Label Modal (Print / PDF at 2×2cm) */}
        <QRLabelModal
          open={!!qrProduct}
          onClose={() => setQrProduct(null)}
          product={qrProduct}
        />
      </div>
    </PageTransition>
  );
};

export default Products;

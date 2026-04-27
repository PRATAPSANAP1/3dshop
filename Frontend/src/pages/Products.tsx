import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Package, AlertTriangle, X, IndianRupee, Layers, Tag, ShoppingBag, Edit2, Trash2, QrCode, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import QRLabelModal from "@/components/QRLabelModal";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const CARD_PALETTES = [
  { grad: "from-fuchsia-500 via-pink-500 to-rose-500", soft: "bg-fuchsia-50", txt: "text-fuchsia-600", border: "border-fuchsia-100", dot: "#e879f9" },
  { grad: "from-violet-500 via-indigo-500 to-blue-500", soft: "bg-violet-50", txt: "text-violet-600", border: "border-violet-100", dot: "#8b5cf6" },
  { grad: "from-cyan-400 via-teal-500 to-emerald-500", soft: "bg-cyan-50", txt: "text-cyan-600", border: "border-cyan-100", dot: "#22d3ee" },
  { grad: "from-amber-400 via-orange-500 to-red-500", soft: "bg-amber-50", txt: "text-amber-600", border: "border-amber-100", dot: "#f59e0b" },
  { grad: "from-lime-400 via-green-500 to-teal-500", soft: "bg-lime-50", txt: "text-lime-600", border: "border-lime-100", dot: "#a3e635" },
  { grad: "from-sky-400 via-blue-500 to-indigo-600", soft: "bg-sky-50", txt: "text-sky-600", border: "border-sky-100", dot: "#38bdf8" },
  { grad: "from-rose-400 via-pink-500 to-fuchsia-600", soft: "bg-rose-50", txt: "text-rose-600", border: "border-rose-100", dot: "#fb7185" },
  { grad: "from-orange-400 via-amber-500 to-yellow-400", soft: "bg-orange-50", txt: "text-orange-600", border: "border-orange-100", dot: "#fb923c" },
];

const getColorIndex = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % CARD_PALETTES.length;
};

const Products = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [racks, setRacks] = useState<any[]>([]);
  const [form, setForm] = useState({
    productName: '', category: '', price: '', quantity: '',
    minStockLevel: '', rackId: '', shelfNumber: '', columnNumber: ''
  });
  const [qrProduct, setQrProduct] = useState<any>(null);
  const { toast } = useToast();

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(cats) as string[]];
  }, [products]);

  const fetchData = async () => {
    try {
      const [pRes, rRes] = await Promise.all([api.get('/products'), api.get('/racks')]);
      setProducts(pRes.data);
      setRacks(rRes.data);
    } catch (err) {
      toast({ variant: "destructive", title: "Fetch Error", description: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
      setForm({ productName: '', category: '', price: '', quantity: '', minStockLevel: '', rackId: '', shelfNumber: '', columnNumber: '' });
      fetchData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: editingProduct ? "Could not update product" : "Could not add product" });
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast({ variant: "success", title: "Deleted", description: `${name} removed from catalog` });
      fetchData();
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
      rackId: product.rackId?._id || product.rackId || '',
      shelfNumber: String(product.shelfNumber || ''),
      columnNumber: String(product.columnNumber || ''),
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
          <Button
            onClick={() => { setEditingProduct(null); setForm({ productName: '', category: '', price: '', quantity: '', minStockLevel: '', rackId: '', shelfNumber: '', columnNumber: '' }); setShowAddModal(true); }}
            className="gap-2 h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm shadow-orange-500/20 border-none text-white"
            style={{ background: 'linear-gradient(135deg, #EA580C 0%, #D97706 100%)' }}
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            Add Product
          </Button>
        </div>

        {/* ── STATS CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Stock */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="relative rounded-3xl overflow-hidden p-6 flex items-center gap-5 cursor-default"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
          >
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)" }} />
            <div className="absolute -bottom-4 -right-4 opacity-10"><Layers size={90} className="text-white" /></div>
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-900/20">
              <Layers size={26} />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Total Stock</p>
              <p className="text-3xl font-black text-white italic leading-none mt-1">{totalStock.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">units across all SKUs</p>
            </div>
          </motion.div>

          {/* Inventory Value */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="relative rounded-3xl overflow-hidden p-6 flex items-center gap-5 cursor-default"
            style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)" }}
          >
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)" }} />
            <div className="absolute -bottom-4 -right-4 opacity-10"><IndianRupee size={90} className="text-white" /></div>
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-900/20">
              <IndianRupee size={26} />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Inventory Value</p>
              <p className="text-3xl font-black text-white italic leading-none mt-1">₹{totalValue.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">total catalog worth</p>
            </div>
          </motion.div>

          {/* Low Stock */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="relative rounded-3xl overflow-hidden p-6 flex items-center gap-5 cursor-default"
            style={{ background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #be123c 100%)" }}
          >
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)" }} />
            <div className="absolute -bottom-4 -right-4 opacity-10"><AlertTriangle size={90} className="text-white" /></div>
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-900/20">
              <AlertTriangle size={26} />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Low Stock Alerts</p>
              <p className="text-3xl font-black text-white italic leading-none mt-1">{lowStockCount}</p>
              <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">items need restocking</p>
            </div>
          </motion.div>
        </div>

        {/* ── SEARCH & FILTER BAR ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center bg-white p-3 rounded-3xl border-2 border-slate-100 shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
              <Search size={13} className="text-white" />
            </div>
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-11 rounded-xl border-slate-200 focus:ring-orange-500/10 focus:border-orange-400 font-bold text-slate-700"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-wrap">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const ci = cat === "All" ? 3 : getColorIndex(cat);
              const p = CARD_PALETTES[ci];
              return (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] transition-all border-2 ${
                    isActive
                      ? "text-white border-transparent shadow-md"
                      : `bg-white ${p.txt} ${p.border} hover:scale-105`
                  }`}
                  style={isActive ? { background: `linear-gradient(135deg, ${p.dot}, ${p.dot}cc)` } : {}}
                >
                  {cat}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── PRODUCT CARDS ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((product, i) => {
              const isLow = product.quantity < product.minStockLevel;
              const ci = getColorIndex(product.category || 'Uncategorized');
              const pal = CARD_PALETTES[ci];
              return (
                <motion.div
                  key={product._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ delay: i * 0.03, type: "spring", damping: 18, stiffness: 260 }}
                  className="group relative bg-white rounded-3xl border-2 border-slate-100 overflow-hidden hover:border-transparent hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full"
                >
                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                    {product.qrCode && (
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={e => { e.stopPropagation(); setQrProduct(product); }}
                        className="h-9 w-9 rounded-xl bg-white shadow-md flex items-center justify-center text-violet-500 hover:bg-violet-500 hover:text-white transition-colors border border-violet-100"
                      >
                        <QrCode size={15} />
                      </motion.button>
                    )}
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={e => { e.stopPropagation(); openEdit(product); }}
                      className="h-9 w-9 rounded-xl bg-white shadow-md flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-colors border border-orange-100"
                    >
                      <Edit2 size={14} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={e => { e.stopPropagation(); handleDeleteProduct(product._id, product.productName); }}
                      className="h-9 w-9 rounded-xl bg-white shadow-md flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-colors border border-rose-100"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>

                  {/* Gradient Header Band */}
                  <div className={`relative h-24 bg-gradient-to-br ${pal.grad} overflow-hidden`}>
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute top-4 -right-2 w-12 h-12 rounded-full bg-white/10" />
                    <div className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full bg-black/10" />

                    <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
                      <span className="px-3 py-1 rounded-lg bg-white/25 backdrop-blur-sm border border-white/20 text-[9px] font-black uppercase tracking-widest text-white">
                        {product.category || "General"}
                      </span>
                      {isLow && (
                        <motion.span
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ repeat: Infinity, duration: 1.8 }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 text-[8px] font-black uppercase tracking-wider text-rose-600"
                        >
                          <Zap size={9} fill="currentColor" /> Low
                        </motion.span>
                      )}
                    </div>

                    <div className="absolute -bottom-3 -right-2 opacity-15">
                      <ShoppingBag size={70} className="text-white" />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-[15px] font-black text-slate-900 leading-snug tracking-tight group-hover:text-slate-700 transition-colors line-clamp-2">
                      {product.productName || product.name || 'Unnamed'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-4">
                      {product.rackId?.rackName || "Unassigned"} · Shelf {product.shelfNumber || "—"}
                    </p>

                    <div className="mt-auto grid grid-cols-2 gap-2.5">
                      <div className={`${pal.soft} rounded-2xl p-3.5 border ${pal.border}`}>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Price</p>
                        <p className={`text-xl font-black italic leading-none ${pal.txt}`}>₹{product.price}</p>
                      </div>
                      <div className={`${isLow ? 'bg-rose-50 border-rose-100' : `${pal.soft} ${pal.border}`} rounded-2xl p-3.5 border`}>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Stock</p>
                        <p className={`text-xl font-black italic leading-none ${isLow ? 'text-rose-500' : pal.txt}`}>
                          {product.quantity}<span className="text-[10px] font-normal text-slate-300 ml-0.5">u</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`h-1 w-full bg-gradient-to-r ${pal.grad} opacity-60 group-hover:opacity-100 transition-opacity`} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-6 border border-slate-100">
              <Package size={36} className="text-slate-300" />
            </div>
            <p className="text-lg font-black text-slate-900 italic">No products found</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Try adjusting your search or category filter</p>
          </div>
        )}

        {/* ── ADD / EDIT MODAL ── */}
        {createPortal(
          <AnimatePresence>
            {showAddModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                style={{ backgroundColor: "rgba(15,23,42,0.55)", backdropFilter: "blur(8px)" }}
                onClick={() => setShowAddModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: 40 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  onClick={e => e.stopPropagation()}
                  className="w-full max-w-lg max-h-[95vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl relative"
                >
                  <div className="h-2 w-full rounded-t-[2.5rem] bg-gradient-to-r from-fuchsia-500 via-orange-400 to-amber-400" />

                  <div className="p-8 sm:p-10">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowAddModal(false)}
                      className="absolute top-6 right-6 h-9 w-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all hover:rotate-90"
                    >
                      <X size={15} />
                    </motion.button>

                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                        style={{ background: "linear-gradient(135deg, #f43f5e 0%, #f97316 50%, #eab308 100%)" }}>
                        {editingProduct ? <Edit2 size={22} /> : <Sparkles size={24} />}
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
                          {editingProduct ? 'Edit' : 'New'}{" "}
                          <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent not-italic">
                            Product
                          </span>
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {editingProduct ? 'Update SKU details' : 'Register a new SKU'}
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleAddProduct} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Product Name</label>
                          <Input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })}
                            placeholder="Full Product Name" className="h-12 rounded-xl border-2 border-slate-100 focus:border-fuchsia-400 font-semibold" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                          <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                            placeholder="e.g. Electronics" className="h-12 rounded-xl border-2 border-slate-100 focus:border-violet-400 font-semibold" required />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Rack</label>
                          <select
                            value={form.rackId}
                            onChange={e => setForm({ ...form, rackId: e.target.value })}
                            className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-bold focus:outline-none focus:border-cyan-400 transition-colors"
                          >
                            <option value="">Unassigned</option>
                            {racks.map(r => <option key={r._id} value={r._id}>{r.rackName}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Shelf #</label>
                            <Input type="number" value={form.shelfNumber} onChange={e => setForm({ ...form, shelfNumber: e.target.value })}
                              placeholder="1" className="h-12 rounded-xl border-2 border-slate-100 focus:border-teal-400" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Col #</label>
                            <Input type="number" value={form.columnNumber} onChange={e => setForm({ ...form, columnNumber: e.target.value })}
                              placeholder="1" className="h-12 rounded-xl border-2 border-slate-100 focus:border-teal-400" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Price (₹)", key: "price", color: "focus:border-emerald-400" },
                          { label: "Qty", key: "quantity", color: "focus:border-blue-400" },
                          { label: "Min Alert", key: "minStockLevel", color: "focus:border-rose-400" },
                        ].map(({ label, key, color }) => (
                          <div className="space-y-2" key={key}>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
                            <Input
                              type="number"
                              value={(form as any)[key]}
                              onChange={e => setForm({ ...form, [key]: e.target.value })}
                              placeholder="0"
                              className={`h-12 rounded-xl border-2 border-slate-100 ${color} font-semibold`}
                              required
                            />
                          </div>
                        ))}
                      </div>

                      <motion.button
                        type="submit"
                        whileTap={{ scale: 0.97 }}
                        className="w-full h-14 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-[11px] border-none shadow-lg transition-all"
                        style={{ background: "linear-gradient(135deg, #f43f5e 0%, #f97316 50%, #eab308 100%)" }}
                      >
                        {editingProduct ? '✦ Save Changes' : '✦ Add to Catalog'}
                      </motion.button>
                    </form>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        <QRLabelModal open={!!qrProduct} onClose={() => setQrProduct(null)} product={qrProduct} />
      </div>
    </PageTransition>
  );
};

export default Products;

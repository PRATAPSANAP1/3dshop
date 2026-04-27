import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, ArrowRight } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";

const Categories = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const navigate = useNavigate();

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

  const categories = useMemo(() => {
    const catsMap: Record<string, number> = {};
    products.forEach(p => {
      if (p.category) {
        catsMap[p.category] = (catsMap[p.category] || 0) + 1;
      }
    });
    return Object.entries(catsMap).map(([name, count]) => ({ name, count }));
  }, [products]);

  if (loading) return null;

  return (
    <PageTransition>
      <div className="pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: 'spring', damping: 20 }}
                className="group relative h-72 rounded-[2.5rem] bg-white border border-slate-100 p-8 flex flex-col justify-between overflow-hidden cursor-pointer hover:-translate-y-3 hover:bg-orange-50/10 hover:border-orange-100 transition-all duration-500"
                onClick={() => navigate(`/catalog?category=${cat.name}`)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[4rem] group-hover:scale-150 transition-transform duration-700" />
                <div className="absolute top-8 right-8 h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-orange-500 group-hover:rotate-12 group-hover:bg-orange-500 group-hover:text-white transition-all">
                  <Tag size={24} />
                </div>

                <div className="relative z-10 mt-auto">
                  <h3 className="text-3xl font-black italic text-slate-900 leading-none uppercase group-hover:text-orange-600 transition-colors">{cat.name}</h3>
                </div>

                <div className="relative z-10 flex items-center justify-between border-t border-slate-50 pt-6 mt-6">
                  <div className="flex gap-4">
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-slate-900 italic leading-none">{cat.count}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Products</span>
                    </div>
                  </div>

                  <div className="h-12 w-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-orange-500 group-hover:text-orange-500 group-hover:bg-orange-50 transition-all">
                    <ArrowRight size={20} />
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
};

export default Categories;

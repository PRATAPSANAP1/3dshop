import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, ArrowRight } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";

const PALETTES = [
  { soft: "bg-orange-50/80", hoverSoft: "hover:bg-orange-50/40", border: "border-orange-200", hoverBorder: "hover:border-orange-300", accent: "text-orange-500", blob: "bg-orange-100", iconBg: "bg-orange-50", iconHover: "group-hover:bg-orange-500" },
  { soft: "bg-violet-50/80", hoverSoft: "hover:bg-violet-50/40", border: "border-violet-200", hoverBorder: "hover:border-violet-300", accent: "text-violet-500", blob: "bg-violet-100", iconBg: "bg-violet-50", iconHover: "group-hover:bg-violet-500" },
  { soft: "bg-cyan-50/80", hoverSoft: "hover:bg-cyan-50/40", border: "border-cyan-200", hoverBorder: "hover:border-cyan-300", accent: "text-cyan-500", blob: "bg-cyan-100", iconBg: "bg-cyan-50", iconHover: "group-hover:bg-cyan-500" },
  { soft: "bg-emerald-50/80", hoverSoft: "hover:bg-emerald-50/40", border: "border-emerald-200", hoverBorder: "hover:border-emerald-300", accent: "text-emerald-500", blob: "bg-emerald-100", iconBg: "bg-emerald-50", iconHover: "group-hover:bg-emerald-500" },
  { soft: "bg-rose-50/80", hoverSoft: "hover:bg-rose-50/40", border: "border-rose-200", hoverBorder: "hover:border-rose-300", accent: "text-rose-500", blob: "bg-rose-100", iconBg: "bg-rose-50", iconHover: "group-hover:bg-rose-500" },
  { soft: "bg-sky-50/80", hoverSoft: "hover:bg-sky-50/40", border: "border-sky-200", hoverBorder: "hover:border-sky-300", accent: "text-sky-500", blob: "bg-sky-100", iconBg: "bg-sky-50", iconHover: "group-hover:bg-sky-500" },
  { soft: "bg-fuchsia-50/80", hoverSoft: "hover:bg-fuchsia-50/40", border: "border-fuchsia-200", hoverBorder: "hover:border-fuchsia-300", accent: "text-fuchsia-500", blob: "bg-fuchsia-100", iconBg: "bg-fuchsia-50", iconHover: "group-hover:bg-fuchsia-500" },
  { soft: "bg-indigo-50/80", hoverSoft: "hover:bg-indigo-50/40", border: "border-indigo-200", hoverBorder: "hover:border-indigo-300", accent: "text-indigo-500", blob: "bg-indigo-100", iconBg: "bg-indigo-50", iconHover: "group-hover:bg-indigo-500" },
  { soft: "bg-teal-50/80", hoverSoft: "hover:bg-teal-50/40", border: "border-teal-200", hoverBorder: "hover:border-teal-300", accent: "text-teal-500", blob: "bg-teal-100", iconBg: "bg-teal-50", iconHover: "group-hover:bg-teal-500" },
  { soft: "bg-slate-100/80", hoverSoft: "hover:bg-slate-100/40", border: "border-slate-200", hoverBorder: "hover:border-slate-300", accent: "text-slate-600", blob: "bg-slate-200", iconBg: "bg-slate-100", iconHover: "group-hover:bg-slate-600" },
];

const getColorIndex = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % PALETTES.length;
};

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



  return (
    <PageTransition>
      <div className="pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {categories.map((cat, i) => {
              const ci = getColorIndex(cat.name);
              const p = PALETTES[ci];
              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.1, type: 'spring', damping: 20 }}
                  className={`group relative h-64 rounded-[2.5rem] ${p.soft} border-2 ${p.border} p-8 flex flex-col justify-between overflow-hidden cursor-pointer hover:-translate-y-3 ${p.hoverSoft} ${p.hoverBorder} transition-all duration-500 shadow-sm`}
                  onClick={() => navigate(`/catalog?category=${cat.name}`)}
                >
                  <div className={`absolute top-0 right-0 w-40 h-40 ${p.blob} rounded-bl-[5rem] group-hover:scale-150 transition-transform duration-700`} />
                  <div className={`absolute top-6 right-6 h-12 w-12 rounded-2xl ${p.iconBg} shadow-md flex items-center justify-center ${p.accent} group-hover:rotate-12 ${p.iconHover} group-hover:text-white transition-all`}>
                    <Tag size={24} />
                  </div>

                  <div className="relative z-10 mt-auto mb-2">
                    <h3 className={`text-3xl font-black italic text-slate-800 leading-none uppercase group-hover:${p.accent} transition-colors`}>{cat.name}</h3>
                  </div>

                  <div className="relative z-10 flex items-center justify-between border-t border-slate-200/50 pt-4 mt-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className={`text-2xl font-black ${p.accent} italic leading-none`}>{cat.count}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Products</span>
                      </div>
                    </div>

                    <div className={`h-10 w-10 rounded-2xl border-2 ${p.border} flex items-center justify-center text-slate-400 group-hover:${p.accent} group-hover:${p.iconBg} transition-all`}>
                      <ArrowRight size={20} />
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
};

export default Categories;

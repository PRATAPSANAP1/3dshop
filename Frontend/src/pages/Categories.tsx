import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, ArrowUpRight } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";

const CARD_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-sky-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
];

const CARD_ACCENTS = [
  "bg-violet-400/20",
  "bg-sky-400/20",
  "bg-fuchsia-400/20",
];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {categories.map((cat, i) => {
              const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
              const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];

              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 40, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    delay: i * 0.07,
                    type: "spring",
                    stiffness: 260,
                    damping: 22,
                  }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className={`group relative h-64 rounded-3xl bg-gradient-to-br ${gradient} p-7 flex flex-col justify-between overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300`}
                  onClick={() => navigate(`/catalog?category=${cat.name}`)}
                >
                  {/* Background blob */}
                  <div
                    className={`absolute -top-8 -right-8 w-40 h-40 rounded-full ${accent} blur-2xl group-hover:scale-125 transition-transform duration-700`}
                  />
                  <div
                    className={`absolute -bottom-10 -left-6 w-32 h-32 rounded-full ${accent} blur-2xl opacity-60 group-hover:scale-110 transition-transform duration-700`}
                  />

                  {/* Top row */}
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                      <Layers size={20} strokeWidth={1.8} />
                    </div>

                    <motion.div
                      className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20"
                      whileHover={{ rotate: 45 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <ArrowUpRight size={18} />
                    </motion.div>
                  </div>

                  {/* Bottom content */}
                  <div className="relative z-10 space-y-3">
                    <h3 className="text-2xl font-extrabold text-white leading-tight tracking-tight uppercase drop-shadow-sm">
                      {cat.name}
                    </h3>

                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-white/20" />
                      <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                        {cat.count} {cat.count === 1 ? "product" : "products"}
                      </span>
                    </div>
                  </div>

                  {/* Shimmer on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
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

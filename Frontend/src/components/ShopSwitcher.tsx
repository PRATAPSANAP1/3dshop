import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Store, Check, Plus } from "lucide-react";
import api from "@/lib/api";
import { useShopStore } from "@/lib/shopStore";

const ShopSwitcher = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const { activeShopId, shopConfig, setActiveShop, clearShop } = useShopStore();

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data } = await api.get("/shops");
        setShops(data);
        // Auto-select first shop if none selected
        if (!activeShopId && data.length > 0) {
          setActiveShop({
            _id: data[0]._id,
            name: data[0].name,
            displayName: data[0].displayName,
            logoUrl: data[0].logoUrl,
            settings: data[0].settings,
          });
        }
      } catch (err) {
        console.error("Failed to load shops:", err);
      }
    };
    fetchShops();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="h-7 w-7 rounded-lg bg-orange-500 flex items-center justify-center text-white text-[10px] font-black shrink-0">
          {shopConfig?.displayName?.[0]?.toUpperCase() || "S"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-900 truncate">{shopConfig?.displayName || "Select Shop"}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{shopConfig?.name || "—"}</p>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-100 shadow-lg z-50 overflow-hidden max-h-64 overflow-y-auto"
          >
            {shops.map((shop) => (
              <button
                key={shop._id}
                onClick={() => {
                  setActiveShop({
                    _id: shop._id,
                    name: shop.name,
                    displayName: shop.displayName,
                    logoUrl: shop.logoUrl,
                    settings: shop.settings,
                  });
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors ${
                  activeShopId === shop._id ? "bg-orange-50" : ""
                }`}
              >
                <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                  {shop.displayName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[11px] font-bold text-slate-900 truncate">{shop.displayName}</p>
                  <p className="text-[9px] text-slate-400 font-bold">{shop.name}</p>
                </div>
                {activeShopId === shop._id && <Check size={14} className="text-orange-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopSwitcher;

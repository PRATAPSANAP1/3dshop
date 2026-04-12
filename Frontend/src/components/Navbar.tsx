import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/login";

  // Only show on login page (guest) — inside app, sidebars handle nav
  if (user || !isLoginPage) return null;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100"
    >
      <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6 max-w-7xl">
        <Link to="/home" className="flex items-center gap-2 group">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white font-black text-sm group-hover:rotate-6 transition-transform"
            style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)" }}
          >
            3D
          </div>
          <span className="text-lg font-black tracking-tighter text-slate-900">
            3D<span className="text-orange-500">shop.</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/home")}
            className="h-9 px-4 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
          >
            Home
          </button>
          <button
            onClick={() => navigate(location.search.includes("mode=register") ? "/login" : "/login?mode=register")}
            className="h-9 px-5 rounded-xl text-xs font-black text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)" }}
          >
            {location.search.includes("mode=register") ? "Sign In" : "Register"}
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, Package, User } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/home',    icon: Home,         label: 'Home' },
  { to: '/catalog', icon: ShoppingBag,  label: 'Shop' },
  { to: '/cart',    icon: ShoppingCart, label: 'Cart' },
  { to: '/orders',  icon: Package,      label: 'Orders' },
  { to: '/profile', icon: User,         label: 'Profile' },
];

const MobileBottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 backdrop-blur-xl border-t border-slate-100 px-2 pb-safe">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to} className="flex flex-col items-center gap-1 relative px-3 py-2">
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-orange-500 rounded-full"
                />
              )}
              <Icon
                size={22}
                className={active ? 'text-orange-500' : 'text-slate-400'}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-orange-500' : 'text-slate-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;

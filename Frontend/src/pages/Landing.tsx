import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Box, Shield, Truck, Zap, BarChart3, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

const FEATURES = [
  { icon: Box, title: 'Immersive 3D Shopping', desc: 'Walk through aisles in a spatial 3D environment', color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: Zap, title: 'Instant Search', desc: 'SKU-level search with real-time results', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: Shield, title: 'Secure Payments', desc: 'UPI, Card & Netbanking via Razorpay', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { icon: Truck, title: 'Live Tracking', desc: 'Real-time delivery status with OTP verification', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: BarChart3, title: 'AI Analytics', desc: 'Heatmaps, footfall tracking & zone efficiency', color: 'text-amber-500', bg: 'bg-amber-50' },
  { icon: QrCode, title: 'Scanner & POS', desc: 'Dual-mode QR for billing or stock updates', color: 'text-rose-500', bg: 'bg-rose-50' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
};

export default function Landing() {
  const [productCount, setProductCount] = useState<number | null>(null);

  useEffect(() => {
    api.get('/public/all')
      .then(({ data }) => setProductCount(data.length))
      .catch(() => {});
  }, []);
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[120px]" />

        <div className="container mx-auto px-4 py-24 md:py-36 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-sm text-orange-600 font-bold mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Premium Spatial Commerce
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 text-slate-900 uppercase">
              The Future of<br />
              <span className="text-orange-500">Grocery Shopping</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto mb-10 font-medium">
              Walk through immersive 3D aisles, grab products spatially, and checkout seamlessly — all from your browser.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/shop-viewer">
                <Button size="lg" className="bg-orange-500 hover:bg-slate-900 text-white font-black px-8 h-12 text-base gap-2 transition-all border-none">
                  Enter 3D Store <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/catalog">
                <Button size="lg" variant="outline" className="h-12 text-base px-8 border-slate-200 hover:bg-slate-50 font-bold">
                  Browse Catalog
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
              <div className="rounded-xl bg-slate-50 overflow-hidden aspect-video flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5" />
                <div className="text-center relative z-10">
                  <div className="text-8xl mb-4 animate-bounce">🏪</div>
                  <p className="text-slate-400 text-sm font-medium">Click "Enter 3D Store" to explore</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-slate-900 uppercase tracking-tight">
              Everything You Need, <span className="text-orange-500">Reimagined</span>
            </h2>
            <p className="text-slate-400 max-w-md mx-auto font-medium">
              From spatial browsing to doorstep delivery — every step is crafted for excellence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 hover:shadow-sm transition-all duration-300 group border border-slate-100 hover:border-slate-200"
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon size={22} className={f.color} />
                </div>
                <h3 className="font-black text-lg mb-2 text-slate-900 uppercase tracking-tight">{f.title}</h3>
                <p className="text-sm text-slate-400 font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: productCount !== null ? `${productCount}+` : '...', label: 'Products' },
              { val: '99.9%', label: 'Uptime' },
              { val: '<2s', label: 'Load Time' },
              { val: '24/7', label: 'Support' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-black text-orange-500">{s.val}</div>
                <div className="text-sm text-slate-400 mt-1 font-medium uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-slate-100">
        <div className="container mx-auto px-4 text-center text-sm text-slate-400 font-medium">
          © 2026 SmartStore Premium Suite. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}

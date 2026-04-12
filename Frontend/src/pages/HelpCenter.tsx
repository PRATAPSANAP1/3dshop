import { motion } from 'framer-motion';
import { HelpCircle, Phone, Mail, ChevronRight, Search, Truck, CreditCard, Package, Shield } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { useState } from 'react';

const FAQS = [
  { q: 'How do I track my order?', a: 'Go to Orders page and click on any order to see real-time tracking with status timeline.' },
  { q: 'How does OTP delivery verification work?', a: 'When your order is out for delivery, you receive a 6-digit OTP. Share it with the delivery person to confirm receipt.' },
  { q: 'What payment methods are supported?', a: 'We support UPI, Credit/Debit Cards, Netbanking via Razorpay, and Cash on Delivery.' },
  { q: 'How do I navigate the 3D store?', a: 'Use mouse drag to rotate, scroll to zoom, and click on products to view details. Search to highlight rack locations.' },
  { q: 'Can I return a product?', a: 'Yes, after delivery you can request a return from the Orders page. Our team reviews within 24 hours.' },
  { q: 'How do I add multiple addresses?', a: 'Go to Profile → Addresses and add up to 5 delivery addresses.' },
];

const TOPICS = [
  { icon: Truck, title: 'Delivery & Tracking', desc: 'Track orders, OTP verification, delivery issues', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: CreditCard, title: 'Payments & Billing', desc: 'Payment methods, invoices, refunds', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { icon: Package, title: 'Orders & Returns', desc: 'Order management, cancellations, returns', color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: Shield, title: 'Account & Security', desc: 'Profile, passwords, privacy settings', color: 'text-purple-500', bg: 'bg-purple-50' },
];

export default function HelpCenter() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = FAQS.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-12">
        {/* Header */}
        <div className="text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="h-16 w-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle size={32} className="text-orange-500" />
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase leading-none mb-3">
              Help <span className="text-orange-500 not-italic">Center.</span>
            </h1>
            <p className="text-slate-400 font-medium">Find answers to common questions or contact our support team.</p>
          </motion.div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for help..."
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        {/* Topics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TOPICS.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className={`h-10 w-10 rounded-xl ${t.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <t.icon size={18} className={t.color} />
              </div>
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-tight mb-1">{t.title}</h3>
              <p className="text-[10px] text-slate-400 font-medium">{t.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase mb-6">
            Frequently Asked <span className="text-orange-500 not-italic">Questions.</span>
          </h2>
          <div className="space-y-3">
            {filtered.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-orange-200 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-bold text-sm text-slate-900">{faq.q}</span>
                  <ChevronRight size={16} className={`text-slate-400 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-medium">No results found for "{search}"</div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Still Need <span className="text-orange-500 not-italic">Help?</span></h2>
          <p className="text-slate-400 font-medium mb-8">Our support team is available 24/7 to assist you.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Mail, label: 'Email Support', desc: 'support@3dshop.com', color: 'bg-purple-500' },
              { icon: Phone, label: 'Phone Support', desc: '+91 1800-3D-SHOP', color: 'bg-emerald-500' },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                <div className={`h-10 w-10 ${c.color} rounded-xl flex items-center justify-center shrink-0`}>
                  <c.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-sm uppercase tracking-tight">{c.label}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

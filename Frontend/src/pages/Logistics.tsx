import { motion } from 'framer-motion';
import { Truck, Package, CheckCircle2, Clock, MapPin, User, Phone, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageTransition from '@/components/PageTransition';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  'Delivered':       { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Delivered' },
  'OutForDelivery':  { color: 'bg-blue-50 text-blue-600 border-blue-100', label: 'Out for Delivery' },
  'Shipped':         { color: 'bg-orange-50 text-orange-600 border-orange-100', label: 'Shipped' },
  'Packed':          { color: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Packed' },
  'Ordered':         { color: 'bg-slate-50 text-slate-600 border-slate-100', label: 'Ordered' },
};

export default function Logistics() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const stats = [
    { label: 'Active Deliveries', value: orders.filter(o => o.orderStatus === 'OutForDelivery').length, icon: Truck },
    { label: 'Packed & Waiting', value: orders.filter(o => o.orderStatus === 'Packed').length, icon: Package },
    { label: 'Delivered Today', value: orders.filter(o => o.orderStatus === 'Delivered').length, icon: CheckCircle2 },
    { label: 'Total Orders', value: orders.length, icon: Clock },
  ];



  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
              Logistics <span className="text-orange-500 not-italic">Hub.</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Fleet management & delivery tracking</p>
          </div>
          <Button onClick={fetchOrders} disabled={loading} className="h-10 px-5 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm"
            >
              <s.icon size={18} className="text-orange-500 mb-3" />
              <div className="text-2xl font-black text-slate-900">{s.value}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Delivery Cards */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <Truck size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-lg font-bold text-slate-400">No deliveries found</p>
            </div>
          ) : (
            orders.map((order, i) => {
              const statusKey = order.orderStatus || 'Ordered';
              const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG['Ordered'];
              const timeline = [
                { step: 'Order Placed', done: true },
                { step: 'Packed', done: ['Packed', 'Shipped', 'OutForDelivery', 'Delivered'].includes(statusKey) },
                { step: 'Shipped', done: ['Shipped', 'OutForDelivery', 'Delivered'].includes(statusKey) },
                { step: 'Out for Delivery', done: ['OutForDelivery', 'Delivered'].includes(statusKey) },
                { step: 'Delivered', done: statusKey === 'Delivered' },
              ];

              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-orange-200 hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-mono text-sm text-slate-400 font-bold">#{order._id.slice(-8).toUpperCase()}</span>
                        <Badge className={`border font-bold text-[10px] uppercase ${cfg.color}`}>{cfg.label}</Badge>
                        {order.delivery?.priority === 'Urgent' && (
                          <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-bold text-[10px] uppercase">Urgent</Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                          <User size={14} className="text-orange-400" />
                          <span>{order.user?.name || 'Customer'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                          <MapPin size={14} className="text-orange-400" />
                          <span>{order.shippingAddress?.street}, {order.shippingAddress?.city}</span>
                        </div>
                        {order.shippingAddress?.phone && (
                          <div className="flex items-center gap-2 text-slate-500 font-medium">
                            <Phone size={14} className="text-orange-400" />
                            <span>{order.shippingAddress.phone}</span>
                          </div>
                        )}
                        {order.delivery?.assignedTo && (
                          <div className="flex items-center gap-2 text-slate-500 font-medium">
                            <Truck size={14} className="text-orange-400" />
                            <span>Driver: {order.delivery.assignedTo?.name || 'Assigned'}</span>
                          </div>
                        )}
                      </div>
                      {order.delivery?.otp && !order.delivery?.otpVerified && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100">
                          <span className="text-xs text-amber-600 font-bold">OTP:</span>
                          <span className="font-mono font-black text-amber-700 tracking-widest">{order.delivery.otp}</span>
                        </div>
                      )}
                      {order.delivery?.otpVerified && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-xs text-emerald-600 font-black">OTP Verified — Delivered</span>
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="md:w-56 space-y-0">
                      {timeline.map((t, ti) => (
                        <div key={t.step} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${t.done ? 'bg-orange-500' : 'bg-slate-200'}`} />
                            {ti < timeline.length - 1 && (
                              <div className={`w-0.5 h-6 ${t.done ? 'bg-orange-200' : 'bg-slate-100'}`} />
                            )}
                          </div>
                          <div className="pb-4">
                            <div className={`text-xs font-bold ${t.done ? 'text-slate-900' : 'text-slate-300'}`}>{t.step}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </PageTransition>
  );
}

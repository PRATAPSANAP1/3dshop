import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  ShoppingCart, Package, Truck, CheckCircle2, AlertCircle,
  Loader2, ShoppingBag, Eye, Printer, FileText, X,
  CreditCard, MessageSquare, IndianRupee, Trash2, ArrowRight, Sparkles,
  Clock, RotateCcw, MoreVertical, ShieldCheck
} from "lucide-react";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import OrderTimeline from "@/components/OrderTimeline";
import { useSocket } from "@/hooks/useSocket";
import { useNavigate } from "react-router-dom";

const statusConfig: any = {
  'Ordered': { icon: Clock, color: "bg-orange-50 text-orange-600", border: "border-l-orange-400", label: "Confirmed" },
  'Packed': { icon: Package, color: "bg-amber-50 text-amber-600", border: "border-l-amber-400", label: "Packed" },
  'Shipped': { icon: Truck, color: "bg-orange-50 text-orange-600", border: "border-l-orange-500", label: "In Transit" },
  'OutForDelivery': { icon: Truck, color: "bg-amber-50 text-amber-700", border: "border-l-amber-500", label: "Out for Delivery" },
  'Delivered': { icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", border: "border-l-emerald-400", label: "Completed" },
  'FailedDelivery': { icon: AlertCircle, color: "bg-rose-50 text-rose-600", border: "border-l-rose-400", label: "Failed Delivery" },
  'Rescheduled': { icon: Clock, color: "bg-amber-50 text-amber-600", border: "border-l-amber-400", label: "Rescheduled" },
  'Cancelled': { icon: AlertCircle, color: "bg-rose-50 text-rose-600", border: "border-l-rose-400", label: "Cancelled" },
  'Returned': { icon: RotateCcw, color: "bg-rose-50 text-rose-500", border: "border-l-rose-300", label: "Returned" },
  'ReturnRequested': { icon: AlertCircle, color: "bg-amber-50 text-amber-600", border: "border-l-amber-400", label: "Return Pending" },
};

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [admins, setAdmins] = useState<any[]>([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [timeSlot, setTimeSlot] = useState("10:00");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedOrder) {
      setAssignedTo(selectedOrder.delivery?.assignedTo || "");
      setTimeSlot(selectedOrder.delivery?.timeSlot || "10:00");
      setDeliveryNotes(selectedOrder.delivery?.notes || "");
      setDeliveryDate(selectedOrder.delivery?.deliveryDate ? new Date(selectedOrder.delivery.deliveryDate).toISOString().slice(0, 10) : "");
      setOtpInput("");
    }
  }, [selectedOrder]);

  const socketRoom = user?.role === 'admin' ? 'admin_orders' : `user_${user?._id}`;
  const { socket, onEvent } = useSocket(socketRoom);

  const fetchAdmins = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setAdmins(data.filter((u: any) => u.role === 'admin' || u.role === 'staff'));
    } catch(err) { /* ignore */ }
  };

  const fetchOrders = async () => {
    try {
      const endpoint = user?.role === 'admin' ? '/orders' : '/orders/mine';
      const { data } = await api.get(endpoint);
      setOrders(data);
    } catch (err) {
      console.error("Order Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const { data } = await api.get('/orders/payments/stats');
      setPaymentStats(data);
    } catch (err) { /* ignore if not admin */ }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      if (user.role === 'admin') {
        fetchAdmins();
        fetchPaymentStats();
      }
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      onEvent('new_order', (newOrder) => {
        if (user?.role === 'admin') {
          setOrders(prev => [newOrder, ...prev]);
          toast({ title: "New Order 🎉", description: `Order #${newOrder._id.slice(-6)} received!` });
        }
      });

      onEvent('order_status_updated', (updatedOrder) => {
        setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
        if (selectedOrder?._id === updatedOrder._id) {
          setSelectedOrder(updatedOrder);
        }
        toast({ title: "Order Updated", description: `Order #${updatedOrder._id.slice(-6)} status is now ${updatedOrder.orderStatus}` });
      });
    }
  }, [socket, selectedOrder]);

  const handleStatusUpdate = async (id: string, status: string, comment: string = "") => {
    try {
      await api.put(`/orders/${id}/status`, { status, comment });
      toast({ title: "Status Updated", description: `Order #${id.slice(-6)} marked as ${status}` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Status update failed" });
    }
  };

  const handleDeliveryAssign = async () => {
    if (!selectedOrder || !assignedTo) {
      toast({ variant: "destructive", title: "Error", description: "Please select a delivery person" });
      return;
    }
    try {
      const { data } = await api.put(`/orders/${selectedOrder._id}/delivery`, { assignedTo, deliveryDate, timeSlot, notes: deliveryNotes });
      setSelectedOrder(data);
      setOrders(prev => prev.map(o => o._id === data._id ? data : o));
      toast({ title: "Delivery Assigned ✅", description: 'OTP: ' + (data.delivery?.otp || 'Generated') + ' — Share with customer' });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to assign delivery" });
    }
  };

  const handleOtpVerify = async () => {
    if (!selectedOrder) return;
    try {
      const { data } = await api.post(`/orders/${selectedOrder._id}/delivery/verify-otp`, { otp: otpInput });
      setSelectedOrder(data);
      setOrders(prev => prev.map(o => o._id === data._id ? data : o));
      toast({ title: "OTP Verified! 🎉", description: "Order marked as Delivered." });
      setOtpInput("");
    } catch(err) {
      toast({ variant: "destructive", title: "Invalid OTP", description: "The OTP entered is incorrect." });
    }
  };

  const handleDeliveryStatusChange = async (status: string) => {
    if (!selectedOrder) return;
    try {
      const { data } = await api.put(`/orders/${selectedOrder._id}/delivery/status`, { status, notes: deliveryNotes });
      setSelectedOrder(data);
      setOrders(prev => prev.map(o => o._id === data._id ? data : o));
      toast({ title: "Delivery Status Updated", description: 'Status changed to ' + status });
    } catch(err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update delivery status" });
    }
  };

  const handleReturnRequest = async () => {
    if (!selectedOrder) return;
    try {
      await api.post(`/orders/${selectedOrder._id}/return`, { reason: returnReason });
      setShowReturnModal(false);
      setReturnReason("");
      toast({ title: "Return Requested", description: "Our team will review your request" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to request return" });
    }
  };

  const handleReturnAction = async (id: string, status: string, comment: string) => {
    try {
      await api.put(`/orders/${id}/return-handle`, { status, comment });
      toast({ title: "Return Status Updated", description: `Request marked as ${status}` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Return handling failed" });
    }
  };

  const downloadInvoice = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const itemsHtml = order.orderItems.map((item: any) =>
      `<tr><td>${item.name}</td><td>${item.qty}</td><td>₹${item.price}</td><td>₹${item.price * item.qty}</td></tr>`
    ).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order._id}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; background-color: #ffffff !important; color: #000000 !important; line-height: 1.5; }
            .no-print-bar { display: flex; justify-content: space-between; margin-bottom: 20px; align-items: center; }
            .btn-back { padding: 8px 16px; background: #333; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
            .btn-print { padding: 8px 16px; background: #f97316; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 30px; margin-bottom: 30px; }
            .brand { font-size: 24px; font-weight: 900; color: #f97316; }
            .meta { text-align: right; color: #000; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #555; margin-bottom: 4px; }
            .val { font-size: 14px; font-weight: 700; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; background: #f8fafc; padding: 12px; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #333; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 500; color: #000; }
            .totals { float: right; width: 250px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #000; }
            .grand-total { font-size: 18px; font-weight: 900; color: #f97316; border-top: 2px solid #f1f5f9; margin-top: 10px; padding-top: 10px; }
            @media print { .no-print-bar { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print-bar">
            <button class="btn-back" onclick="window.close()">← Go Back</button>
            <button class="btn-print" onclick="window.print()">Print Invoice</button>
          </div>
          <div class="header">
            <div class="brand">3Dshop EXCLUSIVE INVOICE</div>
            <div class="meta"><div class="label">Invoice No</div><div class="val">#${order._id.slice(-8).toUpperCase()}</div></div>
          </div>
          <div class="grid">
            <div><div class="label">Billed To</div><div class="val">${order.user?.name || "Customer"}</div><div class="val" style="font-weight: 500; font-size: 12px;">${order.user?.email || ""}</div></div>
            <div><div class="label">Shipping Address</div><div class="val">${order.shippingAddress?.street || order.shippingAddress?.address}</div><div class="val">${order.shippingAddress?.city}, ${order.shippingAddress?.state || ""} ${order.shippingAddress?.pinCode || order.shippingAddress?.postalCode || ""}</div></div>
          </div>
          <table>
            <thead><tr><th>Product Name</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="totals">
            <div class="total-row"><span>Order Value</span><span>₹${order.totalPrice - (order.taxPrice || 0)}</span></div>
            <div class="total-row"><span>Delivery Charge</span><span>₹60</span></div>
            <div class="total-row grand-total"><span>Grand Total</span><span>₹${order.totalPrice}</span></div>
          </div>
          <div style="margin-top: 100px; text-align: center; color: #555; font-size: 11px;">Computer generated receipt. No signature required.</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="page-loader" /></div>;

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-10 py-6 px-4">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
              <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>home</span>
              <span className="text-slate-300">/</span>
              <span className="text-primary">{selectedOrder ? 'order' : 'orders'}</span>
              {selectedOrder && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="text-primary">view</span>
                </>
              )}
            </div>
            <div className="space-y-1">
              <h1 className="font-heading text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                {user?.role === 'admin' ? "Global" : "My"} <span className="text-orange-500 not-italic">Orders.</span>
              </h1>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{orders.length} orders recorded</p>
            </div>
          </div>
        </header>

        {/* Admin Payment Summary */}
        {user?.role === 'admin' && paymentStats?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-emerald-200 transition-all">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Online Collected</p>
              <p className="text-xl font-black text-emerald-600 italic">₹{paymentStats.summary.collectedOnline.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-emerald-400 mt-0.5">{paymentStats.summary.paidOnlineCount} orders</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-amber-200 transition-all">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">COD Collected</p>
              <p className="text-xl font-black text-amber-600 italic">₹{paymentStats.summary.collectedCOD.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-amber-400 mt-0.5">{paymentStats.summary.paidCODCount} orders</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-rose-200 transition-all">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Amount</p>
              <p className="text-xl font-black text-rose-500 italic">₹{paymentStats.summary.pendingAmount.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-rose-400 mt-0.5">{paymentStats.summary.unpaidCount} orders</p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-4">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Revenue</p>
              <p className="text-xl font-black text-white italic">₹{paymentStats.summary.totalRevenue.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-slate-500 mt-0.5">{paymentStats.summary.totalOrders} total orders</p>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 sm:p-16 md:py-24 bg-white border border-slate-100 rounded-[2rem] md:rounded-[3rem] shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 bg-orange-500/10 blur-[80px] md:blur-[100px] rounded-full group-hover:bg-orange-500/20 transition-colors duration-700" />

            <div className="relative z-10 mx-auto h-24 w-24 md:h-32 md:w-32 bg-slate-50 border border-slate-100 shadow-inner rounded-[2rem] flex items-center justify-center mb-6 md:mb-8">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <ShoppingBag size={40} className="md:w-12 md:h-12 text-slate-300 drop-shadow-sm" />
              </motion.div>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-3 -right-3 md:-top-4 md:-right-4 text-orange-400 opacity-50"><Sparkles size={20} className="md:w-6 md:h-6" /></motion.div>
            </div>

            <h2 className="relative z-10 text-3xl md:text-4xl font-black italic tracking-tighter text-slate-900 mb-2 md:mb-3 uppercase">No orders <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">yet.</span></h2>
            <p className="relative z-10 text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px] max-w-xs mx-auto leading-relaxed mb-8 md:mb-10">You haven't placed any orders yet. Browse our catalog and add items to your cart.</p>

            <Button onClick={() => navigate('/catalog')} className="relative z-10 h-14 px-8 md:px-10 rounded-2xl bg-slate-900 text-white hover:bg-orange-500 font-black uppercase tracking-widest text-[10px] md:text-xs gap-3 shadow-sm transition-all hover:scale-105 active:scale-95 group/btn">
              Browse Products <ArrowRight size={16} className="md:w-[18px] md:h-[18px] group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {orders.map((order, i) => {
                const statusKey = order.orderStatus || (order.isDelivered ? 'Delivered' : (order.isPaid ? 'Shipped' : 'Ordered'));
                const realStatus = order.isReturnRequested ? "ReturnRequested" : statusKey;
                const cfg = statusConfig[realStatus] || statusConfig['Ordered'];
                const Icon = cfg.icon;

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedOrder(order)}
                    className={`group relative flex flex-col p-6 rounded-[2rem] border-2 border-slate-50 bg-white transition-all cursor-pointer hover:border-orange-100 hover:shadow-xl hover:shadow-orange-500/5 ${cfg.border} border-l-[6px] h-full`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shadow-sm ${cfg.color}`}>
                        <Icon size={20} />
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-0.5">ORDER ID</span>
                        <span className="text-[10px] font-black text-slate-600">#{order._id.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-heading text-base font-black italic text-slate-900 leading-tight mb-2 line-clamp-2">
                        {order.orderItems?.length || 0} Professional Items.
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        <Badge variant="outline" className={`px-2 py-0.5 rounded-full border-none font-black uppercase tracking-[0.05em] text-[8px] italic ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                        {order.isPaid ? (
                          <Badge className="px-2 py-0.5 rounded-full border-none font-black uppercase text-[8px] bg-emerald-100 text-emerald-700">Paid</Badge>
                        ) : (
                          <Badge className="px-2 py-0.5 rounded-full border-none font-black uppercase text-[8px] bg-amber-100 text-amber-700">{order.paymentMethod}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto border-t border-slate-50 pt-4 flex items-end justify-between">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TOTAL LEDGER</p>
                        <p className="text-xl font-black italic text-slate-900 tracking-tighter">₹{order.totalPrice.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center">
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadInvoice(order); }}
                          className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {typeof document !== "undefined" && createPortal(
          <AnimatePresence>
            {selectedOrder && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
              >
                <div onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-2xl max-h-[90vh] bg-white text-slate-900 rounded-[3rem] shadow-2xl flex flex-col overflow-y-auto custom-scrollbar"
                >
                  <div className="p-6 md:p-10 shrink-0">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">ORDER <span className="text-orange-500 not-italic">DETAILS.</span></h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                          <Clock size={12} /> ID: #{selectedOrder._id}
                        </p>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center">
                        <X size={24} />
                      </button>
                    </div>

                    <div className="space-y-6 mb-12">
                      {selectedOrder.orderItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-6 group">
                          <div className="h-20 w-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center relative overflow-hidden shadow-inner">
                            <ShoppingBag size={32} className="text-slate-100" />
                            {item.qty > 1 && <span className="absolute top-2 right-2 h-6 w-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black italic">x{item.qty}</span>}
                          </div>
                          <div className="flex-1">
                            <p className="font-black italic text-slate-900 uppercase leading-none mb-1 group-hover:text-orange-500 transition-colors">{item.name}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-500">Standard Edition</span>
                              <Badge variant="outline" className="bg-slate-50 border-none text-[8px] font-black text-slate-400 uppercase tracking-widest">Premium QC</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black italic text-slate-900 leading-none">₹{item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-8 rounded-[2rem] bg-slate-900 text-white shadow-sm space-y-6">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Shipping Destination</span>
                        <span className="text-xs font-bold leading-none">{selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Payment Structure</span>
                        <span className="text-xs font-bold flex items-center gap-2 leading-none">
                          <CreditCard size={14} className="text-orange-500" /> {selectedOrder.paymentMethod}
                          {selectedOrder.isPaid ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Clock size={14} className="text-amber-500" />}
                        </span>
                      </div>
                      <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL PAYABLE</p>
                          <p className="text-4xl font-black italic text-orange-500 tracking-tighter leading-none">₹{selectedOrder.totalPrice.toLocaleString()}</p>
                        </div>
                        <Button onClick={() => downloadInvoice(selectedOrder)} className="h-12 md:h-14 px-5 md:px-8 rounded-2xl bg-white text-slate-900 hover:bg-orange-500 hover:text-white font-black uppercase tracking-widest text-[9px] md:text-[10px] gap-2 transition-all shadow-sm leading-none shrink-0">
                          <Printer size={16} /> <span className="hidden sm:inline">DOWNLOAD INVOICE</span><span className="sm:hidden">INVOICE</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="w-full p-8 md:p-10 bg-slate-50 border-t border-slate-100 flex flex-col shrink-0">
                    {user?.role === 'admin' ? (
                      <div className="flex flex-col items-center justify-center flex-1 text-center py-20 space-y-8">
                        <div className="h-24 w-24 rounded-[2.5rem] bg-orange-100 flex items-center justify-center text-orange-500 shadow-sm border border-orange-200">
                          <Truck size={40} />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase leading-none text-center">DELIVERY <br /><span className="text-orange-500 not-italic">PORTAL.</span></h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 px-4 leading-relaxed text-center">Assign staff, track packages & verify OTPs</p>
                        </div>
                        <Button 
                          onClick={() => {
                            setSelectedOrder(null);
                            navigate('/delivery');
                          }}
                          className="w-full bg-slate-900 text-white hover:bg-orange-500 h-16 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-md transition-all flex items-center justify-center gap-3"
                        >
                          OPEN DELIVERY HUB <ArrowRight size={18} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col flex-1 h-full">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">TIMELINE</h3>
                        </div>
                        <div className="flex-1 mb-8">
                          <OrderTimeline history={selectedOrder.statusHistory || [{ status: 'Ordered', timestamp: selectedOrder.createdAt }]} currentStatus={selectedOrder.orderStatus} />
                        </div>
                        {selectedOrder.delivery?.assignedTo && (
                          <div className="mb-6 p-6 rounded-3xl bg-white border border-orange-100 shadow-sm relative overflow-hidden text-left">
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Truck size={14} className="text-orange-500"/> Delivery Intel</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Staff</p>
                                <p className="text-sm font-bold text-slate-900 truncate">{admins.find((a: any) => a._id === selectedOrder.delivery?.assignedTo)?.name || "Assigned"}</p>
                              </div>
                              {selectedOrder.delivery?.timeSlot && (
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Time</p>
                                  <p className="text-sm font-black text-orange-500">{selectedOrder.delivery.timeSlot}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {selectedOrder.orderStatus === 'Delivered' && !selectedOrder.isReturnRequested && (
                          <Button 
                            onClick={() => setShowReturnModal(true)}
                            className="w-full h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-400 hover:border-rose-500 hover:text-rose-500 font-black uppercase tracking-widest text-[10px] gap-2 transition-all leading-none"
                          >
                            <RotateCcw size={16} /> REQUEST RETURN / REFUND
                          </Button>
                        )}
                        {selectedOrder.isReturnRequested && (
                          <div className={`mt-auto p-4 rounded-2xl border-2 flex items-center gap-4 ${selectedOrder.returnStatus === 'Approved' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-orange-100 bg-orange-50 text-orange-600'}`}>
                            <ShieldCheck size={24} />
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Return Status</p>
                              <p className="text-xs font-bold leading-none">{selectedOrder.returnStatus === 'Requested' ? 'Pending Review' : `Request ${selectedOrder.returnStatus}`}</p>
                            </div>
                          </div>
                        )}
                        {selectedOrder.orderStatus !== 'Cancelled' && 
                         selectedOrder.orderStatus !== 'Delivered' && 
                         !selectedOrder.isReturnRequested &&
                         !selectedOrder.delivery?.assignedTo && (
                          <Button 
                            onClick={async () => {
                              if (window.confirm("Are you sure you want to cancel this order?")) {
                                try {
                                  await api.put(`/orders/${selectedOrder._id}/cancel`);
                                  toast({ title: "Order Cancelled", description: "Your order has been cancelled successfully." });
                                  setSelectedOrder(null);
                                  fetchOrders();
                                } catch (err) {
                                  toast({ variant: "destructive", title: "Cancellation Failed", description: "Please try again later." });
                                }
                              }
                            }}
                            className="w-full h-14 mt-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
                          >
                            CANCEL THIS ORDER
                          </Button>
                        )}
                        <Button 
                          onClick={() => navigate('/help')}
                          className="w-full h-14 mt-4 rounded-2xl bg-slate-900 text-white hover:bg-orange-600 font-black uppercase tracking-widest text-[10px] transition-all"
                        >
                          NEED HELP?
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>, document.body)}

        {typeof document !== "undefined" && createPortal(
          <AnimatePresence>
            {showReturnModal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div onClick={() => setShowReturnModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-sm">
                  <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 mb-6 uppercase">WHY ARE YOU <span className="text-orange-500">RETURNING?</span></h2>
                  <div className="space-y-4 mb-8">
                    <Input
                      placeholder="Enter reason (e.g. Size didn't fit, wrong color...)"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="h-14 rounded-2xl border-slate-200"
                    />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 italic">Return policy applies. Our team will verify the reason before approval.</p>
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={() => setShowReturnModal(false)} variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                    <Button onClick={handleReturnRequest} disabled={!returnReason} className="flex-1 h-14 rounded-2xl bg-slate-900 text-white hover:bg-orange-500 font-black uppercase tracking-widest text-[10px] shadow-sm leading-none">SUBMIT REQUEST</Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>, document.body)}
      </div>
    </PageTransition>
  );
};

export default Orders;

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Truck, Package, CheckCircle2, AlertCircle, Clock, X,
  ShieldCheck, RotateCcw, MapPin, Phone, Calendar,
  User as UserIcon, FileText, Eye
} from "lucide-react";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/hooks/useSocket";

const deliveryStatusConfig: Record<string, { icon: any; color: string; label: string }> = {
  'Pending':        { icon: Clock,        color: "bg-slate-50 text-slate-500",   label: "Pending" },
  'Assigned':       { icon: UserIcon,     color: "bg-orange-50 text-orange-600", label: "Assigned" },
  'OutForDelivery': { icon: Truck,        color: "bg-amber-50 text-amber-700",   label: "Out for Delivery" },
  'Delivered':      { icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", label: "Delivered" },
  'Failed':         { icon: AlertCircle,  color: "bg-rose-50 text-rose-600",     label: "Failed" },
  'Rescheduled':    { icon: RotateCcw,    color: "bg-amber-50 text-amber-600",   label: "Rescheduled" },
};

const Delivery = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Assignment form
  const [assignedTo, setAssignedTo] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("10:00");
  const [deliveryPriority, setDeliveryPriority] = useState("Normal");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [otpInput, setOtpInput] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const { socket, onEvent } = useSocket("admin_orders");

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  const fetchOrders = async () => {
    try {
      const endpoint = isAdmin ? "/orders" : "/orders/mine";
      const { data } = await api.get(endpoint);
      // Admin sees all orders, staff sees only assigned to them, shopper sees their deliveries
      let filtered = data;
      if (isStaff) {
        filtered = data.filter((o: any) => o.delivery?.assignedTo === user?._id);
      } else if (!isAdmin) {
        filtered = data.filter((o: any) =>
          ["Packed", "Shipped", "OutForDelivery", "Delivered", "FailedDelivery"].includes(o.orderStatus)
        );
      }
      setOrders(filtered);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data } = await api.get("/auth/users");
      setAdmins(data.filter((u: any) => u.role === "admin" || u.role === "staff"));
    } catch (err) { /* ignore */ }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      if (isAdmin) fetchAdmins();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      onEvent("order_status_updated", (updatedOrder: any) => {
        setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
        if (selectedOrder?._id === updatedOrder._id) setSelectedOrder(updatedOrder);
      });
    }
  }, [socket, selectedOrder]);

  // When order is selected, prefill form
  useEffect(() => {
    if (selectedOrder) {
      setAssignedTo(selectedOrder.delivery?.assignedTo || "");
      setDeliveryTime(selectedOrder.delivery?.timeSlot || "10:00");
      setDeliveryNotes(selectedOrder.delivery?.notes || "");
      setDeliveryDate(selectedOrder.delivery?.deliveryDate
        ? new Date(selectedOrder.delivery.deliveryDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10));
      setOtpInput("");
    }
  }, [selectedOrder]);

  // --- Handlers ---
  const handleAssignDelivery = async () => {
    if (!selectedOrder || !assignedTo) {
      toast({ variant: "destructive", title: "Error", description: "Please select a delivery person" });
      return;
    }
    try {
      const { data } = await api.put("/orders/" + selectedOrder._id + "/delivery", {
        assignedTo, deliveryDate, timeSlot: deliveryTime, priority: deliveryPriority, notes: deliveryNotes
      });
      setSelectedOrder(data);
      setOrders(prev => prev.map(o => o._id === data._id ? data : o));
      toast({ title: "Delivery Assigned", description: "OTP: " + (data.delivery?.otp || "Generated") + " — Share with customer" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Assignment failed" });
    }
  };

  const handleOtpVerify = async () => {
    if (!selectedOrder) return;
    try {
      const { data } = await api.post("/orders/" + selectedOrder._id + "/delivery/verify-otp", { otp: otpInput });
      setSelectedOrder(data);
      setOrders(prev => prev.map(o => o._id === data._id ? data : o));
      setOtpInput("");
      toast({ title: "OTP Verified!", description: "Order marked as Delivered." });
    } catch (err) {
      toast({ variant: "destructive", title: "Invalid OTP", description: "The OTP entered is incorrect." });
    }
  };

  const handleDeliveryStatus = async (status: string) => {
    if (!selectedOrder) return;
    try {
      const { data } = await api.put("/orders/" + selectedOrder._id + "/delivery/status", { status, notes: deliveryNotes });
      setSelectedOrder(data);
      setOrders(prev => prev.map(o => o._id === data._id ? data : o));
      toast({ title: "Status Updated", description: "Delivery marked as " + status });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Status update failed" });
    }
  };

  // --- Filtering ---
  const filteredOrders = orders.filter(o => {
    if (filter === "all") return true;
    if (filter === "today") {
      const today = new Date().toISOString().slice(0, 10);
      const dd = o.delivery?.deliveryDate ? new Date(o.delivery.deliveryDate).toISOString().slice(0, 10) : "";
      return dd === today;
    }
    if (filter === "assigned") return o.delivery?.status === "Assigned";
    if (filter === "out") return o.delivery?.status === "OutForDelivery" || o.orderStatus === "OutForDelivery";
    if (filter === "delivered") return o.delivery?.otpVerified || o.orderStatus === "Delivered";
    if (filter === "failed") return o.delivery?.status === "Failed" || o.orderStatus === "FailedDelivery";
    if (filter === "unassigned") return !o.delivery?.assignedTo;
    return true;
  });

  const getStaffName = (order: any) => order.delivery?.assignedTo?.name || (order.delivery?.assignedTo && typeof order.delivery.assignedTo === 'string' ? admins.find(a => a._id === order.delivery.assignedTo)?.name : "Unassigned");
  const getStaffPhone = (order: any) => order.delivery?.assignedTo?.mobile || (order.delivery?.assignedTo && typeof order.delivery.assignedTo === 'string' ? admins.find(a => a._id === order.delivery.assignedTo)?.mobile : "—");

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="page-loader" /></div>;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
              {isAdmin ? "Delivery" : isStaff ? "My" : "Order"}{" "}
              <span className="text-orange-500 not-italic">
                {isAdmin ? "Hub." : isStaff ? "Deliveries." : "Tracking."}
              </span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
              {isAdmin ? "Assign, track & verify all deliveries" : isStaff ? "Your assigned delivery tasks" : "Track your package status"}
            </p>
          </div>

          {/* Stat Summary — Admin */}
          {isAdmin && (
            <div className="flex gap-3">
              {[
                { label: "Total", value: orders.length, color: "text-slate-900" },
                { label: "Assigned", value: orders.filter(o => o.delivery?.status === "Assigned").length, color: "text-orange-500" },
                { label: "In Transit", value: orders.filter(o => o.delivery?.status === "OutForDelivery").length, color: "text-amber-600" },
                { label: "Delivered", value: orders.filter(o => o.delivery?.otpVerified).length, color: "text-emerald-500" },
              ].map(s => (
                <div key={s.label} className="text-center px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </header>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {(isAdmin
            ? [
                { key: "all", label: "All Orders" },
                { key: "unassigned", label: "Unassigned" },
                { key: "assigned", label: "Assigned" },
                { key: "today", label: "Today" },
                { key: "out", label: "In Transit" },
                { key: "delivered", label: "Delivered" },
                { key: "failed", label: "Failed" },
              ]
            : [
                { key: "all", label: "All" },
                { key: "out", label: "In Transit" },
                { key: "delivered", label: "Delivered" },
              ]
          ).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                filter === f.key
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Truck size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-lg font-bold text-slate-400">No deliveries found</p>
            <p className="text-sm text-slate-300 mt-1">Adjust your filters or assign new deliveries.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredOrders.map((order, i) => {
                const dStatus = order.delivery?.status || "Pending";
                const cfg = deliveryStatusConfig[dStatus] || deliveryStatusConfig["Pending"];
                const StatusIcon = cfg.icon;

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white rounded-[2rem] border-2 border-slate-50 p-6 cursor-pointer hover:border-orange-100 hover:shadow-xl hover:shadow-orange-500/5 transition-all group flex flex-col h-full"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${cfg.color}`}>
                        <StatusIcon size={20} />
                      </div>
                      <Badge className={`border-none text-[9px] font-black uppercase tracking-wider px-2 py-1 ${cfg.color}`}>
                        {cfg.label}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Order ID</p>
                        <p className="text-[10px] font-black text-slate-900 leading-none">#{order._id.slice(-6).toUpperCase()}</p>
                      </div>

                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</p>
                        <p className={`text-[10px] font-black uppercase leading-none px-2 py-1 rounded-md ${cfg.color}`}>
                          {cfg.label}
                        </p>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                            <MapPin size={14} className="text-slate-400" />
                          </div>
                          <p className="text-xs font-bold text-slate-600 truncate">{order.shippingAddress?.street || "No Address"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                            <Clock size={14} className="text-slate-400" />
                          </div>
                          <p className="text-xs font-bold text-slate-900">{order.delivery?.timeSlot || "Not Set"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex -space-x-2">
                         {order.orderItems?.slice(0, 3).map((_: any, idx: number) => (
                           <div key={idx} className="h-7 w-7 rounded-lg border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                             <Package size={12} className="text-slate-300" />
                           </div>
                         ))}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Payment</p>
                        <p className="text-sm font-black italic text-slate-900">₹{order.totalPrice?.toLocaleString()}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* DETAIL MODAL                               */}
        {/* ═══════════════════════════════════════════ */}
        {typeof document !== "undefined" && createPortal(
          <AnimatePresence>
            {selectedOrder && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
              >
                <div onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 20 }}
                  className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col"
                >
                  <div className="overflow-y-auto p-8 custom-scrollbar">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
                          DELIVERY <span className="text-orange-500 not-italic">DETAILS.</span>
                        </h2>
                        <p className="text-xs font-medium text-slate-400 mt-2">
                          Order #{selectedOrder._id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <X size={18} className="text-slate-400" />
                      </button>
                    </div>

                    {/* Items Summary */}
                    <div className="mb-6 p-5 bg-slate-50 rounded-2xl">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Items ({selectedOrder.orderItems?.length})</p>
                      <div className="space-y-2">
                        {selectedOrder.orderItems?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-slate-700">{item.name} × {item.qty}</span>
                            <span className="text-sm font-bold text-slate-900">₹{(item.price * item.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between">
                        <span className="text-sm font-bold text-slate-500">Total</span>
                        <span className="text-lg font-black text-orange-500">₹{selectedOrder.totalPrice?.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="mb-6 p-5 rounded-2xl bg-slate-900 text-white">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><MapPin size={14} className="text-orange-400" /> Shipping Address</p>
                      <p className="text-sm font-semibold">{selectedOrder.shippingAddress?.street}</p>
                      {selectedOrder.shippingAddress?.landmark && (
                         <p className="text-xs text-orange-200 mt-0.5 font-medium italic">Landmark: {selectedOrder.shippingAddress.landmark}</p>
                      )}
                      <p className="text-sm text-slate-300 mt-2">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}</p>
                      {selectedOrder.shippingAddress?.phone && (
                         <p className="text-sm font-bold text-orange-400 mt-3 flex items-center gap-2"><Phone size={12} /> {selectedOrder.shippingAddress.phone}</p>
                      )}
                    </div>

                    {/* Delivery Person Card */}
                    {selectedOrder.delivery?.assignedTo && (
                      <div className="p-5 rounded-2xl bg-orange-50 border border-orange-100">
                        <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3 flex items-center gap-2"><UserIcon size={14} /> Assigned Driver</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[11px] font-bold uppercase text-orange-400">Name</p>
                            <p className="text-sm font-bold text-slate-900">{getStaffName(selectedOrder)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase text-orange-400">Phone</p>
                            <p className="text-sm font-bold text-slate-900">{getStaffPhone(selectedOrder)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase text-orange-400">Date</p>
                            <p className="text-sm font-bold text-slate-900">
                              {selectedOrder.delivery.deliveryDate ? new Date(selectedOrder.delivery.deliveryDate).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase text-orange-400">Time</p>
                            <p className="text-sm font-black text-orange-600">{selectedOrder.delivery.timeSlot || "—"}</p>
                          </div>
                        </div>
                        {selectedOrder.delivery.notes && (
                          <div className="mt-3 pt-3 border-t border-orange-200">
                            <p className="text-[11px] font-bold uppercase text-orange-400 mb-1 flex items-center gap-1"><FileText size={12} /> Notes</p>
                            <p className="text-sm text-slate-600 italic">{selectedOrder.delivery.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order Status */}
                    <div className="mt-6">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Order Status</p>
                      <Badge className={`border-none font-bold text-xs uppercase tracking-wide py-1.5 px-3 ${
                        deliveryStatusConfig[selectedOrder.delivery?.status || "Pending"]?.color || "bg-slate-50 text-slate-500"
                      }`}>
                        {deliveryStatusConfig[selectedOrder.delivery?.status || "Pending"]?.label || selectedOrder.orderStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* RIGHT — Action Panel */}
                  <div className="w-full md:w-1/2 p-8 bg-slate-50 border-l border-slate-100 overflow-y-auto flex flex-col gap-5">
                    <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">
                      {isAdmin ? "ACTIONS" : isStaff ? "MY TASK" : "STATUS"}
                      <span className="text-orange-500 not-italic">.</span>
                    </h3>

                    {/* ══════ ADMIN: Assign Delivery ══════ */}
                    {isAdmin && (
                      <>
                        <div className="p-5 bg-white rounded-2xl border border-orange-200 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 flex items-center gap-2"><Truck size={14} /> Assign Delivery</p>

                          <select
                            value={assignedTo}
                            onChange={e => setAssignedTo(e.target.value)}
                            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white font-semibold"
                          >
                            <option value="">Select Delivery Person</option>
                            {admins.map(a => <option key={a._id} value={a._id}>{a.name} ({a.email})</option>)}
                          </select>

                          <div className="grid grid-cols-2 gap-2">
                            <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="h-11 text-sm rounded-xl" />
                            <Input type="time" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="h-11 text-sm rounded-xl" />
                          </div>

                          <select
                            value={deliveryPriority}
                            onChange={e => setDeliveryPriority(e.target.value)}
                            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white font-semibold"
                          >
                            <option value="Normal">Normal Priority</option>
                            <option value="Urgent">Urgent Delivery</option>
                          </select>

                          <Input
                            placeholder="Delivery notes (e.g. Call before delivery)"
                            value={deliveryNotes}
                            onChange={e => setDeliveryNotes(e.target.value)}
                            className="h-11 text-sm rounded-xl"
                          />

                          <Button onClick={handleAssignDelivery} className="w-full bg-orange-500 text-white hover:bg-orange-600 h-12 rounded-xl font-bold text-sm uppercase tracking-wide transition-colors">
                            {selectedOrder.delivery?.assignedTo ? "Update Assignment" : "Assign Delivery & Generate OTP"}
                          </Button>
                        </div>

                        {/* OTP Display Card */}
                        {selectedOrder.delivery?.otp && (
                          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Customer OTP</p>
                              <p className="text-3xl font-black italic text-emerald-700 tracking-widest">{selectedOrder.delivery.otp}</p>
                            </div>
                            <Badge className={`border-none font-bold text-xs uppercase ${selectedOrder.delivery.otpVerified ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-700"}`}>
                              {selectedOrder.delivery.otpVerified ? "✓ Verified" : "Pending"}
                            </Badge>
                          </div>
                        )}
                      </>
                    )}

                    {/* ══════ ADMIN + STAFF: OTP Verify + Status Controls ══════ */}
                    {(isAdmin || isStaff) && selectedOrder.delivery?.assignedTo && !selectedOrder.delivery?.otpVerified && (
                      <div className="p-5 bg-slate-900 rounded-2xl text-white space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 flex items-center gap-2"><ShieldCheck size={14} /> Verify Delivery</p>
                        <p className="text-xs text-slate-400 font-medium">Enter the 6-digit OTP provided by the customer.</p>

                        <Input
                          value={otpInput}
                          onChange={e => setOtpInput(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          className="h-12 text-lg font-black text-slate-900 tracking-widest text-center rounded-xl"
                          maxLength={6}
                        />

                        <div className="grid grid-cols-3 gap-2">
                          <Button onClick={() => handleDeliveryStatus("OutForDelivery")} className="bg-amber-500 hover:bg-amber-600 h-11 rounded-xl font-bold text-xs uppercase tracking-wide">
                            🚚 Start
                          </Button>
                          <Button onClick={handleOtpVerify} disabled={otpInput.length !== 6} className="bg-emerald-500 hover:bg-emerald-600 h-11 rounded-xl font-bold text-xs uppercase tracking-wide">
                            ✓ Verify
                          </Button>
                          <Button onClick={() => handleDeliveryStatus("Failed")} className="bg-rose-500 hover:bg-rose-600 h-11 rounded-xl font-bold text-xs uppercase tracking-wide">
                            ✗ Failed
                          </Button>
                        </div>

                        <div className="pt-2">
                           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Update status manually</p>
                           <select 
                             className="w-full h-11 px-3 rounded-xl bg-slate-800 text-white text-xs font-bold border-none"
                             value={selectedOrder.delivery?.status || "Pending"}
                             onChange={(e) => handleDeliveryStatus(e.target.value)}
                           >
                             {Object.keys(deliveryStatusConfig).map(k => (
                               <option key={k} value={k}>{deliveryStatusConfig[k].label}</option>
                             ))}
                           </select>
                        </div>
                      </div>
                    )}

                    {/* ══════ Delivery Completed Badge ══════ */}
                    {selectedOrder.delivery?.otpVerified && (
                      <div className="p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-200 flex items-center gap-4">
                        <CheckCircle2 size={28} className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Delivery Verified</p>
                          <p className="text-sm font-semibold text-emerald-700">OTP confirmed. Order delivered successfully.</p>
                        </div>
                      </div>
                    )}

                    {/* ══════ SHOPPER: Status View ══════ */}
                    {!isAdmin && !isStaff && (
                      <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-white border border-slate-200">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Delivery Status</p>
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${deliveryStatusConfig[selectedOrder.delivery?.status || "Pending"]?.color}`}>
                              <Truck size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {deliveryStatusConfig[selectedOrder.delivery?.status || "Pending"]?.label || "Processing"}
                              </p>
                              {selectedOrder.delivery?.timeSlot && (
                                <p className="text-xs text-slate-400 font-medium">Arriving at {selectedOrder.delivery.timeSlot}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {selectedOrder.delivery?.assignedTo && (
                          <div className="p-5 rounded-2xl bg-white border border-slate-200">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><UserIcon size={12} /> Your Delivery Person</p>
                            <p className="text-base font-bold text-slate-900">{getStaffName(selectedOrder)}</p>
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><Phone size={12} /> {getStaffPhone(selectedOrder)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status History */}
                    {selectedOrder.statusHistory?.length > 0 && (
                      <div className="p-5 bg-white rounded-2xl border border-slate-100 mt-auto">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Timeline</p>
                        <div className="space-y-3">
                          {selectedOrder.statusHistory.slice().reverse().map((h: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="mt-0.5 h-2 w-2 rounded-full bg-orange-400 shrink-0" />
                              <div>
                                <p className="text-xs font-bold text-slate-900">{h.status}</p>
                                {h.comment && <p className="text-[11px] text-slate-400 italic">{h.comment}</p>}
                                <p className="text-[10px] text-slate-300 font-medium">{new Date(h.timestamp).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </PageTransition>
  );
};

export default Delivery;

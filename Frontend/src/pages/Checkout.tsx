import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CreditCard, ShoppingBag, Truck, CheckCircle2, ChevronRight, Home, Briefcase, Plus, ShieldCheck, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { loadRazorpay } from "@/lib/razorpay";

const ScanLine = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" />
  </svg>
);

const Checkout = () => {
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [addressForm, setAddressForm] = useState({
    label: 'Home', fullName: '', phone: '', street: '', landmark: '',
    city: '', state: '', postalCode: '', isDefault: false,
  });
  const { user, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const { data } = await api.get("/cart");
      setCart(data);
      if (data.items.length === 0) navigate("/cart");
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load cart" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Separate useEffect for address selection logic to handle late-loading auth state
  useEffect(() => {
    if (user?.addresses?.length > 0 && selectedAddressIdx === null) {
      const defaultIdx = user.addresses.findIndex((a: any) => a.isDefault);
      setSelectedAddressIdx(defaultIdx !== -1 ? defaultIdx : 0);
    }
  }, [user]);

  const selectedAddress = user?.addresses?.[selectedAddressIdx ?? -1] || null;

  const handleAddAddress = async () => {
    if (!addressForm.street || !addressForm.city || !addressForm.postalCode) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Street, city and postal code are required." });
      return;
    }
    setSavingAddress(true);
    try {
      const currentAddresses = user?.addresses || [];
      const updatedAddresses = [...currentAddresses, addressForm];
      await api.put('/auth/profile', { addresses: updatedAddresses });
      // Refresh user addresses from server
      const { data: me } = await api.get('/auth/me');
      const updatedUser = { ...user, addresses: me.addresses || updatedAddresses };
      login(updatedUser);
      setSelectedAddressIdx(updatedAddresses.length - 1);
      toast({ title: "Address Added", description: "New address saved and selected." });
      setShowAddressModal(false);
      setAddressForm({ label: 'Home', fullName: '', phone: '', street: '', landmark: '', city: '', state: '', postalCode: '', isDefault: false });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to save address." });
    } finally {
      setSavingAddress(false);
    }
  };

  const placeOrder = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (paymentMethod === 'COD') {
      await processDbOrder();
      return;
    }

    try {
      const orderData = {
        orderItems: cart.items.map((item: any) => ({
          name: item.product.productName,
          qty: item.qty,
          image: item.product.images?.[0] || "",
          price: item.product.price,
          product: item.product._id,
          shopId: item.shopId || item.product.shopId
        })),
        shippingAddress: selectedAddress,
        paymentMethod,
        itemsPrice: totalPrice,
        taxPrice: 0,
        shippingPrice: 60,
        totalPrice: finalPrice,
        shopId: cart.items[0]?.shopId || cart.items[0]?.product?.shopId
      };

      if (discount > 0) {
        (orderData as any).discountAmount = discountAmount;
      }

      const { data: dbOrder } = await api.post("/orders", orderData);

      const { data: rzpOrder } = await api.post("/orders/pay", {
        amount: Math.round(dbOrder.totalPrice * 100),
        receipt: `receipt_${dbOrder._id.slice(-6)}`
      });

      const res = await loadRazorpay();
      if (!res) {
        toast({ variant: "destructive", title: "SDK Load Failed", description: "Payment gateway unavailable" });
        setIsProcessing(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SiQac1IRhggraC",
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "3DShop Professional",
        description: "Transaction for Order #" + dbOrder._id.slice(-6),
        order_id: rzpOrder.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await api.post("/orders/verify", {
              ...response,
              orderId: dbOrder._id
            });
            if (verifyRes.data.status === 'success') {
              await api.delete("/cart");
              setStep(3);
              toast({ title: "Payment Success!", description: "Your order is confirmed." });
            }
          } catch (err) {
            toast({ variant: "destructive", title: "Verification Failed", description: "Please contact support" });
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            api.put(`/orders/${dbOrder._id}/cancel`).catch(() => {});
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: "+91 9999999999"
        },
        theme: { color: "#f97316" }
      };

      const paymentObject = new (window as any).Razorpay(options);
      
      paymentObject.on('payment.failed', function (response: any) {
        toast({ variant: "destructive", title: "Payment Failed", description: response.error.description || "Checkout failed" });
        setIsProcessing(false);
      });

      paymentObject.open();

    } catch (err) {
      toast({ variant: "destructive", title: "Order Failed", description: "Something went wrong" });
      setIsProcessing(false);
    }
  };

  const processDbOrder = async () => {
    try {
      const orderData = {
        orderItems: cart.items.map((item: any) => ({
          name: item.product.productName,
          qty: item.qty,
          image: item.product.images?.[0] || "",
          price: item.product.price,
          product: item.product._id,
          shopId: item.shopId || item.product.shopId
        })),
        shippingAddress: selectedAddress,
        paymentMethod: 'COD',
        itemsPrice: totalPrice,
        taxPrice: 0,
        shippingPrice: 60,
        totalPrice: finalPrice,
        shopId: cart.items[0]?.shopId || cart.items[0]?.product?.shopId
      };

      if (discount > 0) {
        (orderData as any).discountAmount = discountAmount;
      }

      await api.post("/orders", orderData);
      await api.delete("/cart");
      setStep(3);
      toast({ title: "Order Placed!", description: "Pay when you receive the items." });
    } catch (error: any) {
      console.error("Order error", error);
      const serverMsg = error.response?.data?.message || "Could not place order. Please check your details.";
      toast({ 
        variant: "destructive", 
        title: "Order Failed", 
        description: serverMsg 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPrice = cart?.items?.reduce((acc: number, item: any) => acc + (item.product?.price || 0) * item.qty, 0) || 0;
  const discountAmount = Number((totalPrice * (discount / 100)).toFixed(2));
  const finalPrice = Number((totalPrice - discountAmount + 60).toFixed(2));

  const applyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const { data } = await api.post("/coupons/validate", { code: couponCode });
      if (data.valid) {
        setDiscount(data.discountPercentage);
        toast({ title: "Coupon Applied", description: `You got ${data.discountPercentage}% off!` });
      }
    } catch {
      setCouponError("Invalid or inactive coupon");
      setDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  if (loading) return null;

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 justify-center">
          <span className="hover:text-orange-500 cursor-pointer transition-colors" onClick={() => navigate('/')}>home</span>
          <span className="text-slate-300">/</span>
          <span className="text-orange-500">checkout</span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-12 md:mb-20 gap-3 md:gap-4">
          {[
            { id: 1, label: "Address" },
            { id: 2, label: "Payment" },
            { id: 3, label: "Done" }
          ].map((s, idx) => (
            <div key={s.id} className="flex items-center gap-3 md:gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm transition-all ${
                  step === s.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 
                  step > s.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > s.id ? <Check size={20} strokeWidth={3} /> : s.id}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${step >= s.id ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
              </div>
              {idx < 2 && (
                <div className="flex flex-col items-center gap-2 mb-6">
                  <div className={`w-8 sm:w-12 md:w-20 h-1.5 rounded-full transition-colors duration-500 ${step > s.id ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                </div>
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 leading-none">SHIPPING <span className="text-primary not-italic">ADDRESS</span></h2>
                <Button onClick={() => setShowAddressModal(true)} variant="outline" className="rounded-xl border-slate-200 font-bold gap-2 hover:bg-slate-50 transition-all text-xs h-10 py-1">
                  <Plus size={16} /> New Address
                </Button>
              </div>

              {/* Add Address Modal */}
              <AnimatePresence>
                {showAddressModal && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                      className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black italic text-slate-900 uppercase">New <span className="text-primary not-italic">Address</span></h3>
                        <button onClick={() => setShowAddressModal(false)} className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          {['Home', 'Work', 'Other'].map(l => (
                            <button key={l} onClick={() => setAddressForm({ ...addressForm, label: l })}
                              className={`flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all ${addressForm.label === l ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-400'
                                }`}>
                              {l}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input placeholder="Full Name" value={addressForm.fullName} onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })} className="h-11 rounded-xl" />
                          <Input placeholder="Phone" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} className="h-11 rounded-xl" />
                        </div>
                        <Input placeholder="Street Address *" value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} className="h-11 rounded-xl" />
                        <Input placeholder="Landmark (optional)" value={addressForm.landmark} onChange={e => setAddressForm({ ...addressForm, landmark: e.target.value })} className="h-11 rounded-xl" />
                        <div className="grid grid-cols-2 gap-3">
                          <Input placeholder="City *" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} className="h-11 rounded-xl" />
                          <Input placeholder="State" value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} className="h-11 rounded-xl" />
                        </div>
                        <Input placeholder="Postal Code *" value={addressForm.postalCode} onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value })} className="h-11 rounded-xl" />
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div
                            onClick={() => setAddressForm({ ...addressForm, isDefault: !addressForm.isDefault })}
                            className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${addressForm.isDefault ? 'bg-primary border-primary' : 'border-slate-300'
                              }`}
                          >
                            {addressForm.isDefault && <Check size={12} className="text-white" />}
                          </div>
                          <span className="text-sm font-bold text-slate-600">Set as default address</span>
                        </label>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <Button variant="outline" onClick={() => setShowAddressModal(false)} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
                        <Button onClick={handleAddAddress} disabled={savingAddress} className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white transition-colors">
                          {savingAddress ? 'Saving...' : 'Save & Select'}
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(user?.addresses || []).length === 0 ? (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                    <MapPin size={40} className="text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold mb-4">No shipping addresses found</p>
                    <Button onClick={() => setShowAddressModal(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6">Add Your First Address</Button>
                  </div>
                ) : (
                  (user?.addresses || []).map((addr: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedAddressIdx(idx)}
                      className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border-2 cursor-pointer transition-all ${selectedAddressIdx === idx ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedAddressIdx === idx ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {addr.label === 'Home' ? <Home size={18} /> : <Briefcase size={18} />}
                        </div>
                        {selectedAddressIdx === idx && <CheckCircle2 size={24} className="text-primary" />}
                      </div>
                      <p className="font-black italic text-slate-900 mb-1 tracking-tight">{addr.label}</p>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-2">{addr.street}, {addr.city}, {addr.state} {addr.postalCode}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <Button onClick={() => setStep(2)} disabled={selectedAddressIdx === null} className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[11px] gap-3 shadow-sm active:scale-95 transition-all">
                  CONTINUE TO PAYMENT <ChevronRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-slate-900 leading-none">PAYMENT <span className="text-primary not-italic">METHOD</span></h2>
                  <div className="space-y-4">
                    {[
                      { id: 'COD', name: 'Cash on Delivery', icon: <Truck size={20} /> },
                      { id: 'UPI', name: 'Online Payment (Razorpay)', icon: <ScanLine size={20} /> },
                    ].map((m: any) => (
                      <div
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === m.id ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${paymentMethod === m.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {m.icon}
                          </div>
                          <span className="font-black italic text-slate-700 leading-none tracking-tight">{m.name}</span>
                        </div>
                        {paymentMethod === m.id && <div className="h-3 w-3 rounded-full bg-primary" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 text-slate-900 shadow-sm h-fit">
                  <h3 className="text-xl font-black italic mb-8 border-b border-slate-100 pb-4 tracking-tight uppercase">Order Summary</h3>
                  
                  <div className="mb-6 space-y-2">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Coupon Code" 
                        value={couponCode} 
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 uppercase font-bold" 
                      />
                      <Button onClick={applyCoupon} disabled={couponLoading || !couponCode} className="h-12 px-6 bg-primary hover:bg-primary/90 font-black uppercase text-xs tracking-widest text-white">
                        {couponLoading ? '...' : 'Apply'}
                      </Button>
                    </div>
                    {couponError && <p className="text-rose-500 text-xs font-bold px-1 flex items-center gap-1.5 animate-pulse"><AlertCircle size={12} /> {couponError}</p>}
                    {discount > 0 && <p className="text-emerald-500 text-xs font-bold px-1 flex items-center gap-1.5"><CheckCircle2 size={12} /> Coupon applied: {discount}% OFF</p>}
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="font-black text-[9px] uppercase tracking-[0.2em] leading-none opacity-60">Items Total</span>
                      <span className="font-black italic">₹{totalPrice}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center text-emerald-500">
                        <span className="font-black text-[9px] uppercase tracking-[0.2em] leading-none">Discount ({discount}%)</span>
                        <span className="font-black italic">-₹{discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="font-black text-[9px] uppercase tracking-[0.2em] leading-none opacity-60">GST (0%)</span>
                      <span className="font-black italic">₹0</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="font-black text-[9px] uppercase tracking-[0.2em] leading-none opacity-60">Shipping</span>
                      <span className="font-black italic">₹60</span>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                      <span className="font-black text-xl italic tracking-tighter leading-none uppercase">GRAND TOTAL</span>
                      <span className="text-3xl font-black text-slate-900 italic leading-none">₹{finalPrice}</span>
                    </div>
                  </div>

                  <Button onClick={placeOrder} disabled={isProcessing} className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.15em] text-[11px] gap-3 group active:scale-95 transition-all shadow-lg shadow-primary/20">
                    {isProcessing ? 'PROCESSING...' : 'COMPLETE ORDER'} {!isProcessing && <ShoppingBag size={18} className="group-hover:rotate-12 transition-transform" />}
                  </Button>
                  <p className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none not-italic">
                    <ShieldCheck size={14} className="text-emerald-500" /> SECURE SSL ENCRYPTION
                  </p>
                </div>
              </div>

              <Button variant="ghost" onClick={() => setStep(1)} className="font-black italic text-slate-400 hover:text-slate-900 gap-2 transition-colors">
                <ChevronRight size={16} className="rotate-180" /> ← BACK TO ADDRESS
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 sm:py-24 bg-white rounded-2xl sm:rounded-[4rem] shadow-xl border border-slate-50 px-4"
            >
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-10 shadow-inner ring-4 ring-emerald-100">
                <CheckCircle2 size={40} className="sm:w-16 sm:h-16 text-emerald-500" />
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 rounded-full bg-emerald-200" 
                />
              </div>
              <h2 className="text-2xl sm:text-4xl font-black italic text-slate-900 mb-3 sm:mb-4 tracking-tighter leading-none uppercase">ORDER <span className="text-emerald-500 not-italic">PLACED!</span></h2>
              <p className="text-slate-400 font-semibold mb-8 sm:mb-14 max-w-xs mx-auto text-sm">Your order has been placed and is being processed.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/orders')} className="h-14 sm:h-16 px-8 sm:px-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-xl active:scale-95 transition-all">
                  VIEW MY ORDERS <ShoppingBag size={18} />
                </Button>
                <Button onClick={() => navigate('/catalog')} variant="outline" className="h-14 sm:h-16 px-8 sm:px-12 rounded-2xl border-slate-200 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all active:scale-95">
                  KEEP SHOPPING
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default Checkout;

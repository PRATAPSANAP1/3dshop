import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CreditCard, ShoppingBag, Truck, CheckCircle2, ChevronRight, Home, Briefcase, Plus, ShieldCheck, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { loadRazorpay } from "@/lib/razorpay";

const Checkout = () => {
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
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
    city: '', state: '', pinCode: '', isDefault: false,
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
    if (user?.addresses?.length > 0) {
      setSelectedAddress(user.addresses.find((a: any) => a.isDefault) || user.addresses[0]);
    }
  }, [user]);

  const handleAddAddress = async () => {
    if (!addressForm.street || !addressForm.city || !addressForm.pinCode) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Street, city and pin code are required." });
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
      setSelectedAddress(addressForm);
      toast({ title: "Address Added", description: "New address saved and selected." });
      setShowAddressModal(false);
      setAddressForm({ label: 'Home', fullName: '', phone: '', street: '', landmark: '', city: '', state: '', pinCode: '', isDefault: false });
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
          product: item.product._id
        })),
        shippingAddress: selectedAddress,
        paymentMethod,
        itemsPrice: totalPrice,
        taxPrice: 0,
        shippingPrice: 60,
        totalPrice: finalPrice
      };

      // Ensure discount is recorded in order if backend supports it
      if (discount > 0) {
        (orderData as any).discountAmount = discountAmount;
      }

      const { data: dbOrder } = await api.post("/orders", orderData);

      const { data: rzpOrder } = await api.post("/orders/pay", {
        amount: dbOrder.totalPrice,
        receipt: `receipt_${dbOrder._id.slice(-6)}`
      });

      const res = await loadRazorpay();
      if (!res) {
        toast({ variant: "destructive", title: "SDK Load Failed", description: "Payment gateway unavailable" });
        setIsProcessing(false);
        return;
      }

      const options = {
        key: import.meta.env.RAZORPAY_KEY_ID || "rzp_test_yourkey",
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "3Dshop Professional",
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
          product: item.product._id
        })),
        shippingAddress: selectedAddress,
        paymentMethod: 'COD',
        itemsPrice: totalPrice,
        taxPrice: 0,
        shippingPrice: 60,
        totalPrice: finalPrice
      };

      if (discount > 0) {
        (orderData as any).discountAmount = discountAmount;
      }

      await api.post("/orders", orderData);
      await api.delete("/cart");
      setStep(3);
      toast({ title: "Order Placed!", description: "Pay when you receive the items." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Order failed" });
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

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="page-loader" /></div>;

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 justify-center">
          <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>home</span>
          <span className="text-slate-300">/</span>
          <span className="text-primary">checkout</span>
        </div>
        <div className="flex items-center justify-center mb-8 md:mb-16 gap-3 md:gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3 md:gap-4">
              <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm transition-all ${step >= s ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                {s < step ? <CheckCircle2 size={20} /> : s}
              </div>
              {s < 3 && <div className={`w-8 sm:w-12 md:w-20 h-1.5 rounded-full ${step > s ? 'bg-orange-500' : 'bg-slate-100'}`} />}
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
                <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 leading-none">SHIPPING <span className="text-orange-500 not-italic">ADDRESS</span></h2>
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
                        <h3 className="text-xl font-black italic text-slate-900 uppercase">New <span className="text-orange-500 not-italic">Address</span></h3>
                        <button onClick={() => setShowAddressModal(false)} className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500">
                          <X size={18} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          {['Home', 'Work', 'Other'].map(l => (
                            <button key={l} onClick={() => setAddressForm({ ...addressForm, label: l })}
                              className={`flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all ${addressForm.label === l ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-200 text-slate-400'
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
                        <Input placeholder="Pin Code *" value={addressForm.pinCode} onChange={e => setAddressForm({ ...addressForm, pinCode: e.target.value })} className="h-11 rounded-xl" />
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div
                            onClick={() => setAddressForm({ ...addressForm, isDefault: !addressForm.isDefault })}
                            className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${addressForm.isDefault ? 'bg-orange-500 border-orange-500' : 'border-slate-300'
                              }`}
                          >
                            {addressForm.isDefault && <Check size={12} className="text-white" />}
                          </div>
                          <span className="text-sm font-bold text-slate-600">Set as default address</span>
                        </label>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <Button variant="outline" onClick={() => setShowAddressModal(false)} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
                        <Button onClick={handleAddAddress} disabled={savingAddress} className="flex-1 h-12 rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white">
                          {savingAddress ? 'Saving...' : 'Save & Select'}
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(user?.addresses?.length ? user.addresses : [
                  { label: 'Home', street: '123 Main Street', city: 'Mumbai', state: 'MH', zipCode: '400001', pinCode: '400001', isDefault: true },
                  { label: 'Work', street: 'Office 45, Tech Park', city: 'Bengaluru', state: 'KA', zipCode: '560001', pinCode: '560001' }
                ]).map((addr: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedAddress(addr)}
                    className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border-2 cursor-pointer transition-all ${selectedAddress?.label === addr.label ? 'border-orange-500 bg-orange-50/30' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedAddress?.label === addr.label ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {addr.label === 'Home' ? <Home size={18} /> : <Briefcase size={18} />}
                      </div>
                      {selectedAddress?.label === addr.label && <CheckCircle2 size={24} className="text-orange-500" />}
                    </div>
                    <p className="font-black italic text-slate-900 mb-1">{addr.label}</p>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">{addr.street}, {addr.city}, {addr.state} {addr.pinCode || addr.zipCode || addr.postalCode}</p>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!selectedAddress} className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-sm active:scale-95 transition-all">
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
                  <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-slate-900 leading-none">PAYMENT <span className="text-orange-500 not-italic">METHOD</span></h2>
                  <div className="space-y-4">
                    {[
                      { id: 'COD', name: 'Cash on Delivery', icon: <Truck size={20} /> },
                      { id: 'UPI', name: 'UPI / QR Payment', icon: <ScanLine size={20} /> },
                    ].map((m: any) => (
                      <div
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === m.id ? 'border-orange-500 bg-orange-50/30' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${paymentMethod === m.id ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {m.icon}
                          </div>
                          <span className="font-black italic text-slate-700 leading-none">{m.name}</span>
                        </div>
                        {paymentMethod === m.id && <div className="h-3 w-3 rounded-full bg-orange-500" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 text-white shadow-sm h-fit">
                  <h3 className="text-xl font-black italic mb-8 border-b border-white/10 pb-4">ORDER SUMMARY</h3>
                  
                  <div className="mb-6 space-y-2">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Coupon Code" 
                        value={couponCode} 
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 uppercase" 
                      />
                      <Button onClick={applyCoupon} disabled={couponLoading || !couponCode} className="h-12 px-6 bg-orange-500 hover:bg-orange-600 font-bold">
                        {couponLoading ? '...' : 'Apply'}
                      </Button>
                    </div>
                    {couponError && <p className="text-rose-400 text-xs font-bold px-1">{couponError}</p>}
                    {discount > 0 && <p className="text-emerald-400 text-xs font-bold px-1">Coupon applied: {discount}% OFF</p>}
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-bold text-xs uppercase tracking-widest leading-none">Items Total</span>
                      <span className="font-black italic">₹{totalPrice}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center text-emerald-400">
                        <span className="font-bold text-xs uppercase tracking-widest leading-none">Discount ({discount}%)</span>
                        <span className="font-black italic">-₹{discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-bold text-xs uppercase tracking-widest leading-none">GST (0%)</span>
                      <span className="font-black italic">₹0</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-bold text-xs uppercase tracking-widest leading-none">Shipping</span>
                      <span className="font-black italic text-orange-500">₹60</span>
                    </div>
                    <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                      <span className="font-black text-xl italic tracking-tighter leading-none">GRAND TOTAL</span>
                      <span className="text-3xl font-black text-orange-500 italic leading-none">₹{finalPrice}</span>
                    </div>
                  </div>

                  <Button onClick={placeOrder} disabled={isProcessing} className="w-full h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-sm  gap-3 group">
                    {isProcessing ? 'PROCESSING...' : 'COMPLETE ORDER'} {!isProcessing && <ShoppingBag size={18} className="group-hover:rotate-12 transition-transform" />}
                  </Button>
                  <p className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none italic">
                    <ShieldCheck size={14} className="text-emerald-500" /> SECURE SSL ENCRYPTION
                  </p>
                </div>
              </div>

              <Button variant="ghost" onClick={() => setStep(1)} className="font-black italic text-slate-400 hover:text-slate-900 gap-2">
                <ChevronRight size={16} className="rotate-180" /> Change Address
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 sm:py-20 bg-white rounded-2xl sm:rounded-[3rem] shadow-sm border border-slate-50 px-4"
            >
              <div className="w-20 h-20 sm:w-32 sm:h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-10 shadow-inner">
                <CheckCircle2 size={40} className="sm:w-16 sm:h-16 text-emerald-500" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-black italic text-slate-900 mb-3 sm:mb-4 tracking-tighter leading-none uppercase">ORDER <span className="text-emerald-500 not-italic">PLACED!</span></h2>
              <p className="text-slate-400 font-medium mb-8 sm:mb-12 max-w-xs mx-auto text-sm">Your order has been placed and is being processed.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/orders')} className="h-12 sm:h-14 px-6 sm:px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-sm">
                  VIEW MY ORDERS <ShoppingBag size={16} />
                </Button>
                <Button onClick={() => navigate('/catalog')} variant="outline" className="h-12 sm:h-14 px-6 sm:px-10 rounded-2xl border-slate-200 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">
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

const ScanLine = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" />
  </svg>
);

export default Checkout;

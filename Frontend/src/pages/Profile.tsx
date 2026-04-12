import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Store, Mail, Phone, Lock, ShoppingBag, Plus, MapPin, X, Home, Briefcase, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

const Profile = () => {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    shopName: user?.shopName || "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddAddress = async () => {
    if (!addressForm.street || !addressForm.city || !addressForm.postalCode) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Street, city and postal code are required." });
      return;
    }
    setSavingAddress(true);
    try {
      const currentAddresses = user?.addresses || [];
      const updatedAddresses = [...currentAddresses, addressForm];
      const { data } = await api.put('/auth/profile', { addresses: updatedAddresses });
      login({ ...user, addresses: updatedAddresses, ...data });
      toast({ title: "Address Added", description: "New address saved to your profile." });
      setShowAddressModal(false);
      setAddressForm({ label: 'Home', fullName: '', phone: '', street: '', landmark: '', city: '', state: '', postalCode: '', isDefault: false });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to save address." });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', formData);
      login({ ...user, ...data });
      toast({
        title: "Profile Saved",
        description: "Your account settings have been successfully updated.",
      });
      setFormData(prev => ({ ...prev, password: "" }));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6 px-2 sm:px-0">
        <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">Account Settings</h1>
        
        {/* Address Modal */}
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
                  <h3 className="text-xl font-black italic text-slate-900 uppercase">Add <span className="text-primary not-italic">Address</span></h3>
                  <button onClick={() => setShowAddressModal(false)} className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    {['Home', 'Work', 'Other'].map(l => (
                      <button key={l} onClick={() => setAddressForm({ ...addressForm, label: l })}
                        className={`flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all ${
                          addressForm.label === l ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-400'
                        }`}>
                        {l === 'Home' ? <Home size={14} className="inline mr-1" /> : l === 'Work' ? <Briefcase size={14} className="inline mr-1" /> : null}{l}
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
                      className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        addressForm.isDefault ? 'bg-primary border-primary' : 'border-slate-300'
                      }`}
                    >
                      {addressForm.isDefault && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-sm font-bold text-slate-600">Set as default address</span>
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowAddressModal(false)} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
                  <Button onClick={handleAddAddress} disabled={savingAddress} className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90">
                    {savingAddress ? 'Saving...' : 'Save Address'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`grid grid-cols-1 ${!isAdmin ? 'lg:grid-cols-3' : ''} gap-8`}>
          <div className={`${!isAdmin ? 'lg:col-span-2' : ''} space-y-6`}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-200 bg-white p-8 space-y-6 "
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-primary text-white shadow-sm shrink-0">
                  <User className="h-7 w-7 sm:h-10 sm:w-10" />
                </div>
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">{user?.name || "Guest User"}</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mt-1">
                    <span className={`h-2 w-2 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                    {isAdmin ? "Shop Administrator" : "Customer Account"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                    <User className="h-4 w-4 text-rose" /> Full Name
                  </label>
                  <Input name="name" value={formData.name} onChange={handleInputChange} className="h-12 rounded-xl border-slate-200" />
                </div>
                {isAdmin && (
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                      <Store className="h-4 w-4 text-primary" /> Shop Name
                    </label>
                    <Input name="shopName" value={formData.shopName} onChange={handleInputChange} className="h-12 rounded-xl border-slate-200" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                    <Mail className="h-4 w-4 text-emerald" /> Email
                  </label>
                  <Input name="email" value={formData.email} onChange={handleInputChange} className="h-12 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                    <Phone className="h-4 w-4 text-amber" /> Mobile
                  </label>
                  <Input name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="+91 98765 43210" className="h-12 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                    <Lock className="h-4 w-4 text-violet" /> Update Password
                  </label>
                  <Input name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="•••••••• (leave blank to keep current)" className="h-12 rounded-xl border-slate-200" />
                </div>
              </div>

              <Button disabled={saving} onClick={handleSave} size="lg" className="w-full md:w-auto px-10 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-sm active:scale-95 transition-all">
                {saving ? "Saving..." : "Save Profile Updates"}
              </Button>
            </motion.div>

            {/* Saved Addresses */}
            {!isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl border border-slate-200 bg-white p-8 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Saved Addresses</h3>
                      <p className="text-xs text-slate-400 font-medium">{user?.addresses?.length || 0} address(es) saved</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowAddressModal(true)} variant="outline" className="h-9 gap-2 rounded-xl text-xs font-bold border-slate-200">
                    <Plus size={14} /> Add New
                  </Button>
                </div>

                {user?.addresses && user.addresses.length > 0 ? (
                  <div className="space-y-3">
                    {user.addresses.map((addr: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${
                        addr.isDefault ? 'border-primary/30 bg-primary/5' : 'border-slate-100 bg-slate-50'
                      }`}>
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                          addr.isDefault ? 'bg-primary text-white' : 'bg-white text-slate-400 border border-slate-200'
                        }`}>
                          {addr.label === 'Work' ? <Briefcase size={16} /> : <Home size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-slate-900">{addr.label}</p>
                            {addr.isDefault && <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Default</span>}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{addr.street}, {addr.city} {addr.postalCode}</p>
                          {addr.phone && <p className="text-xs text-slate-400 font-medium mt-0.5">{addr.phone}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MapPin size={32} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-sm font-bold text-slate-400">No addresses saved yet</p>
                    <p className="text-xs text-slate-300 mt-1">Add an address to speed up checkout</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {!isAdmin && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col items-center text-center"
              >
                <div className="h-20 w-20 rounded-[2rem] bg-orange-50 flex items-center justify-center mb-6 shadow-inner">
                  <ShoppingBag size={32} className="text-orange-500" />
                </div>
                <h3 className="font-heading text-lg sm:text-xl font-black italic text-slate-900 mb-3 tracking-tight uppercase leading-none">No orders <span className="text-orange-500 not-italic">yet.</span></h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-6 leading-relaxed max-w-[200px]">You haven't placed any orders yet. Browse our catalog and start shopping.</p>
                <Button onClick={() => navigate('/catalog')} className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-[10px] shadow-sm transition-all active:scale-95">Explore Catalog</Button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Profile;


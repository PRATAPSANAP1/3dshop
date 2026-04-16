import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Eye, EyeOff, ArrowRight, User as UserIcon, ShieldCheck, Sparkles, Key, Check, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";


const floatingShapes = [
  { size: 140, top: "10%", left: "5%", delay: 0, duration: 7 },
  { size: 80, top: "60%", left: "15%", delay: 1.5, duration: 5 },
  { size: 50, top: "30%", left: "80%", delay: 3, duration: 8 },
  { size: 100, top: "75%", left: "70%", delay: 0.5, duration: 6 },
  { size: 60, top: "45%", left: "40%", delay: 2, duration: 9 },
];

const Login = () => {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('mode') === 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'admin' | 'customer'>('customer');
  const [form, setForm] = useState({ name: '', email: '', password: '', shopName: '', mobile: '' });
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP & New Pass
  const [forgotData, setForgotData] = useState({ email: '', otp: '', newPassword: '' });

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setIsRegister(searchParams.get('mode') === 'register');
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotData.email });
      toast({ variant: "success", title: "OTP Sent", description: "Please check your registered contact/console" });
      setForgotStep(2);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', forgotData);
      toast({ variant: "success", title: "Success", description: "Password reset successful. Please login." });
      setShowForgot(false);
      setForgotStep(1);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Invalid OTP" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { ...form, role, shopName: role === 'customer' ? (form.name ? `${form.name}'s Shop` : 'Personal Shop') : form.shopName }
        : { email: form.email, password: form.password, role };

      const { data } = await api.post(endpoint, payload);

      let fullUser = data;
      try {
        const meRes = await api.get('/auth/me');
        if (meRes.data) {
          fullUser = { ...data, ...meRes.data, role: role };
        }
      } catch (err) {
        fullUser = { ...data, name: form.name || 'User', role: role };
      }

      login(fullUser);

      toast({ variant: "success", title: isRegister ? "Account Created" : "Welcome Back", description: `Signed in successfully` });
      navigate(role === 'admin' ? "/dashboard" : "/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.response?.data?.message || "Something went wrong"
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* ── LEFT PANEL (desktop only) ── */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 40%, #F97316 70%, #DC2626 100%)" }}
      >
        {floatingShapes.map((shape, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5 backdrop-blur-sm"
            style={{
              width: shape.size,
              height: shape.size,
              top: shape.top,
              left: shape.left,
            }}
            animate={{
              y: [0, -20, 0, 15, 0],
              x: [0, 10, -10, 5, 0],
              scale: [1, 1.05, 0.95, 1.02, 1],
            }}
            transition={{
              duration: shape.duration,
              delay: shape.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.2)_0%,transparent_50%)]" />

        <div className="max-w-md px-12 text-center text-white relative z-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100, damping: 12 }}
            className="mx-auto mb-10 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white/15 backdrop-blur-2xl shadow-sm border border-white/20"
          >
            <Store className="h-14 w-14" />
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="font-heading text-5xl font-extrabold tracking-tight leading-tight"
          >
            Smart<span className="font-light tracking-wide">Store</span>
          </motion.h1>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-6 text-lg text-white/70 font-medium leading-relaxed"
          >
            Your ultimate premium destination for immersive 3D shopping experiences and intelligent inventory management.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-10 flex items-center justify-center gap-3"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 text-xs font-bold tracking-wider">
              <Sparkles size={14} />
              AI-POWERED ANALYTICS
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-12 flex justify-center gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 rounded-full bg-white/30"
                animate={{ width: [6, 24, 6] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20 relative min-h-screen lg:min-h-0">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #EA580C 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-sm sm:max-w-md relative z-10"
        >
          <AnimatePresence mode="wait">
            {showForgot ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100/80 relative"
              >
                <button onClick={() => setShowForgot(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={18} />
                </button>

                <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                  {forgotStep === 1 ? "Reset Password" : "Enter OTP"}
                </h2>
                <p className="mt-2.5 text-slate-500 font-medium text-sm">
                  {forgotStep === 1 ? "We'll send a 6-digit code to your email" : "Set your new secure password"}
                </p>

                <form onSubmit={forgotStep === 1 ? handleForgotRequest : handleResetSubmit} className="mt-8 space-y-5">
                  {forgotStep === 1 ? (
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                      <Input 
                        type="email" 
                        value={forgotData.email} 
                        onChange={(e) => setForgotData({...forgotData, email: e.target.value})}
                        placeholder="name@example.com" 
                        className="h-12 rounded-xl" 
                        required 
                      />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 ml-1">6-Digit OTP</label>
                        <Input 
                          type="text" 
                          maxLength={6}
                          value={forgotData.otp} 
                          onChange={(e) => setForgotData({...forgotData, otp: e.target.value})}
                          placeholder="" 
                          className="h-12 rounded-xl text-center text-lg tracking-[0.5em] font-black" 
                          required 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                        <Input 
                          type="password" 
                          value={forgotData.newPassword} 
                          onChange={(e) => setForgotData({...forgotData, newPassword: e.target.value})}
                          placeholder="••••••••" 
                          className="h-12 rounded-xl" 
                          required 
                        />
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    className="h-12 w-full gap-2 rounded-xl font-bold shadow-sm"
                    style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)" }}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : (forgotStep === 1 ? "Send Reset Code" : "Update Password")}
                  </Button>
                  
                  <button type="button" onClick={() => { setShowForgot(false); setForgotStep(1); }} className="w-full text-center text-xs font-bold text-slate-400 py-2">
                    Wait, I remember my password!
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key={isRegister ? "register" : "login"}
                initial={{ opacity: 0, x: 30, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100/80 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-50 via-amber-50 to-transparent rounded-bl-[4rem] pointer-events-none" />

                <div className="relative z-10">
                  <h2 className="font-heading text-3xl font-bold text-slate-900 tracking-tight">
                    {isRegister ? "Start Your Journey" : "Welcome Back"}
                  </h2>

                  <div className="mt-8 flex p-1.5 bg-slate-100/80 rounded-2xl relative">
                    <motion.div
                      className="absolute inset-y-1.5 rounded-xl bg-white shadow-sm"
                      layout
                      style={{
                        width: "calc(50% - 6px)",
                        left: role === 'customer' ? '6px' : 'calc(50%)',
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors duration-300 font-bold text-sm relative z-10 ${role === 'customer' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      <UserIcon size={16} /> SHOPPER
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors duration-300 font-bold text-sm relative z-10 ${role === 'admin' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      <ShieldCheck size={16} /> ADMIN
                    </button>
                  </div>





                  <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <AnimatePresence>
                      {isRegister && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-5 overflow-hidden"
                        >
                          <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                            <Input name="name" value={form.name} onChange={handleInputChange} placeholder="John Doe" className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" required />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 ml-1">Mobile Number</label>
                            <Input name="mobile" value={form.mobile} onChange={handleInputChange} placeholder="937047xxx" className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" required />
                          </div>
                          {role === 'admin' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="space-y-1.5"
                            >
                              <label className="text-sm font-bold text-slate-700 ml-1">Shop/Organization Name</label>
                              <Input name="shopName" value={form.shopName} onChange={handleInputChange} placeholder="Luxe Collection" className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" required />
                            </motion.div>
                          )}
                          {role === 'customer' && (
                            <input type="hidden" name="shopName" value={form.name ? `${form.name}'s Shop` : "Personal Shop"} />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                      <Input type="email" name="email" value={form.email} onChange={handleInputChange} placeholder="name@example.com" className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" required />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-bold text-slate-700">Password</label>
                      </div>
                      <div className="relative group">
                        <Input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={form.password}
                          onChange={handleInputChange}
                          placeholder="••••••••"
                          className="h-12 rounded-xl border-slate-200 pr-12 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {!isRegister && (
                        <div className="flex justify-end pr-1">
                          <button 
                            type="button" 
                            onClick={() => { setShowForgot(true); setForgotData({...forgotData, email: form.email}); }}
                            className="text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors mt-1"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="h-12 w-full gap-2 rounded-xl font-bold shadow-sm transition-all active:scale-[0.97] relative overflow-hidden group"
                      style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)" }}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <>
                          {isRegister ? "Create Account" : "Sign In Now"}
                          <motion.div
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <ArrowRight className="h-5 w-5" />
                          </motion.div>
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-8 text-center">
                    <p className="text-slate-500 font-medium text-sm">
                      {isRegister ? "Already have an account?" : "New here?"}{" "}
                      <button
                        onClick={() => setIsRegister(!isRegister)}
                        className="font-extrabold text-primary hover:text-primary/80 transition-all decoration-2 underline-offset-4 hover:underline"
                      >
                        {isRegister ? "Sign in" : "Register here"}
                      </button>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>


        </motion.div>
      </div>
    </div>
  );
};

export default Login;

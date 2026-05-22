import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Store, ShieldCheck } from "lucide-react";

const JoinPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const token = params.get("token");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Decode token to check expiry client-side (no verify, just parse)
  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setTokenValid(payload.exp * 1000 > Date.now());
    } catch {
      setTokenValid(false);
    }
  }, [token]);

  const handleJoin = async () => {
    if (!name.trim() || !password.trim()) {
      toast({ variant: "destructive", title: "Required", description: "Name and password are required" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/join", { token, name, password });
      // Auto-login the new employee
      const loginRes = await api.post("/auth/login", { email: data.email, password });
      login(loginRes.data);
      toast({ title: "Welcome! 🎉", description: `You've joined as ${data.name}` });
      navigate("/employee-dashboard", { replace: true });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err?.response?.data?.message || "Could not join" });
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) return null;

  if (!token || tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-3">
          <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Invalid or Expired Link</p>
          <p className="text-sm text-slate-400 font-medium">Ask your admin to generate a new invite.</p>
          <Button onClick={() => navigate("/login")} variant="outline" className="mt-4">Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 w-full max-w-md space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)" }}>
            <Store size={22} />
          </div>
          <div>
            <h1 className="font-black text-xl text-slate-900 uppercase italic tracking-tighter leading-none">
              Join as <span className="text-orange-500">Employee</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Set up your account</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
          <p className="text-xs font-bold text-emerald-700">Valid invite link — your permissions are pre-configured.</p>
        </div>

        <div className="space-y-3">
          <Input placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" />
          <Input type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl" />
        </div>

        <Button
          onClick={handleJoin}
          disabled={loading}
          className="w-full h-12 rounded-xl bg-slate-900 text-white hover:bg-orange-500 font-black uppercase tracking-widest text-[11px] transition-all"
        >
          {loading ? "Joining..." : "Create Account & Join"}
        </Button>
      </motion.div>
    </div>
  );
};

export default JoinPage;

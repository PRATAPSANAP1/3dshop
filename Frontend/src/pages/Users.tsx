import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users as UsersIcon, Shield, Ban, CheckCircle, Search, Mail, Phone, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch users" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      const { data } = await api.put(`/auth/users/${userId}/block`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: data.isBlocked } : u));
      toast({ title: data.isBlocked ? 'User Blocked' : 'User Unblocked', description: data.message });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update user" });
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const { data } = await api.put(`/auth/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: data.role } : u));
      toast({ title: 'Role Updated', description: `User role changed to ${role}` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update role" });
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );



  return (
    <PageTransition>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">USER <span className="text-orange-500 not-italic">DIRECTORY</span></h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Manage platform members and access levels</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-12 h-12 rounded-2xl border-slate-200 shadow-sm shadow-slate-100/50 font-bold text-slate-700"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((user, idx) => (
              <motion.div
                key={user._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white rounded-[2.5rem] border p-8 shadow-sm hover:border-orange-100 transition-all group relative overflow-hidden ${
                  user.isBlocked ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'
                }`}
              >
                <div className={`absolute top-0 right-0 h-24 w-24 bg-gradient-to-br transition-all ${user.role === 'admin' ? 'from-amber-500/10 to-transparent' : 'from-orange-500/10 to-transparent'} opacity-0 group-hover:opacity-100 rounded-bl-[4rem]`}></div>

                <div className="flex items-center gap-5 mb-6 relative z-10">
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
                    user.isBlocked ? 'bg-rose-100 text-rose-400' : user.role === 'admin' ? 'bg-slate-900 text-amber-400' : user.role === 'employee' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'
                  }`}>
                    <UsersIcon size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black italic text-slate-900 leading-tight mb-1 truncate">{user.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`px-3 py-0.5 rounded-full border-none font-black uppercase tracking-[0.15em] text-[8px] italic ${
                        user.role === 'admin' ? 'bg-amber-400/20 text-amber-600' :
                        user.role === 'employee' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {user.role}
                      </Badge>
                      {user.isBlocked && (
                        <Badge className="bg-rose-100 text-rose-600 border-none text-[8px] font-black uppercase">Blocked</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Mail size={16} className="text-slate-300 shrink-0" />
                    <span className="text-sm font-bold truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Phone size={16} className="text-slate-300 shrink-0" />
                    <span className="text-sm font-bold">{user.mobile || '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Calendar size={16} className="text-slate-300 shrink-0" />
                    <span className="text-sm font-bold">Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  </div>
                  {user.shopName && (
                    <div className="flex items-center gap-3 text-slate-500">
                      <Shield size={16} className="text-slate-300 shrink-0" />
                      <span className="text-sm font-bold truncate">Shop: {user.shopName}</span>
                    </div>
                  )}
                </div>

                {/* Role Selector */}
                <div className="mb-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Role</label>
                  <div className="relative">
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user._id, e.target.value)}
                      className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 appearance-none outline-none focus:border-orange-400 transition-colors"
                    >
                      <option value="shopper">Shopper</option>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-slate-50 pt-5">
                  <Button
                    onClick={() => handleToggleBlock(user._id, user.isBlocked)}
                    className={`flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[9px] gap-2 transition-all active:scale-95 ${
                      user.isBlocked
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                        : 'bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600'
                    }`}
                  >
                    {user.isBlocked
                      ? <><CheckCircle size={14} /> Unblock</>  
                      : <><Ban size={14} /> Block Access</>
                    }
                  </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100">
                  <div className={`h-full ${
                    user.isBlocked ? 'bg-rose-400 w-full' :
                    user.role === 'admin' ? 'bg-amber-400 w-full' :
                    user.role === 'employee' ? 'bg-blue-400 w-3/4' :
                    'bg-emerald-400 w-1/4'
                  }`}></div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
};

export default Users;

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Shield, Trash2, Mail, Check, X, ChevronDown } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PERMISSION_LABELS, EmployeePermission } from "@/hooks/usePermission";

const ALL_PERMISSIONS: EmployeePermission[] = [
  'VIEW_ORDERS', 'UPDATE_DELIVERY_STATUS', 'USE_SCANNER',
  'VIEW_PRODUCTS', 'VIEW_DASHBOARD_STATS', 'MANAGE_INVENTORY_STOCK'
];

const Employees = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePerms, setInvitePerms] = useState<EmployeePermission[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editPerms, setEditPerms] = useState<EmployeePermission[]>([]);

  const shopId = (user as any)?.shopId;

  const fetchEmployees = async () => {
    if (!shopId) return;
    try {
      const { data } = await api.get(`/shops/${shopId}/employees`);
      setEmployees(data);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load employees" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, [shopId]);

  const handleInvite = async () => {
    if (!inviteEmail || invitePerms.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Email and at least one permission required" });
      return;
    }
    try {
      const { data } = await api.post(`/shops/${shopId}/employees/invite`, {
        email: inviteEmail, permissions: invitePerms
      });
      toast({ title: "Invite Sent ✅", description: `Invite link generated for ${inviteEmail}` });
      setInviteEmail("");
      setInvitePerms([]);
      // Copy link to clipboard
      navigator.clipboard.writeText(data.inviteLink);
      toast({ title: "Copied!", description: "Invite link copied to clipboard" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err?.response?.data?.message || "Could not invite" });
    }
  };

  const handleUpdatePerms = async () => {
    if (!editingUser) return;
    try {
      await api.patch(`/shops/${shopId}/employees/${editingUser._id}/permissions`, { permissions: editPerms });
      toast({ title: "Updated", description: "Permissions updated successfully" });
      setEditingUser(null);
      fetchEmployees();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update permissions" });
    }
  };

  const handleRemove = async (userId: string) => {
    if (!window.confirm("Are you sure you want to remove this employee?")) return;
    try {
      await api.delete(`/shops/${shopId}/employees/${userId}`);
      toast({ title: "Removed", description: "Employee removed from shop" });
      fetchEmployees();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove employee" });
    }
  };

  const togglePerm = (perm: EmployeePermission, list: EmployeePermission[], setter: (v: EmployeePermission[]) => void) => {
    setter(list.includes(perm) ? list.filter(p => p !== perm) : [...list, perm]);
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="page-loader" /></div>;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-10 py-6 px-4">
        <header>
          <h1 className="font-heading text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
            Team <span className="text-orange-500 not-italic">Management.</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{employees.length} employees</p>
        </header>

        {/* Invite Section */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <UserPlus size={20} className="text-orange-500" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 uppercase tracking-tight">Invite Employee</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Send an invite link via email</p>
            </div>
          </div>
          <Input
            placeholder="employee@email.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="h-12 rounded-xl"
          />
          <div className="flex flex-wrap gap-2">
            {ALL_PERMISSIONS.map(perm => (
              <button
                key={perm}
                onClick={() => togglePerm(perm, invitePerms, setInvitePerms)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  invitePerms.includes(perm)
                    ? "bg-orange-500 text-white"
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                }`}
              >{PERMISSION_LABELS[perm]}</button>
            ))}
          </div>
          <Button onClick={handleInvite} className="h-12 rounded-xl bg-slate-900 text-white hover:bg-orange-500 font-black uppercase tracking-widest text-[10px] gap-2 w-full sm:w-auto px-8">
            <Mail size={16} /> Generate Invite
          </Button>
        </div>

        {/* Employee List */}
        <div className="space-y-3">
          {employees.map((emp) => (
            <motion.div
              key={emp._id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {emp.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-sm text-slate-900 truncate">{emp.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold truncate">{emp.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {(emp.employeePermissions || []).map((p: string) => (
                  <Badge key={p} className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase bg-slate-50 text-slate-500 border-none">
                    {PERMISSION_LABELS[p as EmployeePermission] || p}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { setEditingUser(emp); setEditPerms(emp.employeePermissions || []); }}
                  className="h-9 px-3 rounded-xl bg-slate-50 text-slate-500 hover:bg-orange-50 hover:text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                >
                  <Shield size={14} /> Edit
                </button>
                <button
                  onClick={() => handleRemove(emp._id)}
                  className="h-9 px-3 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </motion.div>
          ))}
          {employees.length === 0 && (
            <div className="text-center py-16">
              <UserPlus size={40} className="mx-auto text-slate-200 mb-4" />
              <p className="text-sm font-bold text-slate-400">No employees yet. Send your first invite above.</p>
            </div>
          )}
        </div>

        {/* Edit Permissions Modal */}
        <AnimatePresence>
          {editingUser && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setEditingUser(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-black italic tracking-tighter text-slate-900 mb-1 uppercase">
                  Edit <span className="text-orange-500">Permissions</span>
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{editingUser.name} — {editingUser.email}</p>
                <div className="space-y-2 mb-8">
                  {ALL_PERMISSIONS.map(perm => (
                    <button
                      key={perm}
                      onClick={() => togglePerm(perm, editPerms, setEditPerms)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                        editPerms.includes(perm)
                          ? "bg-orange-50 border border-orange-200 text-orange-700"
                          : "bg-slate-50 border border-slate-100 text-slate-400"
                      }`}
                    >
                      <span className="text-xs font-bold">{PERMISSION_LABELS[perm]}</span>
                      {editPerms.includes(perm) ? <Check size={16} className="text-orange-500" /> : <X size={16} />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setEditingUser(null)} variant="ghost" className="flex-1 h-12 rounded-xl font-black uppercase text-[10px]">Cancel</Button>
                  <Button onClick={handleUpdatePerms} className="flex-1 h-12 rounded-xl bg-slate-900 text-white hover:bg-orange-500 font-black uppercase text-[10px]">Save Changes</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default Employees;

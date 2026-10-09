import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, Store, Users, ShoppingCart, Package, DollarSign,
  Shield, Trash2, Building2, UserCheck, UserX, ChevronDown,
  Activity, Zap, Search, X, RefreshCw
} from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ROLE_COLORS: Record<string, string> = {
  developer: "bg-violet-500 text-white",
  admin: "bg-orange-500 text-white",
  employee: "bg-blue-500 text-white",
  shopper: "bg-slate-200 text-slate-700",
};

const DeveloperDashboard = () => {
  const [tab, setTab] = useState<"overview" | "shops" | "users">("overview");
  const [stats, setStats] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingRole, setEditingRole] = useState<any>(null);
  const [assignShopModal, setAssignShopModal] = useState<any>(null);
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, shopsRes, usersRes] = await Promise.all([
        api.get("/developer/stats"),
        api.get("/developer/shops"),
        api.get("/developer/users"),
      ]);
      setStats(statsRes.data);
      setShops(shopsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load developer data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRoleUpdate = async (userId: string, role: string) => {
    try {
      await api.put(`/developer/users/${userId}/role`, { role });
      toast({ title: "Role Updated", description: `User role changed to ${role}` });
      setEditingRole(null);
      fetchAll();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update role" });
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      const { data } = await api.put(`/developer/users/${userId}/block`);
      toast({ title: data.message });
      fetchAll();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to toggle block" });
    }
  };

  const handleToggleShop = async (shopId: string) => {
    try {
      await api.put(`/developer/shops/${shopId}/toggle`);
      toast({ title: "Shop status toggled" });
      fetchAll();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to toggle shop" });
    }
  };

  const handleDeleteShop = async (shopId: string, name: string) => {
    if (!window.confirm(`Delete shop "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/developer/shops/${shopId}`);
      toast({ title: "Shop Deleted" });
      fetchAll();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete shop" });
    }
  };

  const handleAssignShop = async (userId: string, shopId: string | null) => {
    try {
      await api.put(`/developer/users/${userId}/shop`, { shopId });
      toast({ title: "Shop Assignment Updated" });
      setAssignShopModal(null);
      fetchAll();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to assign shop" });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const filteredShops = shops.filter(s =>
    s.displayName?.toLowerCase().includes(shopSearch.toLowerCase()) ||
    s.name?.toLowerCase().includes(shopSearch.toLowerCase())
  );

  const statCards = stats ? [
    { label: "Total Shops", value: stats.totalShops, icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Shops", value: stats.activeShops, icon: Activity, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Admins", value: stats.totalAdmins, icon: Shield, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Employees", value: stats.totalEmployees, icon: UserCheck, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Shoppers", value: stats.totalShoppers, icon: ShoppingCart, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Products", value: stats.totalProducts, icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "Revenue", value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
  ] : [];

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase leading-none flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg">
                <Code2 size={22} />
              </div>
              Developer <span className="text-violet-600 not-italic">Console.</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">System-wide management &amp; control center</p>
          </div>
          <Button onClick={fetchAll} disabled={loading} className="h-10 px-4 rounded-xl bg-slate-900 text-white hover:bg-violet-600 text-[10px] font-black uppercase gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
        </header>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["overview", "shops", "users"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                tab === t
                  ? "bg-violet-600 text-white shadow-md"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-violet-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ═══ OVERVIEW TAB ═══ */}
        {tab === "overview" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-violet-500/5 transition-all"
              >
                <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon size={20} className={s.color} />
                </div>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ═══ SHOPS TAB ═══ */}
        {tab === "shops" && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search shops..."
                value={shopSearch}
                onChange={e => setShopSearch(e.target.value)}
                className="h-12 pl-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShops.map((shop, i) => (
                <motion.div
                  key={shop._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Store size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-black text-sm text-slate-900">{shop.displayName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{shop.name}</p>
                      </div>
                    </div>
                    <Badge className={`text-[8px] font-black uppercase border-none ${shop.isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                      {shop.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold mb-4 space-y-1">
                    <p>Owner: {shop.ownerUserId?.name || "—"} ({shop.ownerUserId?.email || "—"})</p>
                    <p>Plan: <span className="uppercase text-violet-600">{shop.plan}</span></p>
                    <p>Created: {new Date(shop.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleShop(shop._id)}
                      className={`flex-1 h-9 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        shop.isActive
                          ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}
                    >
                      {shop.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDeleteShop(shop._id, shop.displayName)}
                      className="h-9 w-9 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ USERS TAB ═══ */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="h-12 pl-11 rounded-xl"
                />
              </div>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="h-12 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
              >
                <option value="all">All Roles</option>
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
                <option value="shopper">Shopper</option>
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-3">User</th>
                      <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-3">Role</th>
                      <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-3">Shop</th>
                      <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-3">Status</th>
                      <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 font-black text-xs shrink-0">
                              {u.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{u.name}</p>
                              <p className="text-[10px] text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {editingRole === u._id ? (
                            <select
                              defaultValue={u.role}
                              onChange={e => handleRoleUpdate(u._id, e.target.value)}
                              onBlur={() => setEditingRole(null)}
                              autoFocus
                              className="h-8 px-2 rounded-lg border border-violet-200 text-xs font-bold bg-white"
                            >
                              <option value="developer">Developer</option>
                              <option value="admin">Admin</option>
                              <option value="employee">Employee</option>
                              <option value="shopper">Shopper</option>
                            </select>
                          ) : (
                            <button onClick={() => setEditingRole(u._id)}>
                              <Badge className={`text-[9px] font-black uppercase border-none cursor-pointer hover:opacity-80 ${ROLE_COLORS[u.role] || ROLE_COLORS.shopper}`}>
                                {u.role}
                              </Badge>
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => setAssignShopModal(u)}
                            className="text-[10px] font-bold text-slate-500 hover:text-violet-600 transition-colors flex items-center gap-1"
                          >
                            {u.shopId?.displayName || u.shopId?.name || "None"}
                            <ChevronDown size={10} />
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <Badge className={`text-[9px] font-black uppercase border-none ${u.isBlocked ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                            {u.isBlocked ? "Blocked" : "Active"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleBlockUser(u._id)}
                            className={`h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                              u.isBlocked
                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            }`}
                          >
                            {u.isBlocked ? "Unblock" : "Block"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm font-bold text-slate-400">No users found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ ASSIGN SHOP MODAL ═══ */}
        <AnimatePresence>
          {assignShopModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setAssignShopModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-xl"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-black italic tracking-tighter text-slate-900 uppercase mb-1">
                  Assign <span className="text-violet-600">Shop</span>
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                  {assignShopModal.name} — {assignShopModal.email}
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
                  <button
                    onClick={() => handleAssignShop(assignShopModal._id, null)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-500 transition-all"
                  >
                    ✕ Remove Shop Assignment
                  </button>
                  {shops.map(s => (
                    <button
                      key={s._id}
                      onClick={() => handleAssignShop(assignShopModal._id, s._id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all text-xs font-bold ${
                        assignShopModal.shopId?._id === s._id || assignShopModal.shopId === s._id
                          ? "bg-violet-50 border border-violet-200 text-violet-700"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="font-black">{s.displayName}</span>
                      <span className="text-slate-400 ml-2">({s.name})</span>
                    </button>
                  ))}
                </div>
                <Button onClick={() => setAssignShopModal(null)} variant="ghost" className="w-full h-10 rounded-xl font-black uppercase text-[10px]">
                  Cancel
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default DeveloperDashboard;

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import SkeletonCard from "@/components/SkeletonCard";
import StatCard from "@/components/StatCard";
import api from "@/lib/api";
import { 
  ScrollText, Filter, Search, RotateCcw, 
  User, Database, ShieldAlert, Activity, FileText, ChevronRight, ChevronLeft
} from "lucide-react";

export default function AuditLogs() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const fetchLogs = async () => {
    try {
      const { data } = await api.get(`/audit-logs`, {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search,
          action: actionFilter,
          entityType: entityFilter
        }
      });
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/audit-logs/stats');
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch audit stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, search, actionFilter, entityFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  if (loading) return null;

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-emerald-500 bg-emerald-500/10 border-emerald-200';
    if (action.includes('UPDATE')) return 'text-amber-500 bg-amber-500/10 border-amber-200';
    if (action.includes('DELETE')) return 'text-rose-500 bg-rose-500/10 border-rose-200';
    if (action.includes('AUTH_LOGIN')) return 'text-blue-500 bg-blue-500/10 border-blue-200';
    return 'text-slate-500 bg-slate-100 border-slate-200';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ShieldAlert size={16} className="text-rose-500" />;
      case 'warning': return <Activity size={16} className="text-amber-500" />;
      default: return <FileText size={16} className="text-slate-400" />;
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8 max-w-7xl mx-auto px-4 pb-12">
        <header>
          <h1 className="font-heading text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            SYSTEM <span className="text-orange-500 not-italic">AUDIT.</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mt-1">Immutable Activity Ledgers</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard icon={Database} title="Total Records" value={stats?.totalLogs?.toLocaleString() || "0"} change="Lifetime logs" delay={0} accentColor="text-blue-500" accentBg="bg-blue-500/10" />
          <StatCard icon={Activity} title="Today's Activity" value={stats?.todayLogs?.toLocaleString() || "0"} change="Last 24 hours" delay={0.1} accentColor="text-emerald-500" accentBg="bg-emerald-500/10" />
          <StatCard icon={ShieldAlert} title="Critical Events" value={stats?.criticalLogs?.toLocaleString() || "0"} change="Requires attention" delay={0.2} accentColor="text-rose-500" accentBg="bg-rose-500/10" />
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search by user, description, or entity..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
             />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
             <select 
               value={entityFilter}
               onChange={(e) => { setEntityFilter(e.target.value); setPagination(p => ({...p, page: 1})); }}
               className="flex-1 md:w-40 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:border-orange-500"
             >
                <option value="">All Entities</option>
                <option value="Product">Product</option>
                <option value="Order">Order</option>
                <option value="User">User</option>
                <option value="ShopConfig">Configuration</option>
             </select>
             <button 
               onClick={() => { setSearch(""); setActionFilter(""); setEntityFilter(""); }}
               className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
               title="Reset Filters"
             >
                <RotateCcw size={16} />
             </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                      <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Event Label</th>
                      <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Actor</th>
                      <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Target Entity</th>
                      <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Details</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   <AnimatePresence>
                      {logs.map((log: any, i: number) => (
                         <motion.tr 
                           key={log._id}
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: i * 0.02 }}
                           className="hover:bg-slate-50/50 transition-colors group"
                         >
                            <td className="p-5 whitespace-nowrap">
                               <div className="flex items-center gap-3">
                                  {getSeverityIcon(log.severity)}
                                  <div>
                                     <p className="text-sm font-bold text-slate-800">{new Date(log.createdAt).toLocaleDateString()}</p>
                                     <p className="text-[10px] font-black uppercase text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="p-5">
                               <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${getActionColor(log.action)}`}>
                                  {log.action.replace('_', ' ')}
                               </span>
                            </td>
                            <td className="p-5">
                               <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                                     <User size={14} />
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-slate-800">{log.userName}</p>
                                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{log.userRole}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="p-5">
                               {log.entityName ? (
                                  <div>
                                     <p className="text-sm font-bold text-slate-700">{log.entityName}</p>
                                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{log.entityType}</p>
                                  </div>
                               ) : (
                                  <span className="text-slate-300 italic text-sm">System</span>
                               )}
                            </td>
                            <td className="p-5 max-w-xs truncate text-sm font-medium text-slate-600" title={log.description}>
                               {log.description}
                            </td>
                         </motion.tr>
                      ))}
                      {logs.length === 0 && (
                         <tr>
                            <td colSpan={5} className="p-10 text-center">
                               <div className="flex flex-col items-center justify-center text-slate-400">
                                  <ScrollText size={32} className="mb-3 opacity-20" />
                                  <p className="text-sm font-bold">No audit trails found</p>
                                  <p className="text-[10px] font-black uppercase tracking-widest mt-1">Try adjusting limits</p>
                               </div>
                            </td>
                         </tr>
                      )}
                   </AnimatePresence>
                </tbody>
             </table>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Page {pagination.page} of {pagination.pages} <span className="mx-2 opacity-30">|</span> Total: {pagination.total}
             </div>
             <div className="flex gap-2">
                <button 
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-orange-500 hover:text-orange-500 disabled:opacity-50 disabled:hover:border-slate-200 transition-colors"
                >
                   <ChevronLeft size={16} />
                </button>
                <button 
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-orange-500 hover:text-orange-500 disabled:opacity-50 disabled:hover:border-slate-200 transition-colors"
                >
                   <ChevronRight size={16} />
                </button>
             </div>
          </div>
        </div>

      </div>
    </PageTransition>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Check, CheckCheck, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";

import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load notifications" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not mark as read" });
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not mark all as read" });
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;



  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold text-warning">Notifications</h1>
            {unreadCount > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2 border-warning text-warning hover:bg-warning/10">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate('/catalog')}
                className={`cursor-pointer flex items-start gap-4 rounded-xl border-l-4 border p-4 transition-all ${
                  n.isRead
                    ? "border-border border-l-border bg-card hover:bg-slate-50"
                    : n.type === "critical"
                    ? "border-rose/30 border-l-rose bg-rose/5"
                    : "border-warning/30 border-l-warning bg-warning/5"
                }`}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  n.type === "critical" ? "bg-rose/10 text-rose" :
                  n.type === "lowStock" ? "bg-amber/10 text-amber" :
                  "bg-teal/10 text-teal"
                }`}>
                  {n.type === "critical" ? <AlertTriangle className="h-4 w-4" /> :
                   n.type === "lowStock" ? <Package className="h-4 w-4" /> :
                   <Bell className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                {!n.isRead && (
                  <button onClick={(e) => { e.stopPropagation(); markRead(n._id); }} className="text-muted-foreground hover:text-warning">
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Notifications;

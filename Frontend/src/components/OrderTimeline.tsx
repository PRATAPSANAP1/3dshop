import { motion } from "framer-motion";
import { CheckCircle2, Clock, Truck, Package, RotateCcw, AlertTriangle } from "lucide-react";

interface StatusHistory {
  status: string;
  timestamp: string;
  comment?: string;
}

interface OrderTimelineProps {
  history: StatusHistory[];
  currentStatus: string;
}

const statusMap: any = {
  'Ordered': { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Order Placed' },
  'Packed': { icon: Package, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Packed & Ready' },
  'Shipped': { icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Out for Delivery' },
  'Delivered': { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Delivered' },
  'Cancelled': { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Cancelled' },
  'ReturnRequested': { icon: RotateCcw, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Return Requested' },
  'ReturnApproved': { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Return Approved' },
  'ReturnRefunded': { icon: RotateCcw, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Refunded' },
  'Returned': { icon: RotateCcw, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Returned' },
};

const OrderTimeline = ({ history, currentStatus }: OrderTimelineProps) => {
  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
      {history.map((item, idx) => {
        const config = statusMap[item.status] || { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50', label: item.status };
        return (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-all duration-500 ${config.bg} ${config.color} group-hover:scale-110 z-10`}>
               <config.icon size={18} />
            </div>

            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:border-slate-200 transition-all duration-300">
               <div className="flex items-center justify-between mb-1">
                  <div className={`font-black italic text-sm tracking-tighter uppercase ${config.color}`}>{config.label}</div>
                  <time className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</time>
               </div>
               <div className="text-slate-500 text-xs font-medium italic mb-2">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </div>
               {item.comment && (
                 <p className="text-slate-400 text-[10px] bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 font-bold leading-relaxed">
                   {item.comment}
                 </p>
               )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default OrderTimeline;

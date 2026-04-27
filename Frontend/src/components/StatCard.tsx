import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  delay?: number;
  accentColor?: string;
  accentBg?: string;
  onClick?: () => void;
}

const StatCard = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  delay = 0,
  accentColor = "text-primary",
  accentBg = "bg-primary/10",
  onClick,
}: StatCardProps) => {
  const borderColorMap: Record<string, string> = {
    'text-primary': '#EA580C',
    'text-orange-500': '#EA580C',
    'text-amber-600': '#D97706',
    'text-emerald': '#10B981',
    'text-emerald-500': '#10B981',
    'text-rose': '#F43F5E',
    'text-rose-500': '#F43F5E',
    'text-amber': '#F59E0B',
    'text-slate-600': '#475569',
    'text-blue-500': '#3B82F6',
  };
  const borderHex = borderColorMap[accentColor] || '#EA580C';

  return (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
    whileTap={onClick ? { scale: 0.98 } : {}}
    transition={{ delay, duration: 0.4, ease: "easeOut" }}
    onClick={onClick}
    className={`stat-card group border-l-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-l-primary transition-all duration-300' : ''}`}
    style={{ borderLeftColor: borderHex }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 font-heading text-3xl font-bold text-foreground">{value}</p>
        {change && (
          <p className={`mt-1 text-sm font-medium ${
            changeType === "positive" ? "text-success" :
            changeType === "negative" ? "text-destructive" :
            "text-muted-foreground"
          }`}>
            {change}
          </p>
        )}
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentBg} ${accentColor} transition-all duration-300`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </motion.div>
  );
};

export default StatCard;

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  tone?: "primary" | "accent" | "success" | "info" | "warning";
}

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/20 text-accent-foreground",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
};

export const StatCard = ({ icon: Icon, label, value, unit, delta, tone = "primary" }: Props) => (
  <div className="stat-tile">
    <div className="flex items-start justify-between">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", toneClasses[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      {delta && (
        <div className="flex items-center gap-1 text-xs text-success font-semibold">
          <TrendingUp className="h-3 w-3" /> {delta}
        </div>
      )}
    </div>
    <div className="mt-4">
      <div className="text-2xl font-display font-bold tracking-tight">
        {value}{unit && <span className="text-sm font-medium text-muted-foreground ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  </div>
);

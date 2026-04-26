import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  variant?: "default" | "primary" | "danger" | "warning" | "accent";
  subtitle?: string;
}

const VARIANTS = {
  default: {
    bg: "var(--color-surface)",
    iconBg: "var(--color-surface-2)",
    iconColor: "var(--color-text-muted)",
    valueColor: "var(--color-text)",
  },
  primary: {
    bg: "var(--color-primary)",
    iconBg: "rgba(255,255,255,0.15)",
    iconColor: "white",
    valueColor: "white",
  },
  danger: {
    bg: "var(--color-danger-50)",
    iconBg: "rgba(183,28,28,0.1)",
    iconColor: "var(--color-danger)",
    valueColor: "var(--color-danger)",
  },
  warning: {
    bg: "var(--color-warning-50)",
    iconBg: "rgba(245,127,23,0.1)",
    iconColor: "var(--color-warning)",
    valueColor: "var(--color-warning)",
  },
  accent: {
    bg: "var(--color-surface)",
    iconBg: "rgba(201,149,42,0.1)",
    iconColor: "var(--color-accent)",
    valueColor: "var(--color-accent)",
  },
};

export default function StatCard({ label, value, icon: Icon, variant = "default", subtitle }: StatCardProps) {
  const v = VARIANTS[variant];
  const isLight = variant === "default" || variant === "danger" || variant === "warning" || variant === "accent";

  return (
    <div
      className="card flex items-center gap-3"
      style={{ background: v.bg, boxShadow: isLight ? "var(--shadow-card)" : "none" }}
    >
      {Icon && (
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 44, height: 44, background: v.iconBg }}
        >
          <Icon size={20} color={v.iconColor} strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0">
        <p
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 500,
            color: variant === "primary" ? "rgba(255,255,255,0.8)" : "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </p>
        <p
          className="amount truncate"
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 700,
            color: v.valueColor,
            lineHeight: 1.2,
          }}
        >
          {value}
        </p>
        {subtitle && (
          <p style={{ fontSize: "var(--text-xs)", color: variant === "primary" ? "rgba(255,255,255,0.7)" : "var(--color-text-light)" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

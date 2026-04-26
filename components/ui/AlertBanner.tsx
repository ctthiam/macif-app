import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface Alert {
  id: number;
  label: string;
  value: string;
}

interface AlertBannerProps {
  alerts: Alert[];
  onViewAll?: () => void;
}

export default function AlertBanner({ alerts, onViewAll }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!alerts.length || dismissed) return null;

  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2.5 tap-feedback"
      style={{
        background: "var(--color-danger-50)",
        border: "1px solid rgba(183,28,28,0.15)",
        cursor: onViewAll ? "pointer" : "default",
      }}
      onClick={onViewAll}
    >
      <AlertTriangle size={16} color="var(--color-danger)" strokeWidth={2.5} className="shrink-0" />
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-danger)", fontWeight: 600, flex: 1 }}>
        {alerts.length} produit{alerts.length > 1 ? "s" : ""} en rupture de stock
      </p>
      <button
        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
        style={{ color: "var(--color-danger)", opacity: 0.6 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

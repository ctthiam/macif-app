"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean | (() => void);
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, back, action }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
      style={{
        background: "var(--color-surface)",
        boxShadow: "0 1px 0 var(--color-border)",
        minHeight: 56,
      }}
    >
      {back && (
        <button
          onClick={() => typeof back === "function" ? back() : router.back()}
          className="flex items-center justify-center rounded-xl tap-feedback"
          style={{ width: 40, height: 40, background: "var(--color-surface-2)", flexShrink: 0 }}
        >
          <ArrowLeft size={20} color="var(--color-text)" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: 700,
            color: "var(--color-text)",
            lineHeight: 1.2,
          }}
          className="truncate"
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

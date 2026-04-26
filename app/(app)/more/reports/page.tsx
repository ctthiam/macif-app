"use client";
import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, Package, BarChart2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA } from "@/lib/api";

interface MonthlyReport {
  year: number;
  month: number;
  totalRevenue: number;
  totalSales: number;
  cashRevenue: number;
  waveRevenue: number;
  orangeMoneyRevenue: number;
  creditRevenue: number;
  topProducts: Array<{ name: string; unit: string; totalQty: number; totalRevenue: number }>;
}

interface StockValue {
  totalValue: number;
  totalProducts: number;
  lowStockCount: number;
}

const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

const PM_CONFIG = [
  { key: "cashRevenue", label: "Espèces", color: "#1B5E20" },
  { key: "waveRevenue", label: "Wave", color: "#00B9FF" },
  { key: "orangeMoneyRevenue", label: "Orange Money", color: "#FF6600" },
  { key: "creditRevenue", label: "Crédit", color: "#B71C1C" },
];

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [prevReport, setPrevReport] = useState<MonthlyReport | null>(null);
  const [stockValue, setStockValue] = useState<StockValue | null>(null);
  const [loading, setLoading] = useState(true);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/api/reports/monthly?year=${year}&month=${month}`),
      api.get(`/api/reports/monthly?year=${prevYear}&month=${prevMonth}`),
      api.get("/api/reports/stock-value"),
    ])
      .then(([cur, prev, stock]) => {
        setReport(cur.data.data);
        setPrevReport(prev.data.data);
        setStockValue(stock.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]); // eslint-disable-line

  const navigate = (dir: -1 | 1) => {
    const newMonth = month + dir;
    if (newMonth < 1) { setMonth(12); setYear((y) => y - 1); }
    else if (newMonth > 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth(newMonth);
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const revenue = Number(report?.totalRevenue ?? 0);
  const prevRevenue = Number(prevReport?.totalRevenue ?? 0);
  const diff = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null;

  // Barre max pour top produits
  const maxRevenue = Math.max(...(report?.topProducts?.map((p) => Number(p.totalRevenue)) ?? [1]));

  return (
    <div>
      <PageHeader title="Rapports" back />

      <div className="page-content space-y-4">
        {/* Sélecteur mois */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center rounded-xl tap-feedback"
            style={{ width: 44, height: 44, background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <ChevronLeft size={20} color="var(--color-text-muted)" />
          </button>
          <div className="text-center">
            <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)" }}>
              {MONTHS_FR[month - 1]}
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{year}</p>
          </div>
          <button
            onClick={() => navigate(1)}
            disabled={isCurrentMonth}
            className="flex items-center justify-center rounded-xl tap-feedback"
            style={{
              width: 44,
              height: 44,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              opacity: isCurrentMonth ? 0.3 : 1,
            }}
          >
            <ChevronRight size={20} color="var(--color-text-muted)" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton rounded-2xl" style={{ height: 80 }} />)}
          </div>
        ) : (
          <>
            {/* CA principal */}
            <div
              className="rounded-2xl px-4 py-4"
              style={{ background: "var(--color-primary)", color: "white" }}
            >
              <p style={{ fontSize: "var(--text-xs)", opacity: 0.8, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Chiffre d'affaires
              </p>
              <p className="amount" style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>
                {formatFCFA(revenue)}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div style={{ fontSize: "var(--text-xs)", opacity: 0.8 }}>
                  {report?.totalSales ?? 0} vente{(report?.totalSales ?? 0) > 1 ? "s" : ""}
                </div>
                {diff !== null && (
                  <div
                    className="flex items-center gap-1 rounded-lg px-2 py-0.5"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  >
                    {diff >= 0 ? (
                      <TrendingUp size={12} color="white" />
                    ) : (
                      <TrendingDown size={12} color="white" />
                    )}
                    <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>
                      {diff >= 0 ? "+" : ""}{diff}% vs mois préc.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Répartition par mode de paiement */}
            {report && (
              <section className="card">
                <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                  Par mode de paiement
                </p>
                <div className="space-y-3">
                  {PM_CONFIG.map(({ key, label, color }) => {
                    const val = Number(report[key as keyof MonthlyReport] ?? 0);
                    const pct = revenue > 0 ? (val / revenue) * 100 : 0;
                    if (val === 0) return null;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
                            {label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                              {Math.round(pct)}%
                            </span>
                            <span className="amount" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color }}>
                              {formatFCFA(val)}
                            </span>
                          </div>
                        </div>
                        <div className="rounded-full overflow-hidden" style={{ height: 6, background: `${color}18` }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Top produits */}
            {report?.topProducts && report.topProducts.length > 0 && (
              <section>
                <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                  Top produits
                </p>
                <div className="card space-y-4">
                  {report.topProducts.map((p, idx) => {
                    const pct = (Number(p.totalRevenue) / maxRevenue) * 100;
                    return (
                      <div key={p.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="flex items-center justify-center rounded-lg shrink-0 font-bold"
                              style={{
                                width: 22,
                                height: 22,
                                background: idx === 0 ? "rgba(201,149,42,0.15)" : "var(--color-surface-2)",
                                color: idx === 0 ? "var(--color-accent)" : "var(--color-text-muted)",
                                fontSize: 11,
                              }}
                            >
                              {idx + 1}
                            </span>
                            <span className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
                              {p.name}
                            </span>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="amount" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)" }}>
                              {formatFCFA(Number(p.totalRevenue))}
                            </p>
                            <p style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
                              {Number(p.totalQty)} {p.unit}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-full overflow-hidden" style={{ height: 4, background: "var(--color-primary-10)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: "var(--color-primary)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Valeur du stock */}
            {stockValue && (
              <section className="card">
                <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                  Valeur du stock
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Valeur totale", value: formatFCFA(stockValue.totalValue), color: "var(--color-primary)" },
                    { label: "Produits", value: String(stockValue.totalProducts), color: "var(--color-text)" },
                    { label: "Alertes", value: String(stockValue.lowStockCount), color: stockValue.lowStockCount > 0 ? "var(--color-danger)" : "var(--color-text-muted)" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <p className="amount" style={{ fontSize: "var(--text-base)", fontWeight: 700, color }}>{value}</p>
                      <p style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 2 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Mois précédent comparaison */}
            {prevReport && prevRevenue > 0 && (
              <div
                className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <BarChart2 size={18} color="var(--color-text-muted)" />
                <div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {MONTHS_FR[prevMonth - 1]} {prevYear}
                  </p>
                  <p className="amount" style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text)" }}>
                    {formatFCFA(prevRevenue)} · {prevReport.totalSales} ventes
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

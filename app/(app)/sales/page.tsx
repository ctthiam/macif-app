"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, ShoppingCart, Filter, ChevronRight, TrendingUp,
  Calendar, CheckCircle2,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA, formatDate, formatTime } from "@/lib/api";

interface Sale {
  id: number;
  reference: string;
  netAmount: number;
  paymentMethod: string;
  paidAmount: number;
  creditAmount: number;
  createdAt: string;
  customer: { name: string; phone: string } | null;
  user: { name: string };
  items: Array<{ product: { name: string; unit: string } }>;
}

interface SalesResponse {
  items: Sale[];
  total: number;
  page: number;
  pages: number;
}

const PM_LABELS: Record<string, string> = {
  cash: "Espèces",
  wave: "Wave",
  orange_money: "O. Money",
  credit: "Crédit",
  mixed: "Mixte",
};

const PM_COLORS: Record<string, string> = {
  cash: "#1B5E20",
  wave: "#00B9FF",
  orange_money: "#FF6600",
  credit: "#B71C1C",
  mixed: "#C9952A",
};

const PERIOD_OPTIONS = [
  { value: "today", label: "Auj." },
  { value: "week", label: "7 jours" },
  { value: "month", label: "Ce mois" },
  { value: "all", label: "Tout" },
];

const PM_FILTER_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "cash", label: "Espèces" },
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "O. Money" },
  { value: "credit", label: "Crédit" },
];

function getDateRange(period: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === "today") {
    const today = fmt(now);
    return { startDate: today, endDate: today };
  }
  if (period === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { startDate: fmt(start), endDate: fmt(now) };
  }
  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: fmt(start), endDate: fmt(now) };
  }
  return {};
}

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [period, setPeriod] = useState("today");
  const [pmFilter, setPmFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (p: number, reset: boolean) => {
      if (p === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const range = getDateRange(period);
        const params = new URLSearchParams({ page: String(p), limit: "20" });
        if (range.startDate) params.set("startDate", range.startDate);
        if (range.endDate) params.set("endDate", range.endDate);
        if (pmFilter) params.set("paymentMethod", pmFilter);

        const salesRes = await api.get<{ data: SalesResponse }>(`/api/sales?${params}`);

        const data = salesRes.data.data;
        setSales((prev) => (reset ? data.items : [...prev, ...data.items]));
        setTotalPages(data.pages);
        setTotalCount(data.total);

        // Accurate total: use period summary (no PM filter), else aggregate page items
        if (!pmFilter && period !== "all") {
          const periodMap: Record<string, string> = { today: "today", week: "week", month: "month" };
          try {
            const sumRes = await api.get(`/api/sales/summary?period=${periodMap[period]}`);
            setTotalAmount(sumRes.data.data?.total ?? 0);
          } catch {
            setTotalAmount((prev) =>
              reset
                ? data.items.reduce((s, i) => s + Number(i.netAmount), 0)
                : prev + data.items.reduce((s, i) => s + Number(i.netAmount), 0)
            );
          }
        } else {
          setTotalAmount((prev) =>
            reset
              ? data.items.reduce((s, i) => s + Number(i.netAmount), 0)
              : prev + data.items.reduce((s, i) => s + Number(i.netAmount), 0)
          );
        }
      } catch {
        //
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [period, pmFilter] // eslint-disable-line
  );

  useEffect(() => {
    setPage(1);
    load(1, true);
  }, [period, pmFilter]); // eslint-disable-line

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      const next = page + 1;
      setPage(next);
      load(next, false);
    }
  };

  // Group by date
  const grouped: Record<string, Sale[]> = {};
  sales.forEach((s) => {
    const key = formatDate(s.createdAt);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  return (
    <div>
      <PageHeader
        title="Historique"
        subtitle={loading ? "…" : `${totalCount} vente${totalCount > 1 ? "s" : ""}`}
        action={
          <button
            onClick={() => router.push("/sales/new")}
            className="flex items-center gap-1.5 rounded-xl px-3 tap-feedback"
            style={{
              height: 36,
              background: "var(--color-primary)",
              color: "white",
              fontWeight: 700,
              fontSize: "var(--text-sm)",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Vente
          </button>
        }
      />

      <div className="page-content space-y-4">
        {/* Résumé rapide */}
        {!loading && (
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: "var(--color-primary)", color: "white" }}
          >
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ width: 44, height: 44, background: "rgba(255,255,255,0.15)" }}
            >
              <TrendingUp size={20} color="white" />
            </div>
            <div>
              <p style={{ fontSize: "var(--text-xs)", opacity: 0.8, fontWeight: 500 }}>
                Total de la période
              </p>
              <p className="amount" style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>
                {formatFCFA(totalAmount)}
              </p>
            </div>
          </div>
        )}

        {/* Filtres période */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className="flex items-center gap-1.5 rounded-xl px-3 shrink-0 tap-feedback"
              style={{
                height: 36,
                fontWeight: 600,
                fontSize: "var(--text-sm)",
                background: period === opt.value ? "var(--color-primary)" : "var(--color-surface)",
                color: period === opt.value ? "white" : "var(--color-text-muted)",
                border: `1px solid ${period === opt.value ? "transparent" : "var(--color-border)"}`,
              }}
            >
              {period === opt.value && <Calendar size={13} />}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filtres paiement */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {PM_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPmFilter(opt.value)}
              className="flex items-center gap-1.5 rounded-xl px-3 shrink-0 tap-feedback"
              style={{
                height: 32,
                fontWeight: 600,
                fontSize: "var(--text-xs)",
                background:
                  pmFilter === opt.value
                    ? opt.value
                      ? `${PM_COLORS[opt.value]}15`
                      : "var(--color-primary-10)"
                    : "var(--color-surface)",
                color:
                  pmFilter === opt.value
                    ? opt.value
                      ? PM_COLORS[opt.value]
                      : "var(--color-primary)"
                    : "var(--color-text-muted)",
                border: `1px solid ${
                  pmFilter === opt.value
                    ? opt.value
                      ? `${PM_COLORS[opt.value]}30`
                      : "var(--color-primary)"
                    : "var(--color-border)"
                }`,
              }}
            >
              {pmFilter === opt.value && opt.value && <Filter size={11} />}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton rounded-2xl" style={{ height: 72 }} />
            ))}
          </div>
        ) : sales.length === 0 ? (
          <div className="card text-center py-12">
            <ShoppingCart
              size={40}
              strokeWidth={1.2}
              className="mx-auto mb-3 opacity-30"
              color="var(--color-text-muted)"
            />
            <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text)" }}>
              Aucune vente
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: 4 }}>
              {pmFilter
                ? "Essayez un autre mode de paiement"
                : "Aucune vente pour cette période"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([date, daySales]) => {
              const dayTotal = daySales.reduce((s, i) => s + Number(i.netAmount), 0);
              return (
                <section key={date}>
                  <div className="flex items-center justify-between mb-2">
                    <p
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: 700,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {date}
                    </p>
                    <p
                      className="amount"
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: 700,
                        color: "var(--color-primary)",
                      }}
                    >
                      {formatFCFA(dayTotal)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {daySales.map((sale) => (
                      <button
                        key={sale.id}
                        onClick={() => router.push(`/sales/${sale.id}`)}
                        className="card w-full flex items-center gap-3 text-left tap-feedback"
                        style={{ padding: "0.75rem" }}
                      >
                        <div
                          className="flex items-center justify-center rounded-xl shrink-0"
                          style={{
                            width: 42,
                            height: 42,
                            background: `${PM_COLORS[sale.paymentMethod]}12`,
                          }}
                        >
                          <ShoppingCart size={18} color={PM_COLORS[sale.paymentMethod]} strokeWidth={2} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className="truncate"
                            style={{
                              fontSize: "var(--text-sm)",
                              fontWeight: 600,
                              color: "var(--color-text)",
                            }}
                          >
                            {sale.customer?.name ??
                              (sale.items?.[0]?.product?.name
                                ? sale.items[0].product.name +
                                  (sale.items.length > 1 ? ` +${sale.items.length - 1}` : "")
                                : sale.reference)}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="rounded-lg px-1.5 py-0.5"
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: `${PM_COLORS[sale.paymentMethod]}15`,
                                color: PM_COLORS[sale.paymentMethod],
                              }}
                            >
                              {PM_LABELS[sale.paymentMethod]}
                            </span>
                            {sale.creditAmount > 0 && (
                              <span
                                className="rounded-lg px-1.5 py-0.5"
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  background: "rgba(183,28,28,0.1)",
                                  color: "#B71C1C",
                                }}
                              >
                                Crédit {formatFCFA(Number(sale.creditAmount))}
                              </span>
                            )}
                            <span
                              style={{ fontSize: "var(--text-xs)", color: "var(--color-text-light)" }}
                            >
                              {formatTime(sale.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <p
                            className="amount"
                            style={{
                              fontSize: "var(--text-base)",
                              fontWeight: 700,
                              color: "var(--color-text)",
                            }}
                          >
                            {formatFCFA(Number(sale.netAmount))}
                          </p>
                          <ChevronRight size={14} color="var(--color-text-light)" />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Load more */}
            {page < totalPages && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full rounded-2xl py-3 tap-feedback"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-primary)",
                  fontWeight: 600,
                  fontSize: "var(--text-sm)",
                }}
              >
                {loadingMore ? "Chargement…" : `Voir plus (${totalCount - sales.length} restantes)`}
              </button>
            )}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => router.push("/sales/new")}>
        <Plus size={20} strokeWidth={2.5} />
        Nouvelle vente
      </button>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, ShoppingCart, Wallet, CreditCard,
  Plus, ChevronRight, Package,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA, formatTime } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

interface DashboardData {
  todayRevenue: number;
  todaySalesCount: number;
  cashBalance: number;
  totalCredits: number;
  lowStockCount: number;
  recentSales: Array<{
    id: number;
    reference: string;
    netAmount: number;
    paymentMethod: string;
    createdAt: string;
    items: Array<{ product: { name: string } }>;
  }>;
}

const PM_LABELS: Record<string, string> = {
  cash: "Espèces",
  wave: "Wave",
  orange_money: "Orange Money",
  credit: "Crédit",
  mixed: "Mixte",
};

const PM_COLORS: Record<string, string> = {
  cash: "var(--color-primary)",
  wave: "#00B9FF",
  orange_money: "#FF6600",
  credit: "var(--color-danger)",
  mixed: "var(--color-accent)",
};

export default function DashboardPage() {
  const router = useRouter();
  const { shop, user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Intl.DateTimeFormat("fr-SN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, salesRes] = await Promise.all([
          api.get("/api/reports/dashboard"),
          api.get("/api/sales?limit=5"),
        ]);
        setData({
          ...dashRes.data.data,
          recentSales: salesRes.data.data?.items ?? [],
        });
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const todayRevenue = data?.todayRevenue ?? 0;
  const todaySalesCount = data?.todaySalesCount ?? 0;
  const cashBalance = data?.cashBalance ?? 0;
  const totalCredits = data?.totalCredits ?? 0;
  const lowStockCount = data?.lowStockCount ?? 0;
  const recentSales = data?.recentSales ?? [];

  return (
    <div>
      <PageHeader
        title={shop?.name ?? "MACIF"}
        subtitle={today.charAt(0).toUpperCase() + today.slice(1)}
        action={
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 36,
              height: 36,
              background: "var(--color-primary)",
              color: "white",
              fontWeight: 700,
              fontSize: "var(--text-sm)",
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? "G"}
          </div>
        }
      />

      <div className="page-content space-y-4">
        {/* CA Principal */}
        <StatCard
          label="Chiffre d'affaires du jour"
          value={loading ? "…" : formatFCFA(todayRevenue)}
          icon={TrendingUp}
          variant="primary"
          subtitle={loading ? "" : `${todaySalesCount} vente${todaySalesCount > 1 ? "s" : ""} aujourd'hui`}
        />

        {/* Stats secondaires */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Caisse"
            value={loading ? "…" : formatFCFA(cashBalance)}
            icon={Wallet}
            variant="default"
          />
          <StatCard
            label="Créances"
            value={loading ? "…" : formatFCFA(totalCredits)}
            icon={CreditCard}
            variant={totalCredits > 0 ? "warning" : "default"}
          />
        </div>

        {/* Alerte rupture */}
        {lowStockCount > 0 && (
          <button
            onClick={() => router.push("/stock?filter=low")}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left tap-feedback"
            style={{ background: "var(--color-danger-50)", border: "1px solid rgba(183,28,28,0.15)" }}
          >
            <div
              className="flex items-center justify-center rounded-lg shrink-0"
              style={{ width: 36, height: 36, background: "rgba(183,28,28,0.1)" }}
            >
              <Package size={18} color="var(--color-danger)" />
            </div>
            <div className="flex-1">
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-danger)" }}>
                {lowStockCount} produit{lowStockCount > 1 ? "s" : ""} en rupture
              </p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", opacity: 0.8 }}>
                Touchez pour voir la liste
              </p>
            </div>
            <ChevronRight size={16} color="var(--color-danger)" />
          </button>
        )}

        {/* Dernières ventes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text)" }}>
              Dernières ventes
            </h2>
            <button
              onClick={() => router.push("/sales")}
              style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 600 }}
            >
              Voir tout
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          ) : recentSales.length === 0 ? (
            <div
              className="card text-center py-8"
              style={{ color: "var(--color-text-muted)" }}
            >
              <ShoppingCart size={32} strokeWidth={1.5} className="mx-auto mb-2 opacity-40" />
              <p style={{ fontSize: "var(--text-sm)" }}>Aucune vente aujourd'hui</p>
              <p style={{ fontSize: "var(--text-xs)", opacity: 0.7 }}>Appuyez sur + Vente pour commencer</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSales.map((sale) => (
                <button
                  key={sale.id}
                  onClick={() => router.push(`/sales/${sale.id}`)}
                  className="card w-full flex items-center gap-3 text-left tap-feedback"
                  style={{ padding: "0.75rem" }}
                >
                  <div
                    className="flex items-center justify-center rounded-lg shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      background: `${PM_COLORS[sale.paymentMethod]}15`,
                    }}
                  >
                    <ShoppingCart size={16} color={PM_COLORS[sale.paymentMethod]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate"
                      style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}
                    >
                      {sale.items?.[0]?.product?.name ?? sale.reference}
                      {sale.items?.length > 1 && (
                        <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
                          {" "}+{sale.items.length - 1}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="badge-success"
                        style={{ background: `${PM_COLORS[sale.paymentMethod]}15`, color: PM_COLORS[sale.paymentMethod] }}
                      >
                        {PM_LABELS[sale.paymentMethod]}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-light)" }}>
                        {formatTime(sale.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p
                    className="amount shrink-0"
                    style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text)" }}
                  >
                    {formatFCFA(sale.netAmount)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Raccourcis rapides */}
        <section>
          <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.75rem" }}>
            Actions rapides
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "+ Crédit", color: "var(--color-accent)", href: "/clients" },
              { label: "+ Dépense", color: "var(--color-danger)", href: "/more/expenses" },
              { label: "+ Produit", color: "var(--color-primary-light)", href: "/stock/new" },
            ].map(({ label, color, href }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className="flex items-center justify-center rounded-xl tap-feedback"
                style={{
                  height: 48,
                  background: `${color}12`,
                  color,
                  fontWeight: 700,
                  fontSize: "var(--text-sm)",
                  border: `1px solid ${color}25`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => router.push("/sales/new")}>
        <Plus size={20} strokeWidth={2.5} />
        Nouvelle vente
      </button>
    </div>
  );
}

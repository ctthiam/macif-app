"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Receipt, Trash2, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA, formatDate } from "@/lib/api";

interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  user: { name: string };
}

interface ExpensesResponse {
  items: Expense[];
  total: number;
  totalAmount: number;
  pages: number;
}

const CATEGORIES: Record<string, { label: string; color: string; icon: string }> = {
  rent:        { label: "Loyer",       color: "#5C35A0", icon: "🏠" },
  electricity: { label: "Électricité", color: "#E65100", icon: "⚡" },
  water:       { label: "Eau",         color: "#00B9FF", icon: "💧" },
  salary:      { label: "Salaire",     color: "#1B5E20", icon: "👷" },
  transport:   { label: "Transport",   color: "#C9952A", icon: "🚗" },
  supplier:    { label: "Fournisseur", color: "#37474F", icon: "📦" },
  other:       { label: "Autre",       color: "#666",    icon: "📌" },
};

const PERIOD_OPTIONS = [
  { value: "today", label: "Auj." },
  { value: "week",  label: "7 jours" },
  { value: "month", label: "Ce mois" },
];

function getDateRange(period: string) {
  const now = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (period === "today") { const t = fmt(now); return { startDate: t, endDate: t }; }
  if (period === "week") {
    const s = new Date(now); s.setDate(now.getDate() - 6);
    return { startDate: fmt(s), endDate: fmt(now) };
  }
  const s = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: fmt(s), endDate: fmt(now) };
}

interface NewExpenseForm { category: string; amount: string; description: string; date: string; }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const todayStr = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<NewExpenseForm>({
    category: "other",
    amount: "",
    description: "",
    date: todayStr,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(period);
      const params = new URLSearchParams({ startDate, endDate, limit: "50" });
      const res = await api.get<{ data: ExpensesResponse }>(`/api/expenses?${params}`);
      const data = res.data.data;
      setExpenses(data.items);
      setTotalAmount(data.totalAmount);
      setTotalCount(data.total);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.amount || !form.category) return;
    setSaving(true);
    try {
      await api.post("/api/expenses", {
        category: form.category,
        amount: Number(form.amount),
        description: form.description || undefined,
        date: form.date,
      });
      setShowSheet(false);
      setForm({ category: "other", amount: "", description: "", date: todayStr });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/expenses/${id}`);
      load();
    } catch {
      //
    } finally {
      setDeleteId(null);
    }
  };

  // Group by date
  const grouped: Record<string, Expense[]> = {};
  expenses.forEach((e) => {
    const key = formatDate(e.date);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <div>
      <PageHeader
        title="Dépenses"
        subtitle={loading ? "…" : `${totalCount} dépense${totalCount > 1 ? "s" : ""}`}
        back
        action={
          <button
            onClick={() => setShowSheet(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 tap-feedback"
            style={{ height: 36, background: "var(--color-danger)", color: "white", fontWeight: 700, fontSize: "var(--text-sm)" }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Dépense
          </button>
        }
      />

      <div className="page-content space-y-4">
        {/* Total */}
        {!loading && (
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: "rgba(183,28,28,0.06)", border: "1px solid rgba(183,28,28,0.12)" }}
          >
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ width: 44, height: 44, background: "rgba(183,28,28,0.1)" }}
            >
              <Receipt size={20} color="var(--color-danger)" />
            </div>
            <div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", fontWeight: 500, opacity: 0.8 }}>
                Total de la période
              </p>
              <p className="amount" style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-danger)" }}>
                {formatFCFA(totalAmount)}
              </p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className="rounded-xl px-3 shrink-0 tap-feedback"
              style={{
                height: 36,
                fontWeight: 600,
                fontSize: "var(--text-sm)",
                background: period === opt.value ? "var(--color-danger)" : "var(--color-surface)",
                color: period === opt.value ? "white" : "var(--color-text-muted)",
                border: `1px solid ${period === opt.value ? "transparent" : "var(--color-border)"}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton rounded-2xl" style={{ height: 68 }} />)}
          </div>
        ) : expenses.length === 0 ? (
          <div className="card text-center py-12">
            <Receipt size={40} strokeWidth={1.2} className="mx-auto mb-3 opacity-30" color="var(--color-text-muted)" />
            <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text)" }}>
              Aucune dépense
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: 4 }}>
              Enregistrez vos charges quotidiennes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([date, items]) => {
              const dayTotal = items.reduce((s, i) => s + Number(i.amount), 0);
              return (
                <section key={date}>
                  <div className="flex items-center justify-between mb-2">
                    <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {date}
                    </p>
                    <p className="amount" style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-danger)" }}>
                      -{formatFCFA(dayTotal)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {items.map((expense) => {
                      const cat = CATEGORIES[expense.category] ?? CATEGORIES.other;
                      return (
                        <div
                          key={expense.id}
                          className="card flex items-center gap-3"
                          style={{ padding: "0.75rem" }}
                        >
                          <div
                            className="flex items-center justify-center rounded-xl shrink-0"
                            style={{ width: 42, height: 42, background: `${cat.color}12`, fontSize: "1.1rem" }}
                          >
                            {cat.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)" }}>
                              {cat.label}
                            </p>
                            {expense.description && (
                              <p className="truncate" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                                {expense.description}
                              </p>
                            )}
                          </div>
                          <p className="amount shrink-0" style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-danger)" }}>
                            -{formatFCFA(Number(expense.amount))}
                          </p>
                          <button
                            onClick={() => setDeleteId(expense.id)}
                            className="flex items-center justify-center rounded-xl tap-feedback shrink-0"
                            style={{ width: 32, height: 32, background: "rgba(183,28,28,0.06)" }}
                          >
                            <Trash2 size={14} color="var(--color-danger)" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <button className="fab" style={{ background: "var(--color-danger)" }} onClick={() => setShowSheet(true)}>
        <Plus size={20} strokeWidth={2.5} />
        Nouvelle dépense
      </button>

      {/* Sheet: Nouvelle dépense */}
      {showSheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && setShowSheet(false)}
        >
          <div
            className="rounded-t-3xl"
            style={{ background: "var(--color-surface)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          >
            <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1rem 0.5rem" }}>
              <div className="mx-auto mb-4 rounded-full" style={{ width: 40, height: 4, background: "var(--color-border)" }} />
              <div className="flex items-center justify-between mb-5">
                <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)" }}>
                  Nouvelle dépense
                </h2>
                <button onClick={() => setShowSheet(false)} className="flex items-center justify-center rounded-xl tap-feedback" style={{ width: 36, height: 36, background: "var(--color-surface-2)" }}>
                  <X size={18} color="var(--color-text-muted)" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Catégorie */}
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Catégorie
                  </label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <button
                        key={key}
                        onClick={() => setForm((f) => ({ ...f, category: key }))}
                        className="flex flex-col items-center justify-center rounded-xl tap-feedback py-2"
                        style={{
                          background: form.category === key ? `${cat.color}18` : "var(--color-surface-2)",
                          border: `1.5px solid ${form.category === key ? cat.color : "transparent"}`,
                        }}
                      >
                        <span style={{ fontSize: "1.2rem" }}>{cat.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: form.category === key ? cat.color : "var(--color-text-muted)", marginTop: 2 }}>
                          {cat.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Montant */}
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Montant (FCFA) *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="input mt-1.5 amount"
                    style={{ fontSize: "var(--text-xl)", fontWeight: 700, textAlign: "center" }}
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Description (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Facture SENELEC mars"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="input mt-1.5"
                  />
                </div>

                {/* Date */}
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="input mt-1.5"
                  />
                </div>
              </div>
            </div>
            <div style={{ padding: "0.75rem 1rem calc(1rem + env(safe-area-inset-bottom))", flexShrink: 0 }}>
              <button
                onClick={handleCreate}
                disabled={saving || !form.amount}
                className="w-full rounded-2xl tap-feedback"
                style={{
                  height: 52,
                  background: form.amount ? "var(--color-danger)" : "var(--color-border)",
                  color: form.amount ? "white" : "var(--color-text-muted)",
                  fontWeight: 700,
                  fontSize: "var(--text-base)",
                }}
              >
                {saving ? "Enregistrement…" : "Enregistrer la dépense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-3xl w-full max-w-sm" style={{ background: "var(--color-surface)", padding: "1.5rem" }}>
            <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.5rem" }}>
              Supprimer cette dépense ?
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Cette action est irréversible.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-2xl tap-feedback" style={{ height: 48, background: "var(--color-surface-2)", color: "var(--color-text)", fontWeight: 700, fontSize: "var(--text-sm)" }}>
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteId)} className="rounded-2xl tap-feedback" style={{ height: 48, background: "var(--color-danger)", color: "white", fontWeight: 700, fontSize: "var(--text-sm)" }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Phone, MessageCircle, ShoppingCart, CreditCard,
  Calendar, CheckCircle2, Clock, ChevronRight, Plus,
  Trash2, TrendingUp, X,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA, formatDate, formatTime } from "@/lib/api";

interface Credit {
  id: number;
  amountTotal: number;
  amountPaid: number;
  amountRemaining: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  saleId: number;
}

interface SaleItem {
  product: { name: string };
}

interface Sale {
  id: number;
  reference: string;
  netAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: SaleItem[];
}

interface CustomerDetail {
  id: number;
  name: string;
  phone: string | null;
  type: string;
  address: string | null;
  creditBalance: number;
  totalBought: number;
  credits: Credit[];
  sales: Sale[];
}

const PM_COLORS: Record<string, string> = {
  cash: "#1B5E20",
  wave: "#00B9FF",
  orange_money: "#FF6600",
  credit: "#B71C1C",
  mixed: "#C9952A",
};

const PM_LABELS: Record<string, string> = {
  cash: "Espèces",
  wave: "Wave",
  orange_money: "O. Money",
  credit: "Crédit",
  mixed: "Mixte",
};

const CREDIT_STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  partial: "Partiel",
  paid: "Soldé",
  overdue: "En retard",
};

const CREDIT_STATUS_COLORS: Record<string, string> = {
  open: "#B71C1C",
  partial: "#E65100",
  paid: "#1B5E20",
  overdue: "#B71C1C",
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaySheet, setShowPaySheet] = useState<Credit | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const load = () => {
    api
      .get(`/api/customers/${id}`)
      .then((r) => setCustomer(r.data.data))
      .catch(() => router.back())
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line

  const openPaySheet = (credit: Credit) => {
    setPayAmount(String(Math.round(Number(credit.amountRemaining))));
    setShowPaySheet(credit);
  };

  const handlePay = async () => {
    if (!showPaySheet) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;
    setPaying(true);
    try {
      await api.post(`/api/credits/${showPaySheet.id}/pay`, { amount });
      setShowPaySheet(null);
      load();
    } catch {
      //
    } finally {
      setPaying(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/customers/${id}`);
      router.back();
    } catch {
      //
    }
  };

  const sendWhatsApp = () => {
    if (!customer?.phone) return;
    const phone = customer.phone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("221") ? phone : `221${phone}`;
    const amount = formatFCFA(Number(customer.creditBalance));
    const msg = encodeURIComponent(
      `Bonjour ${customer.name},\n\nNous vous rappelons que vous avez un crédit en cours de ${amount}.\n\nMerci de régulariser votre situation.\n\n🏪 MACIF Quincaillerie`
    );
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, "_blank");
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Client" back />
        <div className="page-content space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton rounded-2xl" style={{ height: 80 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const openCredits = customer.credits.filter((c) => c.status !== "paid");
  const totalCredit = Number(customer.creditBalance);

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={customer.type === "business" ? "Client professionnel" : "Particulier"}
        back
        action={
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center rounded-xl tap-feedback"
            style={{ width: 36, height: 36, background: "rgba(183,28,28,0.08)" }}
          >
            <Trash2 size={16} color="var(--color-danger)" />
          </button>
        }
      />

      <div className="page-content space-y-4">
        {/* Infos contact */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} color="var(--color-text-muted)" />
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                    {customer.phone}
                  </span>
                </div>
              )}
              {customer.address && (
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  {customer.address}
                </p>
              )}
            </div>
            {customer.phone && (
              <button
                onClick={sendWhatsApp}
                className="flex items-center gap-2 rounded-xl px-3 tap-feedback"
                style={{
                  height: 40,
                  background: "#25D366",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "var(--text-xs)",
                }}
              >
                <MessageCircle size={14} />
                WhatsApp
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <div
              className="flex items-center justify-center rounded-xl mx-auto mb-2"
              style={{ width: 40, height: 40, background: "var(--color-primary-10)" }}
            >
              <TrendingUp size={18} color="var(--color-primary)" />
            </div>
            <p
              className="amount"
              style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text)" }}
            >
              {formatFCFA(Number(customer.totalBought))}
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
              Total acheté
            </p>
          </div>
          <div
            className="card text-center"
            style={totalCredit > 0 ? { background: "rgba(183,28,28,0.04)", border: "1px solid rgba(183,28,28,0.15)" } : {}}
          >
            <div
              className="flex items-center justify-center rounded-xl mx-auto mb-2"
              style={{
                width: 40,
                height: 40,
                background: totalCredit > 0 ? "rgba(183,28,28,0.1)" : "var(--color-surface-2)",
              }}
            >
              <CreditCard size={18} color={totalCredit > 0 ? "var(--color-danger)" : "var(--color-text-muted)"} />
            </div>
            <p
              className="amount"
              style={{
                fontSize: "var(--text-base)",
                fontWeight: 700,
                color: totalCredit > 0 ? "var(--color-danger)" : "var(--color-text)",
              }}
            >
              {formatFCFA(totalCredit)}
            </p>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: totalCredit > 0 ? "var(--color-danger)" : "var(--color-text-muted)",
                marginTop: 2,
                opacity: totalCredit > 0 ? 1 : 0.7,
              }}
            >
              Crédit dû
            </p>
          </div>
        </div>

        {/* Crédits ouverts */}
        {openCredits.length > 0 && (
          <section>
            <p
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "0.5rem",
              }}
            >
              Crédits en cours ({openCredits.length})
            </p>
            <div className="space-y-2">
              {openCredits.map((credit) => {
                const statusColor = CREDIT_STATUS_COLORS[credit.status] ?? "#666";
                const pct = Math.round(
                  (Number(credit.amountPaid) / Number(credit.amountTotal)) * 100
                );
                return (
                  <div
                    key={credit.id}
                    className="card"
                    style={{ border: `1px solid ${statusColor}25`, background: `${statusColor}06` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock size={14} color={statusColor} />
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            fontWeight: 700,
                            color: statusColor,
                          }}
                        >
                          {CREDIT_STATUS_LABELS[credit.status]}
                        </span>
                      </div>
                      {credit.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar size={11} color="var(--color-text-muted)" />
                          <span
                            style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}
                          >
                            Échéance {formatDate(credit.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div
                      className="rounded-full overflow-hidden mb-3"
                      style={{ height: 6, background: `${statusColor}20` }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: statusColor }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      {[
                        { label: "Total", value: credit.amountTotal, color: statusColor },
                        { label: "Payé", value: credit.amountPaid, color: "#1B5E20" },
                        { label: "Reste", value: credit.amountRemaining, color: "#B71C1C" },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <p style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 500 }}>
                            {label}
                          </p>
                          <p
                            className="amount"
                            style={{ fontSize: "var(--text-sm)", fontWeight: 700, color }}
                          >
                            {formatFCFA(Number(value))}
                          </p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => openPaySheet(credit)}
                      className="w-full rounded-xl tap-feedback"
                      style={{
                        height: 40,
                        background: "var(--color-primary)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      Enregistrer un paiement
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Dernières ventes */}
        {customer.sales.length > 0 && (
          <section>
            <p
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "0.5rem",
              }}
            >
              Dernières ventes
            </p>
            <div className="space-y-2">
              {customer.sales.map((sale) => (
                <button
                  key={sale.id}
                  onClick={() => router.push(`/sales/${sale.id}`)}
                  className="card w-full flex items-center gap-3 text-left tap-feedback"
                  style={{ padding: "0.75rem" }}
                >
                  <div
                    className="flex items-center justify-center rounded-xl shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      background: `${PM_COLORS[sale.paymentMethod] ?? "#666"}12`,
                    }}
                  >
                    <ShoppingCart
                      size={15}
                      color={PM_COLORS[sale.paymentMethod] ?? "#666"}
                      strokeWidth={2}
                    />
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
                      {sale.items?.[0]?.product?.name ?? sale.reference}
                      {sale.items?.length > 1 && (
                        <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
                          {" "}+{sale.items.length - 1}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="rounded-md px-1.5 py-0.5"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: `${PM_COLORS[sale.paymentMethod] ?? "#666"}12`,
                          color: PM_COLORS[sale.paymentMethod] ?? "#666",
                        }}
                      >
                        {PM_LABELS[sale.paymentMethod]}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-light)" }}>
                        {formatTime(sale.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <p
                      className="amount"
                      style={{
                        fontSize: "var(--text-sm)",
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
        )}

        {/* CTA Nouvelle vente */}
        <button
          onClick={() => router.push(`/sales/new?customerId=${customer.id}`)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl tap-feedback"
          style={{
            height: 52,
            background: "var(--color-primary-10)",
            color: "var(--color-primary)",
            fontWeight: 700,
            fontSize: "var(--text-base)",
            border: "1px solid var(--color-primary)",
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          Nouvelle vente pour {customer.name.split(" ")[0]}
        </button>
      </div>

      {/* Bottom sheet paiement crédit */}
      {showPaySheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && setShowPaySheet(null)}
        >
          <div
            className="rounded-t-3xl"
            style={{
              background: "var(--color-surface)",
              padding: "1.25rem 1rem calc(2rem + env(safe-area-inset-bottom))",
            }}
          >
            <div
              className="mx-auto mb-4 rounded-full"
              style={{ width: 40, height: 4, background: "var(--color-border)" }}
            />

            <div className="flex items-center justify-between mb-5">
              <h2
                style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)" }}
              >
                Paiement crédit
              </h2>
              <button
                onClick={() => setShowPaySheet(null)}
                className="flex items-center justify-center rounded-xl tap-feedback"
                style={{ width: 36, height: 36, background: "var(--color-surface-2)" }}
              >
                <X size={18} color="var(--color-text-muted)" />
              </button>
            </div>

            <div
              className="rounded-2xl px-4 py-3 mb-4 text-center"
              style={{ background: "rgba(183,28,28,0.06)", border: "1px solid rgba(183,28,28,0.15)" }}
            >
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", fontWeight: 500 }}>
                Restant dû
              </p>
              <p
                className="amount"
                style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-danger)" }}
              >
                {formatFCFA(Number(showPaySheet.amountRemaining))}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Montant payé (FCFA)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="input mt-1.5 amount"
                  style={{ fontSize: "var(--text-xl)", fontWeight: 700, textAlign: "center" }}
                />
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  showPaySheet.amountRemaining,
                  Math.round(Number(showPaySheet.amountRemaining) / 2),
                  Math.round(Number(showPaySheet.amountRemaining) / 4),
                ]
                  .filter((v) => v > 0)
                  .map((v) => (
                    <button
                      key={v}
                      onClick={() => setPayAmount(String(Math.round(v)))}
                      className="rounded-xl tap-feedback"
                      style={{
                        height: 40,
                        background:
                          Number(payAmount) === Math.round(v)
                            ? "var(--color-primary)"
                            : "var(--color-surface-2)",
                        color:
                          Number(payAmount) === Math.round(v)
                            ? "white"
                            : "var(--color-text-muted)",
                        fontWeight: 700,
                        fontSize: "var(--text-xs)",
                      }}
                    >
                      {formatFCFA(Math.round(v))}
                    </button>
                  ))}
              </div>

              <button
                onClick={handlePay}
                disabled={paying || !Number(payAmount)}
                className="w-full rounded-2xl tap-feedback"
                style={{
                  height: 52,
                  background:
                    Number(payAmount) > 0 ? "var(--color-primary)" : "var(--color-border)",
                  color: Number(payAmount) > 0 ? "white" : "var(--color-text-muted)",
                  fontWeight: 700,
                  fontSize: "var(--text-base)",
                }}
              >
                {paying ? "Enregistrement…" : "Confirmer le paiement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-3xl w-full max-w-sm"
            style={{ background: "var(--color-surface)", padding: "1.5rem" }}
          >
            <p
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: "var(--color-text)",
                marginBottom: "0.5rem",
              }}
            >
              Supprimer ce client ?
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              L'historique des ventes sera conservé. Cette action est irréversible.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-2xl tap-feedback"
                style={{
                  height: 48,
                  background: "var(--color-surface-2)",
                  color: "var(--color-text)",
                  fontWeight: 700,
                  fontSize: "var(--text-sm)",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="rounded-2xl tap-feedback"
                style={{
                  height: 48,
                  background: "var(--color-danger)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "var(--text-sm)",
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

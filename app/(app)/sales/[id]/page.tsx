"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User, Phone, Calendar, Hash, CreditCard,
  Package, CheckCircle2, Clock, Printer,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA, formatDate, formatTime } from "@/lib/api";

interface SaleDetail {
  id: number;
  reference: string;
  totalAmount: number;
  discount: number;
  netAmount: number;
  paymentMethod: string;
  paidAmount: number;
  creditAmount: number;
  notes: string | null;
  createdAt: string;
  customer: { id: number; name: string; phone: string } | null;
  user: { name: string };
  items: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: { name: string; unit: string; photoUrl: string | null };
  }>;
  credits: Array<{
    id: number;
    amountTotal: number;
    amountPaid: number;
    amountRemaining: number;
    status: string;
    dueDate: string | null;
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
  cash: "#1B5E20",
  wave: "#00B9FF",
  orange_money: "#FF6600",
  credit: "#B71C1C",
  mixed: "#C9952A",
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

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/sales/${id}`)
      .then((r) => setSale(r.data.data))
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  if (loading) {
    return (
      <div>
        <PageHeader title="Vente" back />
        <div className="page-content space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton rounded-2xl" style={{ height: 80 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!sale) return null;

  const pmColor = PM_COLORS[sale.paymentMethod] ?? "var(--color-text-muted)";
  const hasDiscount = Number(sale.discount) > 0;
  const hasCredit = Number(sale.creditAmount) > 0;
  const change =
    sale.paymentMethod === "cash"
      ? Math.max(0, Number(sale.paidAmount) - Number(sale.netAmount))
      : 0;

  return (
    <div>
      <PageHeader
        title={sale.reference}
        subtitle={formatDate(sale.createdAt)}
        back
        action={
          <button
            onClick={() => router.push(`/sales/${sale.id}/print`)}
            className="flex items-center justify-center rounded-xl tap-feedback"
            style={{ width: 36, height: 36, background: "var(--color-primary-50)" }}
            title="Imprimer le ticket"
          >
            <Printer size={17} color="var(--color-primary)" />
          </button>
        }
      />

      <div className="page-content space-y-4">
        {/* Badge paiement */}
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ background: `${pmColor}10`, border: `1px solid ${pmColor}25` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 42, height: 42, background: `${pmColor}18` }}
            >
              <CreditCard size={18} color={pmColor} />
            </div>
            <div>
              <p style={{ fontSize: "var(--text-xs)", color: pmColor, fontWeight: 500, opacity: 0.8 }}>
                Mode de paiement
              </p>
              <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: pmColor }}>
                {PM_LABELS[sale.paymentMethod]}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p style={{ fontSize: "var(--text-xs)", color: pmColor, opacity: 0.8 }}>
              {formatTime(sale.createdAt)}
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: pmColor, fontWeight: 600 }}>
              par {sale.user.name}
            </p>
          </div>
        </div>

        {/* Client */}
        {sale.customer && (
          <button
            onClick={() => router.push(`/clients/${sale.customer!.id}`)}
            className="card w-full flex items-center gap-3 text-left tap-feedback"
          >
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ width: 42, height: 42, background: "var(--color-primary-10)" }}
            >
              <User size={18} color="var(--color-primary)" />
            </div>
            <div className="flex-1">
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)" }}>
                {sale.customer.name}
              </p>
              <div className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                <Phone size={11} />
                <span style={{ fontSize: "var(--text-xs)" }}>{sale.customer.phone}</span>
              </div>
            </div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", fontWeight: 600 }}>
              Voir fiche →
            </span>
          </button>
        )}

        {/* Articles */}
        <section className="card space-y-0">
          <p
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "0.75rem",
            }}
          >
            Articles ({sale.items.length})
          </p>
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {sale.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div
                  className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ width: 36, height: 36, background: "var(--color-surface-2)" }}
                >
                  <Package size={16} color="var(--color-text-muted)" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="truncate"
                    style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}
                  >
                    {item.product.name}
                  </p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {item.quantity} {item.product.unit} × {formatFCFA(Number(item.unitPrice))}
                  </p>
                </div>
                <p
                  className="amount shrink-0"
                  style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)" }}
                >
                  {formatFCFA(Number(item.totalPrice))}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Totaux */}
        <section className="card space-y-2">
          <div className="flex justify-between">
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              Sous-total
            </span>
            <span
              className="amount"
              style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}
            >
              {formatFCFA(Number(sale.totalAmount))}
            </span>
          </div>

          {hasDiscount && (
            <div className="flex justify-between">
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                Remise
              </span>
              <span
                className="amount"
                style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-danger)" }}
              >
                -{formatFCFA(Number(sale.discount))}
              </span>
            </div>
          )}

          <div
            className="flex justify-between pt-2"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text)" }}>
              Total
            </span>
            <span
              className="amount"
              style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-primary)" }}
            >
              {formatFCFA(Number(sale.netAmount))}
            </span>
          </div>

          {sale.paymentMethod === "cash" && (
            <>
              <div className="flex justify-between">
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  Reçu
                </span>
                <span
                  className="amount"
                  style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}
                >
                  {formatFCFA(Number(sale.paidAmount))}
                </span>
              </div>
              {change > 0 && (
                <div
                  className="flex justify-between rounded-xl px-3 py-2"
                  style={{ background: "rgba(201,149,42,0.08)" }}
                >
                  <span
                    style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent)" }}
                  >
                    Monnaie rendue
                  </span>
                  <span
                    className="amount"
                    style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-accent)" }}
                  >
                    {formatFCFA(change)}
                  </span>
                </div>
              )}
            </>
          )}
        </section>

        {/* Crédit */}
        {hasCredit && sale.credits.length > 0 && (
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
              Crédit associé
            </p>
            {sale.credits.map((credit) => {
              const statusColor = CREDIT_STATUS_COLORS[credit.status] ?? "#666";
              const isPaid = credit.status === "paid";
              return (
                <div
                  key={credit.id}
                  className="card"
                  style={{
                    border: `1px solid ${statusColor}25`,
                    background: `${statusColor}08`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isPaid ? (
                        <CheckCircle2 size={16} color={statusColor} />
                      ) : (
                        <Clock size={16} color={statusColor} />
                      )}
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
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                          {formatDate(credit.dueDate)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
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
                </div>
              );
            })}
          </section>
        )}

        {/* Notes */}
        {sale.notes && (
          <div
            className="rounded-2xl px-4 py-3"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <p
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              Notes
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{sale.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

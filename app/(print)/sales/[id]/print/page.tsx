"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import api, { formatFCFA, formatDate, formatTime } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

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
    product: { name: string; unit: string };
  }>;
}

const PM_LABELS: Record<string, string> = {
  cash: "Espèces",
  wave: "Wave",
  orange_money: "Orange Money",
  credit: "Crédit",
  mixed: "Mixte",
};

export default function SalePrintPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { shop } = useAuthStore();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/sales/${id}`)
      .then((r) => setSale(r.data.data))
      .catch(() => router.push(`/sales/${id}`))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", color: "#666" }}>
        Chargement du ticket…
      </div>
    );
  }

  if (!sale) return null;

  const hasDiscount = Number(sale.discount) > 0;
  const hasCreditAmount = Number(sale.creditAmount) > 0;
  const change =
    sale.paymentMethod === "cash"
      ? Math.max(0, Number(sale.paidAmount) - Number(sale.netAmount))
      : 0;

  const generated = new Intl.DateTimeFormat("fr-SN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date());

  return (
    <>
      {/* ── Barre de contrôle (masquée à l'impression) ── */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.875rem 1rem",
          background: "#f5f5f5",
          borderBottom: "1px solid #ddd",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.push(`/sales/${id}`)}
          style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            padding: "0.5rem 1rem", background: "#e8e8e8", color: "#333",
            borderRadius: 8, fontWeight: 600, fontSize: "0.875rem",
            border: "none", cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} />
          Retour
        </button>
        <button
          onClick={() => window.print()}
          style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            padding: "0.5rem 1.25rem", background: "#1B5E20", color: "white",
            borderRadius: 8, fontWeight: 700, fontSize: "0.875rem",
            border: "none", cursor: "pointer",
          }}
        >
          <Printer size={15} />
          Imprimer / Enregistrer PDF
        </button>
      </div>

      {/* ── Ticket ── */}
      <div
        style={{
          maxWidth: 340,
          margin: "1.5rem auto 3rem",
          padding: "1.5rem 1.25rem",
          background: "white",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "13px",
          lineHeight: 1.6,
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          borderRadius: 4,
        }}
      >
        {/* En-tête boutique */}
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <p style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {shop?.name ?? "MACIF"}
          </p>
          <p style={{ fontSize: "11px", color: "#555", marginTop: 2 }}>
            Ticket de vente
          </p>
        </div>

        <Separator />

        {/* Infos vente */}
        <div style={{ marginBottom: "0.625rem" }}>
          <Row label="Réf." value={sale.reference} bold />
          <Row label="Date" value={formatDate(sale.createdAt)} />
          <Row label="Heure" value={formatTime(sale.createdAt)} />
          <Row label="Vendeur" value={sale.user.name} />
          {sale.customer && <Row label="Client" value={sale.customer.name} />}
        </div>

        <Separator dashed />

        {/* Articles */}
        <div style={{ marginBottom: "0.625rem" }}>
          {sale.items.map((item) => (
            <div key={item.id} style={{ marginBottom: "0.5rem" }}>
              <p style={{ fontWeight: 700, fontSize: "13px" }}>{item.product.name}</p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#444" }}>
                <span>
                  {item.quantity} {item.product.unit} × {formatFCFA(Number(item.unitPrice))}
                </span>
                <span style={{ fontWeight: 700 }}>{formatFCFA(Number(item.totalPrice))}</span>
              </div>
            </div>
          ))}
        </div>

        <Separator dashed />

        {/* Totaux */}
        <div style={{ marginBottom: "0.625rem" }}>
          {hasDiscount && (
            <>
              <Row label="Sous-total" value={formatFCFA(Number(sale.totalAmount))} />
              <Row label="Remise" value={`-${formatFCFA(Number(sale.discount))}`} color="#B71C1C" />
            </>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 700, marginTop: 4 }}>
            <span>TOTAL</span>
            <span>{formatFCFA(Number(sale.netAmount))}</span>
          </div>
        </div>

        <Separator dashed />

        {/* Paiement */}
        <div style={{ marginBottom: "0.625rem" }}>
          <Row label="Paiement" value={PM_LABELS[sale.paymentMethod] ?? sale.paymentMethod} bold />
          {sale.paymentMethod === "cash" && (
            <>
              <Row label="Reçu" value={formatFCFA(Number(sale.paidAmount))} />
              {change > 0 && <Row label="Monnaie rendue" value={formatFCFA(change)} bold />}
            </>
          )}
          {hasCreditAmount && (
            <Row label="Crédit dû" value={formatFCFA(Number(sale.creditAmount))} color="#B71C1C" bold />
          )}
        </div>

        {sale.notes && (
          <>
            <Separator dashed />
            <p style={{ fontSize: "11px", fontStyle: "italic", color: "#666", marginBottom: "0.5rem" }}>
              Note : {sale.notes}
            </p>
          </>
        )}

        <Separator />

        {/* Pied de page */}
        <div style={{ textAlign: "center", fontSize: "11px", color: "#555" }}>
          <p style={{ fontWeight: 700, marginBottom: 2 }}>Merci de votre confiance !</p>
          <p>Conservez ce ticket comme preuve d'achat.</p>
          <p style={{ marginTop: 8, color: "#aaa", fontSize: "10px" }}>
            Généré le {generated}
          </p>
        </div>
      </div>
    </>
  );
}

function Separator({ dashed }: { dashed?: boolean }) {
  return (
    <div
      style={{
        borderTop: `1px ${dashed ? "dashed" : "solid"} #333`,
        margin: "0.625rem 0",
      }}
    />
  );
}

function Row({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: color ?? "inherit" }}>
      <span>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}

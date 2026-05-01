"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import api, { formatFCFA, formatDate } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

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

interface CustomerDetail {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  creditBalance: number;
  totalBought: number;
  credits: Credit[];
}

const STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  partial: "Partiel",
  paid: "Soldé",
  overdue: "En retard",
};

export default function CreditRelevePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { shop } = useAuthStore();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/customers/${id}`)
      .then((r) => setCustomer(r.data.data))
      .catch(() => router.push(`/clients/${id}`))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", color: "#666" }}>
        Chargement du relevé…
      </div>
    );
  }

  if (!customer) return null;

  const openCredits = customer.credits.filter((c) => c.status !== "paid");
  const totalDue = Number(customer.creditBalance);

  const generated = new Intl.DateTimeFormat("fr-SN", {
    day: "2-digit", month: "long", year: "numeric",
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
          onClick={() => router.push(`/clients/${id}`)}
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

      {/* ── Document ── */}
      <div
        style={{
          maxWidth: 600,
          margin: "1.5rem auto 3rem",
          padding: "2rem",
          background: "white",
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "13px",
          lineHeight: 1.6,
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          borderRadius: 4,
        }}
      >
        {/* En-tête */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", borderBottom: "2px solid #1B5E20", paddingBottom: "1rem" }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: "18px", color: "#1B5E20", letterSpacing: "0.05em" }}>
              {shop?.name ?? "MACIF"}
            </p>
            <p style={{ fontSize: "11px", color: "#888", marginTop: 2 }}>Relevé de compte client</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "11px", color: "#888" }}>Généré le</p>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#333" }}>{generated}</p>
          </div>
        </div>

        {/* Infos client */}
        <div style={{ background: "#f8f8f8", borderRadius: 6, padding: "0.875rem 1rem", marginBottom: "1.5rem" }}>
          <p style={{ fontWeight: 700, fontSize: "15px", color: "#111", marginBottom: 4 }}>
            {customer.name}
          </p>
          {customer.phone && (
            <p style={{ fontSize: "12px", color: "#555" }}>Tél. : {customer.phone}</p>
          )}
          {customer.address && (
            <p style={{ fontSize: "12px", color: "#555" }}>{customer.address}</p>
          )}
        </div>

        {/* Tableau des crédits */}
        {openCredits.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#888", border: "1px dashed #ddd", borderRadius: 6 }}>
            <p style={{ fontWeight: 600 }}>Aucun crédit en cours</p>
            <p style={{ fontSize: "12px", marginTop: 4 }}>Ce client n'a pas de dette ouverte.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
              Crédits en cours ({openCredits.length})
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.25rem" }}>
              <thead>
                <tr style={{ background: "#1B5E20", color: "white" }}>
                  {["Date", "Statut", "Total", "Payé", "Reste"].map((col, i) => (
                    <th
                      key={col}
                      style={{
                        padding: "0.5rem 0.625rem",
                        textAlign: i >= 2 ? "right" : "left",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {openCredits.map((credit, idx) => (
                  <tr
                    key={credit.id}
                    style={{ background: idx % 2 === 0 ? "#fff" : "#f9f9f9", borderBottom: "1px solid #eee" }}
                  >
                    <td style={{ padding: "0.5rem 0.625rem", fontSize: "12px", color: "#444" }}>
                      {formatDate(credit.createdAt)}
                    </td>
                    <td style={{ padding: "0.5rem 0.625rem", fontSize: "11px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.1rem 0.5rem",
                          borderRadius: 9999,
                          fontWeight: 700,
                          background: credit.status === "partial" ? "#FFF3E0" : "#FFEBEE",
                          color: credit.status === "partial" ? "#E65100" : "#B71C1C",
                        }}
                      >
                        {STATUS_LABELS[credit.status] ?? credit.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem 0.625rem", fontSize: "12px", textAlign: "right", fontWeight: 600 }}>
                      {formatFCFA(Number(credit.amountTotal))}
                    </td>
                    <td style={{ padding: "0.5rem 0.625rem", fontSize: "12px", textAlign: "right", color: "#1B5E20", fontWeight: 600 }}>
                      {formatFCFA(Number(credit.amountPaid))}
                    </td>
                    <td style={{ padding: "0.5rem 0.625rem", fontSize: "12px", textAlign: "right", color: "#B71C1C", fontWeight: 700 }}>
                      {formatFCFA(Number(credit.amountRemaining))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total dû */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.875rem 1rem",
                background: "#FFEBEE",
                border: "1px solid rgba(183,28,28,0.2)",
                borderRadius: 6,
                marginBottom: "1.5rem",
              }}
            >
              <p style={{ fontWeight: 700, fontSize: "14px", color: "#B71C1C" }}>Total dû</p>
              <p style={{ fontWeight: 800, fontSize: "18px", color: "#B71C1C" }}>
                {formatFCFA(totalDue)}
              </p>
            </div>
          </>
        )}

        {/* Récapitulatif global */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ flex: 1, background: "#E8F5E9", borderRadius: 6, padding: "0.75rem 1rem", textAlign: "center" }}>
            <p style={{ fontSize: "10px", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total acheté</p>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#1B5E20", marginTop: 2 }}>
              {formatFCFA(Number(customer.totalBought))}
            </p>
          </div>
          <div style={{ flex: 1, background: "#FFEBEE", borderRadius: 6, padding: "0.75rem 1rem", textAlign: "center" }}>
            <p style={{ fontSize: "10px", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Crédit restant</p>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#B71C1C", marginTop: 2 }}>
              {formatFCFA(totalDue)}
            </p>
          </div>
        </div>

        {/* Pied de page */}
        <div style={{ borderTop: "1px solid #eee", paddingTop: "1rem", textAlign: "center", fontSize: "11px", color: "#aaa" }}>
          <p>Document généré par <strong style={{ color: "#1B5E20" }}>{shop?.name ?? "MACIF"}</strong> — Logiciel de gestion de boutique</p>
        </div>
      </div>
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import {
  Shield, CheckCircle2, Clock, AlertTriangle,
  CreditCard, RefreshCw, Calendar,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA, formatDate } from "@/lib/api";

interface SubStatus {
  isActive: boolean;
  isInTrial: boolean;
  hasActiveSub: boolean;
  daysLeft: number;
  trialEndsAt: string | null;
  price: number;
  lastSubscription: {
    id: number;
    amount: number;
    startsAt: string;
    expiresAt: string;
    paymentRef: string | null;
  } | null;
}

interface HistoryItem {
  id: number;
  amount: number;
  startsAt: string;
  expiresAt: string;
  paymentRef: string | null;
  createdAt: string;
}

export default function SubscriptionPage() {
  const [status, setStatus] = useState<SubStatus | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/subscriptions/status"),
      api.get("/api/subscriptions/history"),
    ])
      .then(([s, h]) => {
        setStatus(s.data.data);
        setHistory(h.data.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePayment = async () => {
    setError("");
    setInitiating(true);
    try {
      const returnUrl = `${window.location.origin}/more/subscription`;
      const res = await api.post("/api/subscriptions/initiate", { returnUrl });
      const { paymentUrl } = res.data.data;
      window.location.href = paymentUrl;
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erreur lors de l'initiation du paiement");
    } finally {
      setInitiating(false);
    }
  };

  const urgency = status && status.daysLeft <= 5 && status.isActive;
  const expired = status && !status.isActive && !status.isInTrial;

  return (
    <div>
      <PageHeader title="Mon abonnement" back />

      <div className="page-content space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton rounded-2xl" style={{ height: 80 }} />)}
          </div>
        ) : status ? (
          <>
            {/* Statut principal */}
            <div
              className="rounded-2xl px-4 py-5 text-center"
              style={{
                background: expired
                  ? "var(--color-danger)"
                  : urgency
                  ? "rgba(201,149,42,0.08)"
                  : status.isInTrial
                  ? "var(--color-primary-10)"
                  : "var(--color-primary)",
                border: urgency ? "1px solid rgba(201,149,42,0.3)" : expired ? "none" : "none",
              }}
            >
              <div
                className="flex items-center justify-center rounded-2xl mx-auto mb-3"
                style={{
                  width: 56,
                  height: 56,
                  background: expired || urgency ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.15)",
                }}
              >
                {expired ? (
                  <AlertTriangle size={26} color="white" />
                ) : status.isActive ? (
                  <CheckCircle2 size={26} color={urgency ? "var(--color-accent)" : "white"} />
                ) : (
                  <Clock size={26} color="white" />
                )}
              </div>
              <p
                style={{
                  fontSize: "var(--text-lg)",
                  fontWeight: 700,
                  color: expired ? "white" : urgency ? "var(--color-accent)" : status.isInTrial ? "var(--color-primary)" : "white",
                  marginBottom: 4,
                }}
              >
                {expired
                  ? "Abonnement expiré"
                  : status.isInTrial
                  ? "Période d'essai gratuit"
                  : "Abonnement actif"}
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: expired ? "rgba(255,255,255,0.85)" : urgency ? "var(--color-accent)" : status.isInTrial ? "var(--color-primary)" : "rgba(255,255,255,0.85)",
                  opacity: 0.9,
                }}
              >
                {expired
                  ? "Renouvelez pour continuer à utiliser MACIF"
                  : `${status.daysLeft} jour${status.daysLeft > 1 ? "s" : ""} restant${status.daysLeft > 1 ? "s" : ""}`}
              </p>
              {status.isInTrial && status.trialEndsAt && (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", marginTop: 4, opacity: 0.7 }}>
                  Essai jusqu'au {formatDate(status.trialEndsAt)}
                </p>
              )}
            </div>

            {/* Erreur */}
            {error && (
              <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(183,28,28,0.06)", border: "1px solid rgba(183,28,28,0.15)" }}>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>{error}</p>
              </div>
            )}

            {/* Tarif */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text)" }}>
                  Plan MACIF Pro
                </p>
                <span
                  className="rounded-xl px-2.5 py-1"
                  style={{ fontSize: 11, fontWeight: 700, background: "var(--color-primary-10)", color: "var(--color-primary)" }}
                >
                  Tout inclus
                </span>
              </div>
              <p className="amount" style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-primary)", marginBottom: 12 }}>
                {formatFCFA(status.price)}
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-muted)" }}> / mois</span>
              </p>
              <div className="space-y-2">
                {[
                  "Ventes illimitées",
                  "Gestion stock complète",
                  "Crédits & relances clients",
                  "Rapports & analyses",
                  "Fournisseurs & achats",
                  "Caisse journalière",
                  "PWA installable (Android/iPhone)",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={14} color="var(--color-primary)" />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA paiement */}
            <button
              onClick={handlePayment}
              disabled={initiating}
              className="w-full flex items-center justify-center gap-2 rounded-2xl tap-feedback"
              style={{
                height: 56,
                background: expired ? "var(--color-danger)" : "var(--color-primary)",
                color: "white",
                fontWeight: 700,
                fontSize: "var(--text-base)",
              }}
            >
              {initiating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Redirection…
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  {expired ? "Réactiver l'abonnement" : "Renouveler"} · {formatFCFA(status.price)}
                </>
              )}
            </button>

            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textAlign: "center" }}>
              Paiement sécurisé via PayDunya · Wave, Orange Money, Free Money
            </p>

            {/* Historique */}
            {history.length > 0 && (
              <section>
                <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                  Historique
                </p>
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="card flex items-center gap-3" style={{ padding: "0.75rem" }}>
                      <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 38, height: 38, background: "var(--color-primary-10)" }}>
                        <Calendar size={16} color="var(--color-primary)" />
                      </div>
                      <div className="flex-1">
                        <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
                          {formatDate(h.startsAt)} → {formatDate(h.expiresAt)}
                        </p>
                        {h.paymentRef && (
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                            Réf: {h.paymentRef.slice(0, 16)}…
                          </p>
                        )}
                      </div>
                      <p className="amount" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)" }}>
                        {formatFCFA(Number(h.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

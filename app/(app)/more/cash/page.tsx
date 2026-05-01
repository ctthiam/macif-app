"use client";
import { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Lock, Unlock, X, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA, formatDate } from "@/lib/api";

interface CashRegister {
  id: number;
  date: string;
  openingAmount: number;
  closingAmount: number | null;
  theoreticalAmount: number | null;
  difference: number | null;
  status: "open" | "closed";
  notes: string | null;
  cashIn: number;
  totalExpenses: number;
  theoretical: number;
  user: { name: string };
}

interface HistoryItem {
  id: number;
  date: string;
  openingAmount: number;
  closingAmount: number | null;
  theoreticalAmount: number | null;
  difference: number | null;
  status: "open" | "closed";
}

export default function CashPage() {
  const [register, setRegister] = useState<CashRegister | null | undefined>(undefined);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOpenSheet, setShowOpenSheet] = useState(false);
  const [showCloseSheet, setShowCloseSheet] = useState(false);
  const [openAmount, setOpenAmount] = useState("");
  const [closeAmount, setCloseAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.get("/api/cash-register/today"),
        api.get("/api/cash-register/history?limit=10"),
      ]);
      setRegister(todayRes.data.data ?? null);
      setHistory(historyRes.data.data ?? []);
    } catch {
      setRegister(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = async () => {
    if (!openAmount) return;
    setSaving(true);
    try {
      await api.post("/api/cash-register/open", {
        openingAmount: Number(openAmount),
        notes: notes || undefined,
      });
      setShowOpenSheet(false);
      setOpenAmount("");
      setNotes("");
      load();
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!closeAmount) return;
    setSaving(true);
    try {
      await api.post("/api/cash-register/close", {
        closingAmount: Number(closeAmount),
        notes: notes || undefined,
      });
      setShowCloseSheet(false);
      setCloseAmount("");
      setNotes("");
      load();
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const openCloseSheet = () => {
    if (register) {
      setCloseAmount(String(Math.round(register.theoretical)));
    }
    setNotes("");
    setShowCloseSheet(true);
  };

  const isOpen = register?.status === "open";
  const isClosed = register?.status === "closed";
  const notOpened = register === null;

  return (
    <div>
      <PageHeader title="Caisse du jour" subtitle={formatDate(new Date().toISOString())} back />

      <div className="page-content space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton rounded-2xl" style={{ height: 80 }} />)}
          </div>
        ) : (
          <>
            {/* Statut principal */}
            {notOpened ? (
              <div className="card text-center py-10">
                <div
                  className="flex items-center justify-center rounded-2xl mx-auto mb-4"
                  style={{ width: 64, height: 64, background: "var(--color-primary-10)" }}
                >
                  <Wallet size={30} color="var(--color-primary)" />
                </div>
                <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)" }}>
                  Caisse non ouverte
                </p>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                    marginTop: 4,
                    marginBottom: 20,
                  }}
                >
                  Ouvrez la caisse pour commencer la journée
                </p>
                <button
                  onClick={() => { setNotes(""); setOpenAmount(""); setShowOpenSheet(true); }}
                  className="mx-auto flex items-center gap-2 rounded-2xl px-6 tap-feedback"
                  style={{
                    height: 52,
                    background: "var(--color-primary)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "var(--text-base)",
                  }}
                >
                  <Unlock size={18} />
                  Ouvrir la caisse
                </button>
              </div>
            ) : (
              <>
                {/* Solde théorique */}
                <div
                  className="rounded-2xl px-4 py-4"
                  style={{
                    background: isClosed ? "var(--color-surface)" : "var(--color-primary)",
                    color: isClosed ? "var(--color-text)" : "white",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        opacity: 0.8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Solde {isClosed ? "de clôture" : "théorique"}
                    </p>
                    <span
                      className="rounded-xl px-2.5 py-1"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: isClosed ? "var(--color-surface-2)" : "rgba(255,255,255,0.15)",
                        color: isClosed ? "var(--color-text-muted)" : "white",
                      }}
                    >
                      {isClosed ? "Fermée" : "Ouverte"}
                    </span>
                  </div>
                  <p
                    className="amount"
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      lineHeight: 1.1,
                      color: isClosed ? "var(--color-text)" : "white",
                    }}
                  >
                    {formatFCFA(isClosed ? Number(register!.closingAmount ?? 0) : register!.theoretical)}
                  </p>
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      marginTop: 4,
                      opacity: 0.8,
                    }}
                  >
                    Ouverture: {formatFCFA(Number(register!.openingAmount))} · par {register!.user.name}
                  </p>
                </div>

                {/* Détail du jour */}
                {isOpen && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="card text-center">
                      <div
                        className="flex items-center justify-center rounded-xl mx-auto mb-2"
                        style={{ width: 40, height: 40, background: "rgba(27,94,32,0.1)" }}
                      >
                        <TrendingUp size={18} color="var(--color-primary)" />
                      </div>
                      <p
                        className="amount"
                        style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)" }}
                      >
                        +{formatFCFA(register!.cashIn)}
                      </p>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
                        Espèces reçues
                      </p>
                    </div>
                    <div className="card text-center">
                      <div
                        className="flex items-center justify-center rounded-xl mx-auto mb-2"
                        style={{ width: 40, height: 40, background: "rgba(183,28,28,0.08)" }}
                      >
                        <TrendingDown size={18} color="var(--color-danger)" />
                      </div>
                      <p
                        className="amount"
                        style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-danger)" }}
                      >
                        -{formatFCFA(register!.totalExpenses)}
                      </p>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
                        Dépenses
                      </p>
                    </div>
                  </div>
                )}

                {/* Écart à la clôture */}
                {isClosed && register!.difference !== null && (
                  <div
                    className="card flex items-center gap-3"
                    style={{
                      background:
                        Number(register!.difference) === 0
                          ? "rgba(27,94,32,0.06)"
                          : "rgba(183,28,28,0.06)",
                      border: `1px solid ${Number(register!.difference) === 0 ? "rgba(27,94,32,0.2)" : "rgba(183,28,28,0.15)"}`,
                    }}
                  >
                    <CheckCircle2
                      size={22}
                      color={Number(register!.difference) === 0 ? "var(--color-primary)" : "var(--color-danger)"}
                    />
                    <div>
                      <p
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: 700,
                          color: Number(register!.difference) === 0
                            ? "var(--color-primary)"
                            : "var(--color-danger)",
                        }}
                      >
                        {Number(register!.difference) === 0
                          ? "Caisse équilibrée"
                          : Number(register!.difference) > 0
                          ? `Excédent de ${formatFCFA(Number(register!.difference))}`
                          : `Manque de ${formatFCFA(Math.abs(Number(register!.difference)))}`}
                      </p>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        Théorique: {formatFCFA(Number(register!.theoreticalAmount))} · Compté: {formatFCFA(Number(register!.closingAmount))}
                      </p>
                    </div>
                  </div>
                )}

                {/* CTA Fermer la caisse */}
                {isOpen && (
                  <button
                    onClick={openCloseSheet}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl tap-feedback"
                    style={{
                      height: 52,
                      background: "var(--color-primary)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "var(--text-base)",
                    }}
                  >
                    <Lock size={18} />
                    Fermer la caisse
                  </button>
                )}
              </>
            )}

            {/* Historique */}
            {history.length > 0 && (
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
                  Historique
                </p>
                <div className="space-y-2">
                  {history.map((h) => {
                    const diff = h.difference;
                    return (
                      <div key={h.id} className="card flex items-center gap-3">
                        <div
                          className="flex items-center justify-center rounded-xl shrink-0"
                          style={{
                            width: 38,
                            height: 38,
                            background:
                              h.status === "open"
                                ? "var(--color-primary-10)"
                                : "var(--color-surface-2)",
                          }}
                        >
                          {h.status === "open" ? (
                            <Unlock size={16} color="var(--color-primary)" />
                          ) : (
                            <Lock size={16} color="var(--color-text-muted)" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            style={{
                              fontSize: "var(--text-sm)",
                              fontWeight: 600,
                              color: "var(--color-text)",
                            }}
                          >
                            {formatDate(h.date)}
                          </p>
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                            Ouverture: {formatFCFA(Number(h.openingAmount))}
                          </p>
                        </div>
                        <div className="text-right">
                          {h.closingAmount !== null ? (
                            <>
                              <p
                                className="amount"
                                style={{
                                  fontSize: "var(--text-sm)",
                                  fontWeight: 700,
                                  color: "var(--color-text)",
                                }}
                              >
                                {formatFCFA(Number(h.closingAmount))}
                              </p>
                              {diff !== null && Number(diff) !== 0 && (
                                <p
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color:
                                      Number(diff) > 0
                                        ? "var(--color-primary)"
                                        : "var(--color-danger)",
                                  }}
                                >
                                  {Number(diff) > 0 ? "+" : ""}
                                  {formatFCFA(Number(diff))}
                                </p>
                              )}
                            </>
                          ) : (
                            <span
                              className="rounded-lg px-2 py-0.5"
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                background: "var(--color-primary-10)",
                                color: "var(--color-primary)",
                              }}
                            >
                              Ouverte
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Sheet: Ouvrir la caisse */}
      {showOpenSheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && setShowOpenSheet(false)}
        >
          <div
            className="rounded-t-3xl"
            style={{ background: "var(--color-surface)", padding: "1.25rem 1rem calc(2rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-4 rounded-full" style={{ width: 40, height: 4, background: "var(--color-border)" }} />
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)" }}>
                Ouvrir la caisse
              </h2>
              <button
                onClick={() => setShowOpenSheet(false)}
                className="flex items-center justify-center rounded-xl tap-feedback"
                style={{ width: 36, height: 36, background: "var(--color-surface-2)" }}
              >
                <X size={18} color="var(--color-text-muted)" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Fonds de caisse (FCFA)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={openAmount}
                  onChange={(e) => setOpenAmount(e.target.value)}
                  className="input mt-1.5 amount"
                  style={{ fontSize: "var(--text-xl)", fontWeight: 700, textAlign: "center" }}
                  autoFocus
                />
              </div>
              {/* Suggestions rapides */}
              <div className="grid grid-cols-4 gap-2">
                {[0, 5000, 10000, 20000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setOpenAmount(String(v))}
                    className="rounded-xl tap-feedback"
                    style={{
                      height: 40,
                      background: Number(openAmount) === v ? "var(--color-primary)" : "var(--color-surface-2)",
                      color: Number(openAmount) === v ? "white" : "var(--color-text-muted)",
                      fontWeight: 700,
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    {v === 0 ? "0" : `${v / 1000}k`}
                  </button>
                ))}
              </div>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Notes (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Remarque…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input mt-1.5"
                />
              </div>
              <button
                onClick={handleOpen}
                disabled={saving}
                className="w-full rounded-2xl tap-feedback"
                style={{
                  height: 52,
                  background: "var(--color-primary)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "var(--text-base)",
                }}
              >
                {saving ? "Ouverture…" : "Confirmer l'ouverture"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sheet: Fermer la caisse */}
      {showCloseSheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && setShowCloseSheet(false)}
        >
          <div
            className="rounded-t-3xl"
            style={{ background: "var(--color-surface)", padding: "1.25rem 1rem calc(2rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-4 rounded-full" style={{ width: 40, height: 4, background: "var(--color-border)" }} />
            <div className="flex items-center justify-between mb-2">
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)" }}>
                Fermer la caisse
              </h2>
              <button
                onClick={() => setShowCloseSheet(false)}
                className="flex items-center justify-center rounded-xl tap-feedback"
                style={{ width: 36, height: 36, background: "var(--color-surface-2)" }}
              >
                <X size={18} color="var(--color-text-muted)" />
              </button>
            </div>
            {register && (
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                Théorique: <strong style={{ color: "var(--color-text)" }}>{formatFCFA(register.theoretical)}</strong>
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Montant compté (FCFA)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={closeAmount}
                  onChange={(e) => setCloseAmount(e.target.value)}
                  className="input mt-1.5 amount"
                  style={{ fontSize: "var(--text-xl)", fontWeight: 700, textAlign: "center" }}
                  autoFocus
                />
              </div>
              {closeAmount && register && (
                <div
                  className="rounded-xl px-4 py-3 text-center"
                  style={{
                    background:
                      Number(closeAmount) === Math.round(register.theoretical)
                        ? "rgba(27,94,32,0.08)"
                        : "rgba(183,28,28,0.06)",
                  }}
                >
                  <p
                    className="amount"
                    style={{
                      fontSize: "var(--text-base)",
                      fontWeight: 700,
                      color:
                        Number(closeAmount) - register.theoretical === 0
                          ? "var(--color-primary)"
                          : "var(--color-danger)",
                    }}
                  >
                    {Number(closeAmount) - register.theoretical === 0
                      ? "Caisse équilibrée ✓"
                      : Number(closeAmount) - register.theoretical > 0
                      ? `Excédent +${formatFCFA(Number(closeAmount) - register.theoretical)}`
                      : `Manque ${formatFCFA(register.theoretical - Number(closeAmount))}`}
                  </p>
                </div>
              )}
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Notes (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Remarque…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input mt-1.5"
                />
              </div>
              <button
                onClick={handleClose}
                disabled={saving || !closeAmount}
                className="w-full rounded-2xl tap-feedback"
                style={{
                  height: 52,
                  background: closeAmount ? "var(--color-primary)" : "var(--color-border)",
                  color: closeAmount ? "white" : "var(--color-text-muted)",
                  fontWeight: 700,
                  fontSize: "var(--text-base)",
                }}
              >
                {saving ? "Fermeture…" : "Confirmer la fermeture"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

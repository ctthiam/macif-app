"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, User, Phone, ChevronRight,
  X, Users, CreditCard,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA } from "@/lib/api";

interface Customer {
  id: number;
  name: string;
  phone: string | null;
  type: string;
  creditBalance: number;
  totalBought: number;
  address: string | null;
}

interface NewCustomerForm {
  name: string;
  phone: string;
  type: string;
  address: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewSheet, setShowNewSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NewCustomerForm>({
    name: "",
    phone: "",
    type: "individual",
    address: "",
  });
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCustomers = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      const res = await api.get(`/api/customers?${params}`);
      setCustomers(res.data.data ?? []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, []); // eslint-disable-line

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => loadCustomers(val), 300);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.post("/api/customers", form);
      setShowNewSheet(false);
      setForm({ name: "", phone: "", type: "individual", address: "" });
      loadCustomers(search);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const totalCredit = customers.reduce((s, c) => s + Number(c.creditBalance), 0);
  const withCredit = customers.filter((c) => Number(c.creditBalance) > 0).length;

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={loading ? "…" : `${customers.length} client${customers.length > 1 ? "s" : ""}`}
        action={
          <button
            onClick={() => setShowNewSheet(true)}
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
            Client
          </button>
        }
      />

      <div className="page-content space-y-4">
        {/* Résumé créances */}
        {!loading && withCredit > 0 && (
          <div
            className="rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{
              background: "rgba(183,28,28,0.06)",
              border: "1px solid rgba(183,28,28,0.15)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 40, height: 40, background: "rgba(183,28,28,0.1)" }}
              >
                <CreditCard size={18} color="var(--color-danger)" />
              </div>
              <div>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", fontWeight: 500 }}>
                  Créances totales
                </p>
                <p
                  className="amount"
                  style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-danger)" }}
                >
                  {formatFCFA(totalCredit)}
                </p>
              </div>
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", fontWeight: 600 }}>
              {withCredit} client{withCredit > 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Recherche */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4"
          style={{
            height: 48,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <Search size={18} color="var(--color-text-muted)" />
          <input
            type="search"
            placeholder="Rechercher un client…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}
          />
          {search && (
            <button onClick={() => handleSearch("")}>
              <X size={16} color="var(--color-text-muted)" />
            </button>
          )}
        </div>

        {/* Liste */}
        {loading ? (
          <>
            {/* Mobile skeleton */}
            <div className="lg:hidden space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton rounded-2xl" style={{ height: 72 }} />
              ))}
            </div>
            {/* Desktop skeleton */}
            <div className="hidden lg:block">
              <div className="card p-0 overflow-hidden">
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid var(--color-border)", background: "var(--color-surface-2)" }}>
                      {["Client", "Téléphone", "Crédit en cours", "Total acheté"].map((col) => (
                        <th key={col} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td colSpan={4} style={{ padding: "0.75rem 1rem" }}>
                          <div className="skeleton h-10 rounded" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : customers.length === 0 ? (
          <>
            {/* Mobile empty */}
            <div className="lg:hidden card text-center py-12">
              <Users
                size={40}
                strokeWidth={1.2}
                className="mx-auto mb-3 opacity-30"
                color="var(--color-text-muted)"
              />
              <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text)" }}>
                {search ? "Aucun client trouvé" : "Aucun client encore"}
              </p>
              <p
                style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: 4 }}
              >
                {search ? "Vérifiez l'orthographe" : "Ajoutez votre premier client"}
              </p>
              {!search && (
                <button
                  onClick={() => setShowNewSheet(true)}
                  className="mx-auto mt-4 flex items-center gap-2 rounded-xl px-4 tap-feedback"
                  style={{
                    height: 44,
                    background: "var(--color-primary)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "var(--text-sm)",
                  }}
                >
                  <Plus size={16} />
                  Ajouter un client
                </button>
              )}
            </div>
            {/* Desktop empty */}
            <div className="hidden lg:block">
              <div className="card p-0 overflow-hidden">
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid var(--color-border)", background: "var(--color-surface-2)" }}>
                      {["Client", "Téléphone", "Crédit en cours", "Total acheté"].map((col) => (
                        <th key={col} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={4} style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                        {search ? "Aucun client trouvé" : "Aucun client encore"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden space-y-2">
              {customers.map((customer) => {
                const hasCredit = Number(customer.creditBalance) > 0;
                return (
                  <button
                    key={customer.id}
                    onClick={() => router.push(`/clients/${customer.id}`)}
                    className="card w-full flex items-center gap-3 text-left tap-feedback"
                    style={{ padding: "0.75rem" }}
                  >
                    <div
                      className="flex items-center justify-center rounded-xl shrink-0 font-bold"
                      style={{
                        width: 42,
                        height: 42,
                        background: hasCredit
                          ? "rgba(183,28,28,0.1)"
                          : "var(--color-primary-10)",
                        color: hasCredit ? "var(--color-danger)" : "var(--color-primary)",
                        fontSize: "var(--text-base)",
                      }}
                    >
                      {customer.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: 700,
                          color: "var(--color-text)",
                        }}
                        className="truncate"
                      >
                        {customer.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {customer.phone && (
                          <div
                            className="flex items-center gap-1"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            <Phone size={11} />
                            <span style={{ fontSize: "var(--text-xs)" }}>{customer.phone}</span>
                          </div>
                        )}
                        {customer.type === "business" && (
                          <span
                            className="rounded-md px-1.5 py-0.5"
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              background: "var(--color-primary-10)",
                              color: "var(--color-primary)",
                            }}
                          >
                            Pro
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {hasCredit ? (
                        <>
                          <p
                            className="amount"
                            style={{
                              fontSize: "var(--text-sm)",
                              fontWeight: 700,
                              color: "var(--color-danger)",
                            }}
                          >
                            -{formatFCFA(Number(customer.creditBalance))}
                          </p>
                          <p
                            style={{
                              fontSize: 10,
                              color: "var(--color-danger)",
                              opacity: 0.7,
                              fontWeight: 500,
                            }}
                          >
                            crédit dû
                          </p>
                        </>
                      ) : (
                        <ChevronRight size={16} color="var(--color-text-light)" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block">
              <div className="card p-0 overflow-hidden">
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid var(--color-border)", background: "var(--color-surface-2)" }}>
                      {["Client", "Téléphone", "Crédit en cours", "Total acheté"].map((col) => (
                        <th key={col} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => {
                      const hasCredit = Number(customer.creditBalance) > 0;
                      return (
                        <tr
                          key={customer.id}
                          onClick={() => router.push(`/clients/${customer.id}`)}
                          className="tap-feedback"
                          style={{ borderBottom: "1px solid var(--color-border)", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {/* Client */}
                          <td style={{ padding: "0.875rem 1rem", fontSize: "var(--text-sm)", maxWidth: 260 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontWeight: 700, color: "var(--color-text)" }} className="truncate">{customer.name}</span>
                              {customer.type === "individual" ? (
                                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>Particulier</span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    background: "var(--color-primary-10)",
                                    color: "var(--color-primary)",
                                    borderRadius: 4,
                                    padding: "1px 6px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Professionnel
                                </span>
                              )}
                            </div>
                          </td>
                          {/* Téléphone */}
                          <td style={{ padding: "0.875rem 1rem", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                            {customer.phone ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                          </td>
                          {/* Crédit en cours */}
                          <td style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}>
                            {hasCredit ? (
                              <span className="amount" style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>
                                {formatFCFA(Number(customer.creditBalance))}
                              </span>
                            ) : (
                              <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>—</span>
                            )}
                          </td>
                          {/* Total acheté */}
                          <td style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}>
                            <span className="amount" style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>
                              {formatFCFA(Number(customer.totalBought))}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setShowNewSheet(true)}>
        <Plus size={20} strokeWidth={2.5} />
        Nouveau client
      </button>

      {/* Bottom sheet: Nouveau client */}
      {showNewSheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && setShowNewSheet(false)}
        >
          <div
            className="rounded-t-3xl"
            style={{
              background: "var(--color-surface)",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1rem 0.5rem" }}>
              {/* Handle */}
              <div
                className="mx-auto mb-4 rounded-full"
                style={{ width: 40, height: 4, background: "var(--color-border)" }}
              />

              <div className="flex items-center justify-between mb-5">
                <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)" }}>
                  Nouveau client
                </h2>
                <button
                  onClick={() => setShowNewSheet(false)}
                  className="flex items-center justify-center rounded-xl tap-feedback"
                  style={{ width: 36, height: 36, background: "var(--color-surface-2)" }}
                >
                  <X size={18} color="var(--color-text-muted)" />
                </button>
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
                    Nom *
                  </label>
                  <input
                    type="text"
                    placeholder="Amadou Diallo"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="input mt-1.5"
                    autoFocus
                  />
                </div>

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
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    placeholder="77 000 00 00"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="input mt-1.5"
                  />
                </div>

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
                    Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {[
                      { value: "individual", label: "Particulier" },
                      { value: "business", label: "Professionnel" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setForm((f) => ({ ...f, type: opt.value }))}
                        className="rounded-xl tap-feedback"
                        style={{
                          height: 44,
                          fontWeight: 600,
                          fontSize: "var(--text-sm)",
                          background:
                            form.type === opt.value
                              ? "var(--color-primary)"
                              : "var(--color-surface-2)",
                          color:
                            form.type === opt.value ? "white" : "var(--color-text-muted)",
                          border: "none",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

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
                    Adresse (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Quartier, Ville"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="input mt-1.5"
                  />
                </div>
              </div>
            </div>
            <div style={{ padding: "0.75rem 1rem calc(1rem + env(safe-area-inset-bottom))", flexShrink: 0 }}>
              <button
                onClick={handleCreate}
                disabled={saving || !form.name.trim()}
                className="w-full rounded-2xl tap-feedback"
                style={{
                  height: 52,
                  background: form.name.trim() ? "var(--color-primary)" : "var(--color-border)",
                  color: form.name.trim() ? "white" : "var(--color-text-muted)",
                  fontWeight: 700,
                  fontSize: "var(--text-base)",
                  marginTop: "0.5rem",
                }}
              >
                {saving ? "Enregistrement…" : "Créer le client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

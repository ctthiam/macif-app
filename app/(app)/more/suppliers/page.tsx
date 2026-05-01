"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, X, Truck, Phone, ChevronRight, ShoppingBag } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA } from "@/lib/api";

interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  debtBalance: number;
  _count: { purchases: number };
}

interface NewForm { name: string; phone: string; address: string; }

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NewForm>({ name: "", phone: "", address: "" });
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : "";
      const res = await api.get(`/api/suppliers${params}`);
      setSuppliers(res.data.data ?? []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => load(val), 300);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.post("/api/suppliers", form);
      setShowSheet(false);
      setForm({ name: "", phone: "", address: "" });
      load(search);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const totalDebt = suppliers.reduce((s, sup) => s + Number(sup.debtBalance), 0);

  return (
    <div>
      <PageHeader
        title="Fournisseurs"
        subtitle={loading ? "…" : `${suppliers.length} fournisseur${suppliers.length > 1 ? "s" : ""}`}
        back
        action={
          <button
            onClick={() => setShowSheet(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 tap-feedback"
            style={{ height: 36, background: "var(--color-primary)", color: "white", fontWeight: 700, fontSize: "var(--text-sm)" }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Fournisseur
          </button>
        }
      />

      <div className="page-content space-y-4">
        {/* Dette totale */}
        {!loading && totalDebt > 0 && (
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: "rgba(201,149,42,0.08)", border: "1px solid rgba(201,149,42,0.2)" }}
          >
            <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 44, height: 44, background: "rgba(201,149,42,0.12)" }}>
              <Truck size={20} color="var(--color-accent)" />
            </div>
            <div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", fontWeight: 500 }}>
                Dettes fournisseurs
              </p>
              <p className="amount" style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-accent)" }}>
                {formatFCFA(totalDebt)}
              </p>
            </div>
          </div>
        )}

        {/* Recherche */}
        <div className="flex items-center gap-3 rounded-2xl px-4" style={{ height: 48, background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <Search size={18} color="var(--color-text-muted)" />
          <input
            type="search"
            placeholder="Rechercher…"
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
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton rounded-2xl" style={{ height: 72 }} />)}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="card text-center py-12">
            <Truck size={40} strokeWidth={1.2} className="mx-auto mb-3 opacity-30" color="var(--color-text-muted)" />
            <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text)" }}>
              {search ? "Aucun résultat" : "Aucun fournisseur"}
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: 4 }}>
              {!search && "Ajoutez vos fournisseurs pour gérer vos achats"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {suppliers.map((sup) => {
              const hasDebt = Number(sup.debtBalance) > 0;
              return (
                <button
                  key={sup.id}
                  onClick={() => router.push(`/more/suppliers/${sup.id}`)}
                  className="card w-full flex items-center gap-3 text-left tap-feedback"
                  style={{ padding: "0.75rem" }}
                >
                  <div
                    className="flex items-center justify-center rounded-xl shrink-0 font-bold"
                    style={{
                      width: 42,
                      height: 42,
                      background: hasDebt ? "rgba(201,149,42,0.12)" : "var(--color-primary-10)",
                      color: hasDebt ? "var(--color-accent)" : "var(--color-primary)",
                      fontSize: "var(--text-base)",
                    }}
                  >
                    {sup.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)" }}>
                      {sup.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {sup.phone && (
                        <div className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                          <Phone size={11} />
                          <span style={{ fontSize: "var(--text-xs)" }}>{sup.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                        <ShoppingBag size={11} />
                        <span style={{ fontSize: "var(--text-xs)" }}>{sup._count.purchases} achat{sup._count.purchases > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {hasDebt ? (
                      <>
                        <p className="amount" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-accent)" }}>
                          {formatFCFA(Number(sup.debtBalance))}
                        </p>
                        <p style={{ fontSize: 10, color: "var(--color-accent)", opacity: 0.8, fontWeight: 500 }}>
                          dette
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
        )}
      </div>

      <button className="fab" onClick={() => setShowSheet(true)}>
        <Plus size={20} strokeWidth={2.5} />
        Nouveau fournisseur
      </button>

      {showSheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && setShowSheet(false)}
        >
          <div className="rounded-t-3xl" style={{ background: "var(--color-surface)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1rem 0.5rem" }}>
              <div className="mx-auto mb-4 rounded-full" style={{ width: 40, height: 4, background: "var(--color-border)" }} />
              <div className="flex items-center justify-between mb-5">
                <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)" }}>
                  Nouveau fournisseur
                </h2>
                <button onClick={() => setShowSheet(false)} className="flex items-center justify-center rounded-xl tap-feedback" style={{ width: 36, height: 36, background: "var(--color-surface-2)" }}>
                  <X size={18} color="var(--color-text-muted)" />
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { key: "name", label: "Nom *", placeholder: "Diallo Matériaux", type: "text" },
                  { key: "phone", label: "Téléphone", placeholder: "77 000 00 00", type: "tel" },
                  { key: "address", label: "Adresse (optionnel)", placeholder: "Quartier, Ville", type: "text" },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {label}
                    </label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key as keyof NewForm]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="input mt-1.5"
                      autoFocus={key === "name"}
                    />
                  </div>
                ))}
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
                }}
              >
                {saving ? "Enregistrement…" : "Créer le fournisseur"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

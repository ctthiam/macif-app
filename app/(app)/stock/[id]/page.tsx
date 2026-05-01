"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Package, Edit2, Trash2, Plus, Minus, TrendingUp,
  TrendingDown, AlertTriangle, X, Check, ArrowUpDown,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA, formatDate, formatTime } from "@/lib/api";

interface StockMovement {
  id: number;
  type: string;
  quantity: number;
  unitPrice: number | null;
  note: string | null;
  referenceType: string | null;
  createdAt: string;
  user: { name: string };
}

interface Product {
  id: number;
  name: string;
  reference: string | null;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  sellPriceGros: number | null;
  stockQty: number;
  stockAlert: number;
  photoUrl: string | null;
  category: { name: string; icon?: string; color?: string } | null;
  stockMovements: StockMovement[];
}

interface EditForm {
  name: string;
  unit: string;
  sellPrice: string;
  sellPriceGros: string;
  buyPrice: string;
  stockAlert: string;
}

const MOVEMENT_ICONS: Record<string, { color: string; sign: string }> = {
  sale:       { color: "#1B5E20", sign: "-" },
  purchase:   { color: "#00B9FF", sign: "+" },
  adjustment: { color: "#C9952A", sign: "±" },
  return:     { color: "#5C35A0", sign: "+" },
  loss:       { color: "#B71C1C", sign: "-" },
};

const MOVEMENT_LABELS: Record<string, string> = {
  sale:       "Vente",
  purchase:   "Achat",
  adjustment: "Ajustement",
  return:     "Retour",
  loss:       "Perte",
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [editForm, setEditForm] = useState<EditForm>({
    name: "", unit: "", sellPrice: "", sellPriceGros: "", buyPrice: "", stockAlert: "",
  });

  const load = () => {
    api
      .get(`/api/products/${id}`)
      .then((r) => {
        const p = r.data.data;
        setProduct(p);
        setEditForm({
          name: p.name,
          unit: p.unit,
          sellPrice: String(p.sellPrice),
          sellPriceGros: p.sellPriceGros ? String(p.sellPriceGros) : "",
          buyPrice: String(p.buyPrice),
          stockAlert: String(p.stockAlert),
        });
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const handleSaveEdit = async () => {
    if (!editForm.name || !editForm.sellPrice) return;
    setSaving(true);
    try {
      await api.patch(`/api/products/${id}`, {
        name: editForm.name,
        unit: editForm.unit,
        sellPrice: Number(editForm.sellPrice),
        sellPriceGros: editForm.sellPriceGros ? Number(editForm.sellPriceGros) : undefined,
        buyPrice: Number(editForm.buyPrice) || 0,
        stockAlert: Number(editForm.stockAlert) || 5,
      });
      setShowEdit(false);
      load();
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async () => {
    const qty = Number(adjustQty);
    if (!qty || qty === 0) return;
    setSaving(true);
    try {
      await api.post(`/api/products/${id}/adjust-stock`, {
        quantity: qty,
        note: adjustNote || undefined,
      });
      setShowAdjust(false);
      setAdjustQty("");
      setAdjustNote("");
      load();
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/products/${id}`);
      router.back();
    } catch {
      //
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Produit" back />
        <div className="page-content space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton rounded-2xl" style={{ height: 80 }} />)}
        </div>
      </div>
    );
  }

  if (!product) return null;

  const isLow = Number(product.stockQty) <= Number(product.stockAlert);
  const isOut = Number(product.stockQty) === 0;
  const margin =
    product.buyPrice > 0
      ? Math.round(((Number(product.sellPrice) - Number(product.buyPrice)) / Number(product.sellPrice)) * 100)
      : null;

  return (
    <div>
      <PageHeader
        title={product.name}
        subtitle={product.category?.name ?? "Produit"}
        back
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center justify-center rounded-xl tap-feedback"
              style={{ width: 36, height: 36, background: "var(--color-primary-10)" }}
            >
              <Edit2 size={16} color="var(--color-primary)" />
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center justify-center rounded-xl tap-feedback"
              style={{ width: 36, height: 36, background: "rgba(183,28,28,0.08)" }}
            >
              <Trash2 size={16} color="var(--color-danger)" />
            </button>
          </div>
        }
      />

      <div className="page-content space-y-4">
        {/* Stock principal */}
        <div
          className="rounded-2xl px-4 py-4"
          style={{
            background: isOut
              ? "var(--color-danger)"
              : isLow
              ? "rgba(201,149,42,0.08)"
              : "var(--color-primary)",
            border: isLow && !isOut ? "1px solid rgba(201,149,42,0.3)" : "none",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                color: isOut ? "rgba(255,255,255,0.8)" : isLow ? "var(--color-warning)" : "rgba(255,255,255,0.8)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Stock actuel
            </p>
            {isOut ? (
              <span className="badge-danger">Épuisé</span>
            ) : isLow ? (
              <span className="badge-warning flex items-center gap-1">
                <AlertTriangle size={10} />
                Stock bas
              </span>
            ) : null}
          </div>
          <p
            className="amount"
            style={{
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1,
              color: isOut ? "white" : isLow ? "var(--color-warning)" : "white",
            }}
          >
            {Number(product.stockQty)}
          </p>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: isOut ? "rgba(255,255,255,0.75)" : isLow ? "var(--color-text-muted)" : "rgba(255,255,255,0.75)",
              marginTop: 4,
            }}
          >
            {product.unit} · Alerte à {Number(product.stockAlert)} {product.unit}
          </p>
        </div>

        {/* Prix */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Prix de vente
            </p>
            <p className="amount" style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)", marginTop: 4 }}>
              {formatFCFA(Number(product.sellPrice))}
            </p>
            {margin !== null && (
              <p style={{ fontSize: 10, color: margin >= 20 ? "var(--color-primary)" : "var(--color-warning)", fontWeight: 600, marginTop: 2 }}>
                Marge {margin}%
              </p>
            )}
          </div>
          <div className="card text-center">
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Prix d'achat
            </p>
            <p className="amount" style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)", marginTop: 4 }}>
              {Number(product.buyPrice) > 0 ? formatFCFA(Number(product.buyPrice)) : "—"}
            </p>
            {product.sellPriceGros && (
              <p style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 2 }}>
                Gros: {formatFCFA(Number(product.sellPriceGros))}
              </p>
            )}
          </div>
        </div>

        {/* CTA Ajustement */}
        <button
          onClick={() => { setAdjustQty(""); setAdjustNote(""); setShowAdjust(true); }}
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
          <ArrowUpDown size={18} strokeWidth={2.5} />
          Ajuster le stock
        </button>

        {/* Mouvements de stock */}
        {product.stockMovements.length > 0 && (
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
              Mouvements récents
            </p>
            <div className="card space-y-0 p-0 overflow-hidden">
              {product.stockMovements.map((mv, idx) => {
                const meta = MOVEMENT_ICONS[mv.type] ?? { color: "#666", sign: "±" };
                const isPositive = Number(mv.quantity) > 0;
                return (
                  <div
                    key={mv.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: idx > 0 ? "1px solid var(--color-border)" : "none" }}
                  >
                    <div
                      className="flex items-center justify-center rounded-xl shrink-0"
                      style={{ width: 36, height: 36, background: `${meta.color}12` }}
                    >
                      {isPositive ? (
                        <TrendingUp size={15} color={meta.color} />
                      ) : (
                        <TrendingDown size={15} color={meta.color} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
                        {MOVEMENT_LABELS[mv.type] ?? mv.type}
                        {mv.note && (
                          <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}> · {mv.note}</span>
                        )}
                      </p>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        {formatDate(mv.createdAt)} {formatTime(mv.createdAt)} · {mv.user.name}
                      </p>
                    </div>
                    <p
                      className="amount shrink-0"
                      style={{
                        fontSize: "var(--text-base)",
                        fontWeight: 700,
                        color: Number(mv.quantity) > 0 ? "var(--color-primary)" : "var(--color-danger)",
                      }}
                    >
                      {Number(mv.quantity) > 0 ? "+" : ""}
                      {Number(mv.quantity)} {product.unit}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Sheet: Ajustement stock */}
      {showAdjust && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && setShowAdjust(false)}
        >
          <div className="rounded-t-3xl" style={{ background: "var(--color-surface)", padding: "1.25rem 1rem calc(2rem + env(safe-area-inset-bottom))" }}>
            <div className="mx-auto mb-4 rounded-full" style={{ width: 40, height: 4, background: "var(--color-border)" }} />
            <div className="flex items-center justify-between mb-2">
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)" }}>
                Ajuster le stock
              </h2>
              <button onClick={() => setShowAdjust(false)} className="flex items-center justify-center rounded-xl tap-feedback" style={{ width: 36, height: 36, background: "var(--color-surface-2)" }}>
                <X size={18} color="var(--color-text-muted)" />
              </button>
            </div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              Stock actuel: <strong style={{ color: "var(--color-text)" }}>{Number(product.stockQty)} {product.unit}</strong>
            </p>

            <div className="space-y-4">
              {/* Contrôle ± */}
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Quantité (+ pour ajouter, - pour retirer)
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => setAdjustQty((v) => String(Number(v || "0") - 1))}
                    className="flex items-center justify-center rounded-xl tap-feedback shrink-0"
                    style={{ width: 48, height: 48, background: "rgba(183,28,28,0.08)", border: "none" }}
                  >
                    <Minus size={20} color="var(--color-danger)" strokeWidth={2.5} />
                  </button>
                  <input
                    type="number"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="input amount flex-1"
                    style={{ fontSize: "var(--text-xl)", fontWeight: 700, textAlign: "center" }}
                    placeholder="0"
                    autoFocus
                  />
                  <button
                    onClick={() => setAdjustQty((v) => String(Number(v || "0") + 1))}
                    className="flex items-center justify-center rounded-xl tap-feedback shrink-0"
                    style={{ width: 48, height: 48, background: "rgba(27,94,32,0.08)", border: "none" }}
                  >
                    <Plus size={20} color="var(--color-primary)" strokeWidth={2.5} />
                  </button>
                </div>
                {adjustQty && Number(adjustQty) !== 0 && (
                  <p
                    className="text-center mt-2 amount"
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: 700,
                      color: Number(adjustQty) > 0 ? "var(--color-primary)" : "var(--color-danger)",
                    }}
                  >
                    Nouveau stock: {Number(product.stockQty) + Number(adjustQty)} {product.unit}
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Raison (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Inventaire, perte, retour fournisseur…"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="input mt-1.5"
                />
              </div>

              <button
                onClick={handleAdjust}
                disabled={saving || !adjustQty || Number(adjustQty) === 0}
                className="w-full rounded-2xl tap-feedback"
                style={{
                  height: 52,
                  background: adjustQty && Number(adjustQty) !== 0 ? "var(--color-primary)" : "var(--color-border)",
                  color: adjustQty && Number(adjustQty) !== 0 ? "white" : "var(--color-text-muted)",
                  fontWeight: 700,
                  fontSize: "var(--text-base)",
                }}
              >
                {saving ? "Enregistrement…" : "Confirmer l'ajustement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sheet: Modifier produit */}
      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}
        >
          <div
            className="rounded-t-3xl"
            style={{ background: "var(--color-surface)", padding: "1.25rem 1rem calc(2rem + env(safe-area-inset-bottom))", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="mx-auto mb-4 rounded-full" style={{ width: 40, height: 4, background: "var(--color-border)" }} />
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)" }}>
                Modifier le produit
              </h2>
              <button onClick={() => setShowEdit(false)} className="flex items-center justify-center rounded-xl tap-feedback" style={{ width: 36, height: 36, background: "var(--color-surface-2)" }}>
                <X size={18} color="var(--color-text-muted)" />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { key: "name", label: "Nom *", type: "text", placeholder: "Nom du produit" },
                { key: "unit", label: "Unité", type: "text", placeholder: "pièce, kg, sac…" },
                { key: "sellPrice", label: "Prix de vente *", type: "number", placeholder: "0" },
                { key: "sellPriceGros", label: "Prix gros (optionnel)", type: "number", placeholder: "0" },
                { key: "buyPrice", label: "Prix d'achat", type: "number", placeholder: "0" },
                { key: "stockAlert", label: "Seuil d'alerte", type: "number", placeholder: "5" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    inputMode={type === "number" ? "numeric" : undefined}
                    placeholder={placeholder}
                    value={editForm[key as keyof EditForm]}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                    className={`input mt-1.5${type === "number" ? " amount" : ""}`}
                  />
                </div>
              ))}

              <button
                onClick={handleSaveEdit}
                disabled={saving || !editForm.name || !editForm.sellPrice}
                className="w-full rounded-2xl tap-feedback"
                style={{
                  height: 52,
                  background: editForm.name && editForm.sellPrice ? "var(--color-primary)" : "var(--color-border)",
                  color: editForm.name && editForm.sellPrice ? "white" : "var(--color-text-muted)",
                  fontWeight: 700,
                  fontSize: "var(--text-base)",
                }}
              >
                {saving ? "Enregistrement…" : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-3xl w-full max-w-sm" style={{ background: "var(--color-surface)", padding: "1.5rem" }}>
            <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.5rem" }}>
              Archiver "{product.name}" ?
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Le produit sera masqué du stock mais l'historique des ventes sera conservé.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowDelete(false)} className="rounded-2xl tap-feedback" style={{ height: 48, background: "var(--color-surface-2)", color: "var(--color-text)", fontWeight: 700 }}>
                Annuler
              </button>
              <button onClick={handleDelete} className="rounded-2xl tap-feedback" style={{ height: 48, background: "var(--color-danger)", color: "white", fontWeight: 700 }}>
                Archiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

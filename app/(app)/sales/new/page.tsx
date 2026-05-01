"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, Plus, Minus, Trash2, ChevronDown,
  CheckCircle2, Banknote, Smartphone, CreditCard, ArrowLeft,
} from "lucide-react";
import api, { formatFCFA } from "@/lib/api";
import { useCartStore } from "@/store/cart.store";

interface Product {
  id: number;
  name: string;
  unit: string;
  sellPrice: number;
  sellPriceGros?: number;
  stockQty: number;
  category?: { name: string; icon?: string };
}

const PAYMENT_METHODS = [
  { key: "cash", label: "Espèces", icon: Banknote, color: "#1B5E20" },
  { key: "wave", label: "Wave", icon: Smartphone, color: "#00B9FF" },
  { key: "orange_money", label: "Orange Money", icon: Smartphone, color: "#FF6600" },
  { key: "credit", label: "Crédit", icon: CreditCard, color: "#B71C1C" },
];

export default function NewSalePage() {
  const router = useRouter();
  const { items, addItem, updateQty, removeItem, clear, total } = useCartStore();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customQty, setCustomQty] = useState("1");
  const [customPrice, setCustomPrice] = useState("");
  const [step, setStep] = useState<"cart" | "payment">("cart");
  const searchRef = useRef<HTMLInputElement>(null);

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get(`/api/products?search=${encodeURIComponent(q)}`);
      setResults(res.data.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(search), 250);
    return () => clearTimeout(t);
  }, [search, searchProducts]);

  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    setCustomQty("1");
    setCustomPrice(String(p.sellPrice));
    setSearch("");
    setResults([]);
  };

  const confirmAdd = () => {
    if (!selectedProduct) return;
    const qty = parseFloat(customQty) || 1;
    const price = parseFloat(customPrice) || selectedProduct.sellPrice;
    addItem(selectedProduct, qty, price);
    setSelectedProduct(null);
    searchRef.current?.focus();
  };

  const cartTotal = total();
  const discount = 0;
  const netTotal = cartTotal - discount;
  const cash = parseFloat(cashReceived) || 0;
  const change = Math.max(0, cash - netTotal);
  const creditAmount = paymentMethod === "credit" ? netTotal : Math.max(0, netTotal - cash);

  const canValidate =
    items.length > 0 &&
    (paymentMethod === "credit" || paymentMethod === "wave" || paymentMethod === "orange_money" || cash >= netTotal);

  const submitSale = async () => {
    if (!canValidate) return;
    setSubmitting(true);
    try {
      await api.post("/api/sales", {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        paymentMethod,
        paidAmount: paymentMethod === "cash" ? cash : paymentMethod === "credit" ? 0 : netTotal,
        discount,
      });
      clear();
      setSuccess(true);
      // Vibration si supporté
      if ("vibrate" in navigator) navigator.vibrate(100);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Erreur lors de la vente");
    } finally {
      setSubmitting(false);
    }
  };

  // Écran de succès
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-background)]">
        <div className="text-center">
          <div
            className="flex items-center justify-center rounded-full mx-auto mb-4"
            style={{ width: 80, height: 80, background: "var(--color-success-50)" }}
          >
            <CheckCircle2 size={44} color="var(--color-success)" />
          </div>
          <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text)" }}>
            Vente enregistrée !
          </h2>
          {paymentMethod === "cash" && change > 0 && (
            <div
              className="mt-4 rounded-2xl px-6 py-4"
              style={{ background: "var(--color-accent)", display: "inline-block" }}
            >
              <p style={{ color: "white", fontSize: "var(--text-sm)", fontWeight: 600 }}>
                Monnaie à rendre
              </p>
              <p className="amount" style={{ color: "white", fontSize: "var(--text-3xl)", fontWeight: 900 }}>
                {formatFCFA(change)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]" style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
        style={{ background: "var(--color-surface)", boxShadow: "0 1px 0 var(--color-border)", minHeight: 56 }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center rounded-xl tap-feedback"
          style={{ width: 40, height: 40, background: "var(--color-surface-2)", flexShrink: 0 }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 700, flex: 1 }}>
          {step === "cart" ? "Nouvelle vente" : "Paiement"}
        </h1>
        {items.length > 0 && step === "cart" && (
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: 24, height: 24,
              background: "var(--color-primary)",
              color: "white",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
            }}
          >
            {items.length}
          </span>
        )}
      </header>

      {step === "cart" ? (
        <div className="flex-1 flex flex-col px-4 pt-3 pb-32 space-y-4">
          {/* Recherche produit */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--color-text-muted)" />
            <input
              ref={searchRef}
              className="input pl-10 pr-10"
              placeholder="Chercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              type="search"
            />
            {search && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => { setSearch(""); setResults([]); }}>
                <X size={16} color="var(--color-text-muted)" />
              </button>
            )}
          </div>

          {/* Résultats recherche */}
          {results.length > 0 && (
            <div className="card p-0 overflow-hidden">
              {results.slice(0, 6).map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => selectProduct(p)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left tap-feedback"
                  style={{ borderTop: i > 0 ? "1px solid var(--color-border)" : "none" }}
                >
                  <div
                    className="flex items-center justify-center rounded-lg shrink-0 text-base"
                    style={{ width: 36, height: 36, background: "var(--color-surface-2)" }}
                  >
                    {p.category?.icon ?? "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }} className="truncate">
                      {p.name}
                    </p>
                    <p style={{ fontSize: "var(--text-xs)", color: Number(p.stockQty) <= 0 ? "var(--color-danger)" : "var(--color-text-muted)" }}>
                      Stock: {p.stockQty} {p.unit}
                    </p>
                  </div>
                  <p className="amount shrink-0" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)" }}>
                    {formatFCFA(p.sellPrice)}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Popup ajout produit */}
          {selectedProduct && (
            <div
              className="fixed inset-0 z-50 flex items-end"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setSelectedProduct(null)}
            >
              <div
                className="w-full rounded-t-3xl space-y-4"
                style={{ background: "var(--color-surface)", maxWidth: 480, margin: "0 auto", padding: "1.5rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom))" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--color-text)" }}>
                      {selectedProduct.name}
                    </p>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      Stock disponible: {selectedProduct.stockQty} {selectedProduct.unit}
                    </p>
                  </div>
                  <button onClick={() => setSelectedProduct(null)}>
                    <X size={20} color="var(--color-text-muted)" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", display: "block", marginBottom: "0.5rem" }}>
                      Quantité ({selectedProduct.unit})
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCustomQty((q) => String(Math.max(1, parseFloat(q) - 1)))}
                        className="flex items-center justify-center rounded-lg tap-feedback"
                        style={{ width: 40, height: 40, background: "var(--color-surface-2)", flexShrink: 0 }}
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        className="input text-center amount"
                        value={customQty}
                        onChange={(e) => setCustomQty(e.target.value)}
                        type="number"
                        inputMode="decimal"
                        min="0.001"
                        style={{ padding: "0.5rem" }}
                      />
                      <button
                        onClick={() => setCustomQty((q) => String(parseFloat(q) + 1))}
                        className="flex items-center justify-center rounded-lg tap-feedback"
                        style={{ width: 40, height: 40, background: "var(--color-surface-2)", flexShrink: 0 }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", display: "block", marginBottom: "0.5rem" }}>
                      Prix unitaire (FCFA)
                    </label>
                    <input
                      className="input amount"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      type="number"
                      inputMode="numeric"
                    />
                    {selectedProduct.sellPriceGros && (
                      <button
                        onClick={() => setCustomPrice(String(selectedProduct.sellPriceGros))}
                        style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", fontWeight: 600, marginTop: "0.25rem" }}
                      >
                        Prix gros: {formatFCFA(selectedProduct.sellPriceGros)}
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: "var(--color-primary-50)" }}
                >
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 600 }}>Total article</span>
                  <span className="amount" style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--color-primary)" }}>
                    {formatFCFA((parseFloat(customQty) || 1) * (parseFloat(customPrice) || selectedProduct.sellPrice))}
                  </span>
                </div>

                <button onClick={confirmAdd} className="btn-primary">
                  Ajouter au panier
                </button>
              </div>
            </div>
          )}

          {/* Panier */}
          {items.length > 0 && (
            <div>
              <h2 style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                Panier ({items.length})
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.productId} className="card" style={{ padding: "0.75rem" }}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }} className="truncate">
                          {item.name}
                        </p>
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                          {formatFCFA(item.unitPrice)} / {item.unit}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="tap-feedback"
                        style={{ color: "var(--color-danger)", padding: "0.25rem" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.productId, item.quantity - 1)}
                          className="flex items-center justify-center rounded-lg tap-feedback"
                          style={{ width: 32, height: 32, background: "var(--color-surface-2)" }}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="amount" style={{ fontSize: "var(--text-base)", fontWeight: 700, minWidth: 40, textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.productId, Math.min(item.quantity + 1, item.stockQty))}
                          className="flex items-center justify-center rounded-lg tap-feedback"
                          style={{ width: 32, height: 32, background: "var(--color-surface-2)" }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="amount" style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text)" }}>
                        {formatFCFA(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {items.length === 0 && !search && (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="text-center" style={{ color: "var(--color-text-muted)" }}>
                <Search size={40} strokeWidth={1.5} className="mx-auto mb-3 opacity-40" />
                <p style={{ fontWeight: 600 }}>Cherchez un produit pour commencer</p>
                <p style={{ fontSize: "var(--text-sm)", opacity: 0.7 }}>Tapez le nom dans la barre de recherche</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Étape paiement
        <div className="flex-1 flex flex-col px-4 pt-4 pb-32 space-y-4">
          {/* Récap */}
          <div className="card" style={{ background: "var(--color-primary)", padding: "1.25rem" }}>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
              Total à payer
            </p>
            <p className="amount" style={{ color: "white", fontSize: "var(--text-4xl)", fontWeight: 900, lineHeight: 1 }}>
              {formatFCFA(netTotal)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "var(--text-xs)", marginTop: "0.25rem" }}>
              {items.length} article{items.length > 1 ? "s" : ""}
            </p>
          </div>

          {/* Mode de paiement */}
          <div>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.75rem" }}>
              Mode de paiement
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  className="tap-feedback flex items-center gap-2 rounded-xl px-4"
                  style={{
                    height: 52,
                    background: paymentMethod === key ? `${color}18` : "var(--color-surface)",
                    border: `2px solid ${paymentMethod === key ? color : "var(--color-border)"}`,
                    color: paymentMethod === key ? color : "var(--color-text-muted)",
                    fontWeight: paymentMethod === key ? 700 : 500,
                    fontSize: "var(--text-sm)",
                  }}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Montant reçu (espèces uniquement) */}
          {paymentMethod === "cash" && (
            <div>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)", display: "block", marginBottom: "0.5rem" }}>
                Montant reçu (FCFA)
              </label>
              <input
                className="input amount"
                style={{ fontSize: "var(--text-xl)", fontWeight: 700, textAlign: "center" }}
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                type="number"
                inputMode="numeric"
                placeholder={String(netTotal)}
                autoFocus
              />

              {/* Suggestions montants */}
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {[netTotal, Math.ceil(netTotal / 1000) * 1000, Math.ceil(netTotal / 5000) * 5000, Math.ceil(netTotal / 10000) * 10000]
                  .filter((v, i, arr) => arr.indexOf(v) === i)
                  .slice(0, 4)
                  .map((v) => (
                    <button
                      key={v}
                      onClick={() => setCashReceived(String(v))}
                      className="shrink-0 px-3 rounded-full tap-feedback"
                      style={{
                        height: 34,
                        background: cash === v ? "var(--color-primary)" : "var(--color-surface)",
                        color: cash === v ? "white" : "var(--color-text-muted)",
                        border: `1.5px solid ${cash === v ? "var(--color-primary)" : "var(--color-border)"}`,
                        fontSize: "var(--text-sm)",
                        fontWeight: 600,
                      }}
                    >
                      {formatFCFA(v)}
                    </button>
                  ))}
              </div>

              {/* Monnaie à rendre — affichage prominent */}
              {cash > 0 && (
                <div
                  className="rounded-2xl px-4 py-4 mt-3 text-center"
                  style={{
                    background: change >= 0 ? "var(--color-accent)" : "var(--color-danger-50)",
                    border: change < 0 ? "2px solid var(--color-danger)" : "none",
                  }}
                >
                  <p style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 700,
                    color: change >= 0 ? "rgba(255,255,255,0.85)" : "var(--color-danger)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    {change >= 0 ? "Monnaie à rendre" : "Montant insuffisant"}
                  </p>
                  <p className="amount" style={{
                    fontSize: "var(--text-3xl)",
                    fontWeight: 900,
                    color: change >= 0 ? "white" : "var(--color-danger)",
                    lineHeight: 1.1,
                  }}>
                    {change >= 0 ? formatFCFA(change) : formatFCFA(Math.abs(cash - netTotal))}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Barre bas fixe */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
        style={{
          background: "var(--color-surface)",
          boxShadow: "0 -1px 0 var(--color-border), 0 -4px 12px rgba(0,0,0,0.05)",
          maxWidth: 480,
          margin: "0 auto",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        }}
      >
        {step === "cart" ? (
          <button
            onClick={() => setStep("payment")}
            disabled={items.length === 0}
            className="btn-primary"
            style={{ opacity: items.length === 0 ? 0.5 : 1 }}
          >
            <span>Passer au paiement</span>
            {items.length > 0 && (
              <span className="amount ml-auto" style={{ fontWeight: 900, fontSize: "var(--text-lg)" }}>
                {formatFCFA(cartTotal)}
              </span>
            )}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setStep("cart")}
              className="btn-ghost"
              style={{ width: "auto", paddingLeft: "1rem", paddingRight: "1rem", flexShrink: 0 }}
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={submitSale}
              disabled={!canValidate || submitting}
              className="btn-primary flex-1"
              style={{ opacity: !canValidate || submitting ? 0.5 : 1 }}
            >
              {submitting ? "Enregistrement..." : "Valider la vente"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Plus, Minus, Trash2, X, Check,
  Truck, Package, ChevronDown,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  stockQty: number;
  category: { name: string } | null;
}

interface Supplier { id: number; name: string; }

interface CartItem {
  productId: number;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

const PM_OPTIONS = [
  { value: "cash", label: "Espèces", color: "#1B5E20" },
  { value: "wave", label: "Wave", color: "#00B9FF" },
  { value: "orange_money", label: "Orange Money", color: "#FF6600" },
  { value: "credit", label: "Crédit fournisseur", color: "#C9952A" },
];

export default function NewPurchasePage() {
  return (
    <Suspense>
      <NewPurchaseContent />
    </Suspense>
  );
}

function NewPurchaseContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initialSupplierId = params.get("supplierId");

  const [step, setStep] = useState<"cart" | "payment">("cart");
  const [items, setItems] = useState<CartItem[]>([]);
  const [supplierId, setSupplierId] = useState<number | null>(initialSupplierId ? Number(initialSupplierId) : null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Recherche produit
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemQty, setItemQty] = useState("1");
  const [itemPrice, setItemPrice] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.get("/api/suppliers").then((r) => setSuppliers(r.data.data ?? []));
  }, []);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    setShowResults(!!val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      const res = await api.get(`/api/products?search=${encodeURIComponent(val)}&limit=8`);
      setSearchResults(res.data.data ?? []);
    }, 250);
  };

  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    setItemQty("1");
    setItemPrice(p.buyPrice > 0 ? String(p.buyPrice) : "");
    setSearchQuery("");
    setShowResults(false);
    setSearchResults([]);
  };

  const addToCart = () => {
    if (!selectedProduct || !itemQty || !itemPrice) return;
    const qty = Number(itemQty);
    const price = Number(itemPrice);
    if (qty <= 0 || price < 0) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === selectedProduct.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === selectedProduct.id
            ? { ...i, quantity: i.quantity + qty, unitPrice: price }
            : i
        );
      }
      return [
        ...prev,
        { productId: selectedProduct.id, name: selectedProduct.name, unit: selectedProduct.unit, quantity: qty, unitPrice: price },
      ];
    });
    setSelectedProduct(null);
    setItemQty("1");
    setItemPrice("");
  };

  const updateQty = (productId: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
        .filter((i) => i.quantity > 0)
    );
  };

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const debt = paymentMethod === "credit" ? total : Math.max(0, total - Number(paidAmount || 0));

  const handleSubmit = async () => {
    if (!items.length) return;
    setSubmitting(true);
    try {
      await api.post("/api/purchases", {
        supplierId: supplierId ?? undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
        paidAmount: paymentMethod === "credit" ? 0 : Number(paidAmount || 0),
        paymentMethod,
        notes: notes || undefined,
      });
      setSuccess(true);
      navigator.vibrate?.(100);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center" style={{ background: "var(--color-background)" }}>
        <div
          className="flex items-center justify-center rounded-3xl mb-6"
          style={{ width: 80, height: 80, background: "var(--color-primary)" }}
        >
          <Check size={36} color="white" strokeWidth={2.5} />
        </div>
        <p style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
          Achat enregistré !
        </p>
        <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)", marginBottom: 8 }}>
          {formatFCFA(total)} · {items.length} article{items.length > 1 ? "s" : ""}
        </p>
        {debt > 0 && (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-accent)", fontWeight: 600, marginBottom: 24 }}>
            Dette fournisseur : {formatFCFA(debt)}
          </p>
        )}
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 700, marginBottom: 32 }}>
          Le stock a été mis à jour automatiquement ✓
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => { setSuccess(false); setItems([]); setStep("cart"); setPaidAmount(""); setNotes(""); }}
            className="w-full rounded-2xl tap-feedback"
            style={{ height: 52, background: "var(--color-primary)", color: "white", fontWeight: 700, fontSize: "var(--text-base)" }}
          >
            Nouvel achat
          </button>
          <button
            onClick={() => router.back()}
            className="w-full rounded-2xl tap-feedback"
            style={{ height: 52, background: "var(--color-surface)", color: "var(--color-text)", fontWeight: 600, fontSize: "var(--text-base)", border: "1px solid var(--color-border)" }}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-background)" }}>
      <PageHeader
        title={step === "cart" ? "Nouvel achat" : "Paiement fournisseur"}
        back={step === "payment" ? () => setStep("cart") : true}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="page-content space-y-4">
          {step === "cart" ? (
            <>
              {/* Fournisseur */}
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Fournisseur (optionnel)
                </label>
                <div className="relative mt-1.5">
                  <Truck size={16} color="var(--color-text-muted)" className="absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={supplierId ?? ""}
                    onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : null)}
                    className="input pl-10 pr-8 appearance-none"
                    style={{ color: supplierId ? "var(--color-text)" : "var(--color-text-muted)" }}
                  >
                    <option value="">Achat direct (sans fournisseur)</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} color="var(--color-text-muted)" className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Recherche produit */}
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Ajouter un produit
                </label>
                <div className="relative mt-1.5">
                  <Search size={16} color="var(--color-text-muted)" className="absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    placeholder="Chercher un produit du stock…"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="input pl-10"
                  />
                  {showResults && searchResults.length > 0 && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 rounded-2xl z-20 overflow-hidden"
                      style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--color-border)" }}
                    >
                      {searchResults.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => selectProduct(p)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left tap-feedback"
                          style={{ borderBottom: "1px solid var(--color-border)" }}
                        >
                          <Package size={16} color="var(--color-text-muted)" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
                              {p.name}
                            </p>
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                              Stock: {Number(p.stockQty)} {p.unit}
                            </p>
                          </div>
                          {p.buyPrice > 0 && (
                            <span className="amount" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                              {formatFCFA(p.buyPrice)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Popup ajout produit sélectionné */}
              {selectedProduct && (
                <div className="card" style={{ border: "1px solid var(--color-primary)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)" }}>
                      {selectedProduct.name}
                    </p>
                    <button onClick={() => setSelectedProduct(null)}>
                      <X size={16} color="var(--color-text-muted)" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Qté ({selectedProduct.unit})
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => setItemQty((v) => String(Math.max(1, Number(v) - 1)))} className="flex items-center justify-center rounded-xl tap-feedback" style={{ width: 36, height: 36, background: "var(--color-surface-2)" }}>
                          <Minus size={16} color="var(--color-text-muted)" />
                        </button>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={itemQty}
                          onChange={(e) => setItemQty(e.target.value)}
                          className="input flex-1 amount text-center"
                          style={{ fontSize: "var(--text-base)", fontWeight: 700 }}
                        />
                        <button onClick={() => setItemQty((v) => String(Number(v) + 1))} className="flex items-center justify-center rounded-xl tap-feedback" style={{ width: 36, height: 36, background: "var(--color-surface-2)" }}>
                          <Plus size={16} color="var(--color-text-muted)" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Prix d'achat
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="input mt-1 amount"
                        style={{ fontWeight: 700 }}
                      />
                    </div>
                  </div>
                  {itemQty && itemPrice && (
                    <p className="amount text-center mb-3" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      Total: {formatFCFA(Number(itemQty) * Number(itemPrice))}
                    </p>
                  )}
                  <button
                    onClick={addToCart}
                    disabled={!itemQty || !itemPrice}
                    className="w-full rounded-xl tap-feedback"
                    style={{
                      height: 44,
                      background: itemQty && itemPrice ? "var(--color-primary)" : "var(--color-border)",
                      color: itemQty && itemPrice ? "white" : "var(--color-text-muted)",
                      fontWeight: 700,
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    Ajouter au bon de commande
                  </button>
                </div>
              )}

              {/* Panier */}
              {items.length > 0 && (
                <section>
                  <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                    Articles ({items.length})
                  </p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.productId} className="card flex items-center gap-3" style={{ padding: "0.75rem" }}>
                        <div className="flex-1 min-w-0">
                          <p className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)" }}>
                            {item.name}
                          </p>
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                            {formatFCFA(item.unitPrice)} / {item.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.productId, -1)} className="flex items-center justify-center rounded-lg tap-feedback" style={{ width: 30, height: 30, background: "var(--color-surface-2)" }}>
                            <Minus size={14} color="var(--color-text-muted)" />
                          </button>
                          <span className="amount" style={{ fontSize: "var(--text-sm)", fontWeight: 700, minWidth: 28, textAlign: "center", color: "var(--color-text)" }}>
                            {item.quantity}
                          </span>
                          <button onClick={() => updateQty(item.productId, 1)} className="flex items-center justify-center rounded-lg tap-feedback" style={{ width: 30, height: 30, background: "var(--color-surface-2)" }}>
                            <Plus size={14} color="var(--color-text-muted)" />
                          </button>
                        </div>
                        <p className="amount shrink-0" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)", minWidth: 70, textAlign: "right" }}>
                          {formatFCFA(item.quantity * item.unitPrice)}
                        </p>
                        <button onClick={() => setItems((prev) => prev.filter((i) => i.productId !== item.productId))}>
                          <Trash2 size={15} color="var(--color-danger)" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            // ÉTAPE PAIEMENT
            <>
              {/* Récap */}
              <div className="card">
                <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                  Récapitulatif
                </p>
                <div className="space-y-1 mb-3">
                  {items.map((i) => (
                    <div key={i.productId} className="flex justify-between">
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                        {i.name} ×{i.quantity}
                      </span>
                      <span className="amount" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
                        {formatFCFA(i.quantity * i.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <span style={{ fontWeight: 700, color: "var(--color-text)" }}>Total</span>
                  <span className="amount" style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-primary)" }}>
                    {formatFCFA(total)}
                  </span>
                </div>
              </div>

              {/* Mode paiement */}
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Mode de paiement
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PM_OPTIONS.map((pm) => (
                    <button
                      key={pm.value}
                      onClick={() => { setPaymentMethod(pm.value); if (pm.value === "credit") setPaidAmount("0"); }}
                      className="rounded-2xl tap-feedback py-3"
                      style={{
                        background: paymentMethod === pm.value ? `${pm.color}15` : "var(--color-surface)",
                        border: `2px solid ${paymentMethod === pm.value ? pm.color : "var(--color-border)"}`,
                        color: paymentMethod === pm.value ? pm.color : "var(--color-text-muted)",
                        fontWeight: 700,
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Montant payé */}
              {paymentMethod !== "credit" && (
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Montant payé (FCFA)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="input mt-1.5 amount"
                    style={{ fontSize: "var(--text-xl)", fontWeight: 700, textAlign: "center" }}
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => setPaidAmount(String(total))} className="rounded-xl tap-feedback" style={{ height: 40, background: Number(paidAmount) === total ? "var(--color-primary)" : "var(--color-surface-2)", color: Number(paidAmount) === total ? "white" : "var(--color-text-muted)", fontWeight: 700, fontSize: "var(--text-xs)" }}>
                      Tout payer ({formatFCFA(total)})
                    </button>
                    <button onClick={() => setPaidAmount("0")} className="rounded-xl tap-feedback" style={{ height: 40, background: Number(paidAmount) === 0 ? "var(--color-accent)" : "var(--color-surface-2)", color: Number(paidAmount) === 0 ? "white" : "var(--color-text-muted)", fontWeight: 700, fontSize: "var(--text-xs)" }}>
                      Crédit total
                    </button>
                  </div>
                  {debt > 0 && (
                    <div className="rounded-xl px-4 py-2 mt-2 text-center" style={{ background: "rgba(201,149,42,0.08)" }}>
                      <p className="amount" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-accent)" }}>
                        Dette restante : {formatFCFA(debt)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "credit" && (
                <div className="rounded-2xl px-4 py-3 text-center" style={{ background: "rgba(201,149,42,0.08)", border: "1px solid rgba(201,149,42,0.2)" }}>
                  <p className="amount" style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-accent)" }}>
                    Crédit fournisseur : {formatFCFA(total)}
                  </p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", opacity: 0.8, marginTop: 4 }}>
                    La dette sera ajoutée au compte fournisseur
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Notes (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Remarque sur la livraison…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input mt-1.5"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Barre de navigation bas */}
      <div
        className="sticky bottom-0 px-4 py-4 flex gap-3"
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
        }}
      >
        {step === "cart" ? (
          <button
            onClick={() => setStep("payment")}
            disabled={items.length === 0}
            className="flex-1 rounded-2xl tap-feedback"
            style={{
              height: 56,
              background: items.length > 0 ? "var(--color-primary)" : "var(--color-border)",
              color: items.length > 0 ? "white" : "var(--color-text-muted)",
              fontWeight: 700,
              fontSize: "var(--text-base)",
            }}
          >
            {items.length > 0
              ? `Passer au paiement · ${formatFCFA(total)}`
              : "Ajoutez des articles"}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-2xl tap-feedback"
            style={{
              height: 56,
              background: "var(--color-primary)",
              color: "white",
              fontWeight: 700,
              fontSize: "var(--text-base)",
            }}
          >
            {submitting ? "Enregistrement…" : `Valider l'achat · ${formatFCFA(total)}`}
          </button>
        )}
      </div>
    </div>
  );
}

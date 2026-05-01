"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Filter, AlertTriangle, Package } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  reference?: string;
  unit: string;
  sellPrice: number;
  stockQty: number;
  stockAlert: number;
  photoUrl?: string;
  category?: { name: string; icon?: string; color?: string };
}

export default function StockPage() {
  return (
    <Suspense>
      <StockContent />
    </Suspense>
  );
}

function StockContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(params.get("filter") ?? "all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filter === "low") q.set("lowStock", "true");
      if (search) q.set("search", search);
      const res = await api.get(`/api/products?${q}`);
      setProducts(res.data.data ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  const lowCount = products.filter((p) => Number(p.stockQty) <= Number(p.stockAlert)).length;

  return (
    <div>
      <PageHeader
        title="Stock & Produits"
        subtitle={loading ? "" : `${products.length} produit${products.length > 1 ? "s" : ""}`}
        action={
          <button
            onClick={() => router.push("/stock/new")}
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
            Ajouter
          </button>
        }
      />

      <div className="page-content space-y-4" style={{ paddingTop: "0.75rem" }}>
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--color-text-muted)" />
          <input
            className="input pl-10"
            placeholder="Chercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
          />
        </div>

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {[
            { key: "all", label: "Tous" },
            { key: "low", label: `Rupture ${lowCount > 0 ? `(${lowCount})` : ""}` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="shrink-0 px-4 rounded-full tap-feedback"
              style={{
                height: 36,
                background: filter === key ? "var(--color-primary)" : "var(--color-surface)",
                color: filter === key ? "white" : "var(--color-text-muted)",
                fontWeight: filter === key ? 700 : 500,
                fontSize: "var(--text-sm)",
                border: `1.5px solid ${filter === key ? "var(--color-primary)" : "var(--color-border)"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <>
            {/* Mobile skeleton */}
            <div className="lg:hidden space-y-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 w-full" />)}
            </div>
            {/* Desktop skeleton */}
            <div className="hidden lg:block">
              <div className="card p-0 overflow-hidden">
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid var(--color-border)", background: "var(--color-surface-2)" }}>
                      {["Produit", "Catégorie", "Stock", "Prix de vente", "Statut"].map((col) => (
                        <th key={col} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td colSpan={5} style={{ padding: "0.75rem 1rem" }}>
                          <div className="skeleton h-10 rounded" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : products.length === 0 ? (
          <>
            {/* Mobile empty */}
            <div className="lg:hidden card text-center py-12" style={{ color: "var(--color-text-muted)" }}>
              <Package size={40} strokeWidth={1.5} className="mx-auto mb-3 opacity-40" />
              <p style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>
                {search ? "Aucun produit trouvé" : "Aucun produit"}
              </p>
              <p style={{ fontSize: "var(--text-sm)", marginTop: "0.25rem", opacity: 0.7 }}>
                {search ? "Essayez un autre mot-clé" : "Ajoutez votre premier produit"}
              </p>
              {!search && (
                <button
                  onClick={() => router.push("/stock/new")}
                  className="btn-primary mt-4"
                  style={{ maxWidth: 200, margin: "1rem auto 0" }}
                >
                  + Ajouter un produit
                </button>
              )}
            </div>
            {/* Desktop empty */}
            <div className="hidden lg:block">
              <div className="card p-0 overflow-hidden">
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid var(--color-border)", background: "var(--color-surface-2)" }}>
                      {["Produit", "Catégorie", "Stock", "Prix de vente", "Statut"].map((col) => (
                        <th key={col} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={5} style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                        {search ? "Aucun produit trouvé" : "Aucun produit"}
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
              {products.map((product) => {
                const isLow = Number(product.stockQty) <= Number(product.stockAlert);
                const isOut = Number(product.stockQty) === 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => router.push(`/stock/${product.id}`)}
                    className="card w-full flex items-center gap-3 text-left tap-feedback"
                    style={{ padding: "0.75rem" }}
                  >
                    {/* Avatar produit */}
                    <div
                      className="flex items-center justify-center rounded-xl shrink-0"
                      style={{
                        width: 44,
                        height: 44,
                        background: product.category?.color
                          ? `${product.category.color}18`
                          : "var(--color-surface-2)",
                        fontSize: "1.25rem",
                      }}
                    >
                      {product.category?.icon ?? <Package size={20} color="var(--color-text-muted)" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text)" }}
                      >
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {product.category && (
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                            {product.category.name}
                          </span>
                        )}
                        {isOut ? (
                          <span className="badge-danger">Épuisé</span>
                        ) : isLow ? (
                          <span className="badge-warning flex items-center gap-1">
                            <AlertTriangle size={10} strokeWidth={2.5} />
                            Stock bas
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className="amount"
                        style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text)" }}
                      >
                        {formatFCFA(product.sellPrice)}
                      </p>
                      <p
                        style={{
                          fontSize: "var(--text-xs)",
                          color: isOut
                            ? "var(--color-danger)"
                            : isLow
                            ? "var(--color-warning)"
                            : "var(--color-text-muted)",
                          fontWeight: isLow ? 600 : 400,
                        }}
                      >
                        {product.stockQty} {product.unit}
                      </p>
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
                      {["Produit", "Catégorie", "Stock", "Prix de vente", "Statut"].map((col) => (
                        <th key={col} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const isLow = Number(product.stockQty) <= Number(product.stockAlert);
                      const isOut = Number(product.stockQty) === 0;
                      return (
                        <tr
                          key={product.id}
                          onClick={() => router.push(`/stock/${product.id}`)}
                          className="tap-feedback"
                          style={{ borderBottom: "1px solid var(--color-border)", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {/* Produit */}
                          <td style={{ padding: "0.875rem 1rem", fontSize: "var(--text-sm)", maxWidth: 260 }}>
                            <p style={{ fontWeight: 700, color: "var(--color-text)" }} className="truncate">{product.name}</p>
                            {product.category && (
                              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                                {product.category.icon && <span style={{ marginRight: "0.25rem" }}>{product.category.icon}</span>}
                                {product.category.name}
                              </p>
                            )}
                          </td>
                          {/* Catégorie */}
                          <td style={{ padding: "0.875rem 1rem", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                            {product.category?.name ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                          </td>
                          {/* Stock */}
                          <td style={{ padding: "0.875rem 1rem", fontSize: "var(--text-sm)", whiteSpace: "nowrap" }}>
                            <span style={{ fontWeight: 600, color: isOut ? "var(--color-danger)" : isLow ? "var(--color-warning)" : "var(--color-text)" }}>
                              {product.stockQty} {product.unit}
                            </span>
                          </td>
                          {/* Prix de vente */}
                          <td style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}>
                            <span className="amount" style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>
                              {formatFCFA(product.sellPrice)}
                            </span>
                          </td>
                          {/* Statut */}
                          <td style={{ padding: "0.875rem 1rem" }}>
                            {isOut ? (
                              <span className="badge-danger">Épuisé</span>
                            ) : isLow ? (
                              <span className="badge-warning flex items-center gap-1" style={{ display: "inline-flex" }}>
                                <AlertTriangle size={10} strokeWidth={2.5} />
                                Stock bas
                              </span>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-success, #1B5E20)" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-success, #2E7D32)", display: "inline-block" }} />
                                OK
                              </span>
                            )}
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
      <button className="fab" onClick={() => router.push("/sales/new")}>
        <Plus size={20} strokeWidth={2.5} />
        Nouvelle vente
      </button>
    </div>
  );
}

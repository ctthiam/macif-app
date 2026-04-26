"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Phone, MapPin, ShoppingBag, ChevronRight,
  Plus, Package, Truck, Trash2, X,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatFCFA, formatDate } from "@/lib/api";

interface PurchaseItem {
  product: { name: string; unit: string };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Purchase {
  id: number;
  reference: string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: PurchaseItem[];
  user: { name: string };
}

interface SupplierDetail {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  debtBalance: number;
  purchases: Purchase[];
}

const PM_LABELS: Record<string, string> = {
  cash: "Espèces", wave: "Wave", orange_money: "O. Money", credit: "Crédit",
};

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    api
      .get(`/api/suppliers/${id}`)
      .then((r) => setSupplier(r.data.data))
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  const handleDelete = async () => {
    try {
      await api.delete(`/api/suppliers/${id}`);
      router.back();
    } catch {
      //
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Fournisseur" back />
        <div className="page-content space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton rounded-2xl" style={{ height: 80 }} />)}
        </div>
      </div>
    );
  }

  if (!supplier) return null;

  const totalPurchases = supplier.purchases.reduce((s, p) => s + Number(p.totalAmount), 0);
  const hasDebt = Number(supplier.debtBalance) > 0;

  return (
    <div>
      <PageHeader
        title={supplier.name}
        subtitle="Fournisseur"
        back
        action={
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center justify-center rounded-xl tap-feedback"
            style={{ width: 36, height: 36, background: "rgba(183,28,28,0.08)" }}
          >
            <Trash2 size={16} color="var(--color-danger)" />
          </button>
        }
      />

      <div className="page-content space-y-4">
        {/* Contact */}
        <div className="card space-y-2">
          {supplier.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} color="var(--color-text-muted)" />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{supplier.phone}</span>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-2">
              <MapPin size={14} color="var(--color-text-muted)" />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{supplier.address}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <div className="flex items-center justify-center rounded-xl mx-auto mb-2" style={{ width: 40, height: 40, background: "var(--color-primary-10)" }}>
              <ShoppingBag size={18} color="var(--color-primary)" />
            </div>
            <p className="amount" style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text)" }}>
              {formatFCFA(totalPurchases)}
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
              Total commandé
            </p>
          </div>
          <div
            className="card text-center"
            style={hasDebt ? { background: "rgba(201,149,42,0.05)", border: "1px solid rgba(201,149,42,0.2)" } : {}}
          >
            <div className="flex items-center justify-center rounded-xl mx-auto mb-2" style={{ width: 40, height: 40, background: hasDebt ? "rgba(201,149,42,0.12)" : "var(--color-surface-2)" }}>
              <Truck size={18} color={hasDebt ? "var(--color-accent)" : "var(--color-text-muted)"} />
            </div>
            <p className="amount" style={{ fontSize: "var(--text-base)", fontWeight: 700, color: hasDebt ? "var(--color-accent)" : "var(--color-text)" }}>
              {formatFCFA(Number(supplier.debtBalance))}
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: hasDebt ? "var(--color-accent)" : "var(--color-text-muted)", marginTop: 2 }}>
              Dette restante
            </p>
          </div>
        </div>

        {/* CTA Nouvel achat */}
        <button
          onClick={() => router.push(`/more/purchases/new?supplierId=${supplier.id}`)}
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
          <Plus size={18} strokeWidth={2.5} />
          Nouvel achat
        </button>

        {/* Historique achats */}
        {supplier.purchases.length > 0 && (
          <section>
            <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
              Historique achats
            </p>
            <div className="space-y-2">
              {supplier.purchases.map((p) => {
                const unpaid = Number(p.totalAmount) - Number(p.paidAmount);
                return (
                  <div key={p.id} className="card" style={{ padding: "0.75rem" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                          {p.reference}
                        </p>
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                          {formatDate(p.createdAt)} · {p.user.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="amount" style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text)" }}>
                          {formatFCFA(Number(p.totalAmount))}
                        </p>
                        {unpaid > 0 && (
                          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-accent)" }}>
                            Reste {formatFCFA(unpaid)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.items.slice(0, 3).map((item, i) => (
                        <span
                          key={i}
                          className="rounded-lg px-2 py-0.5"
                          style={{ fontSize: 11, background: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
                        >
                          {item.product.name} ×{Number(item.quantity)}
                        </span>
                      ))}
                      {p.items.length > 3 && (
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                          +{p.items.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-3xl w-full max-w-sm" style={{ background: "var(--color-surface)", padding: "1.5rem" }}>
            <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.5rem" }}>
              Supprimer {supplier.name} ?
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              L'historique des achats sera conservé.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowDelete(false)} className="rounded-2xl tap-feedback" style={{ height: 48, background: "var(--color-surface-2)", color: "var(--color-text)", fontWeight: 700 }}>
                Annuler
              </button>
              <button onClick={handleDelete} className="rounded-2xl tap-feedback" style={{ height: 48, background: "var(--color-danger)", color: "white", fontWeight: 700 }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

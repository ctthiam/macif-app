"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Nom requis"),
  categoryId: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().optional()
  ),
  unit: z.string().optional(),
  buyPrice: z.number().min(0).optional(),
  sellPrice: z.number().positive("Prix de vente requis"),
  sellPriceGros: z.number().min(0).optional(),
  stockQty: z.number().min(0).optional(),
  stockAlert: z.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

const UNITS = ["pièce", "kg", "sac", "mètre", "litre", "carton", "seau", "rouleau"];

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { unit: "pièce", stockQty: 0, stockAlert: 5 },
  });
  const selectedUnit = watch("unit");

  useEffect(() => {
    api.get("/api/categories").then((r) => setCategories(r.data.data ?? []));
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post("/api/products", data);
      setSuccess(true);
      setTimeout(() => router.push("/stock"), 1200);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div
            className="flex items-center justify-center rounded-full mx-auto mb-4"
            style={{ width: 72, height: 72, background: "var(--color-success-50)" }}
          >
            <CheckCircle2 size={36} color="var(--color-success)" />
          </div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--color-text)" }}>
            Produit ajouté !
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            Retour au stock...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Nouveau produit" back />

      <form onSubmit={handleSubmit(onSubmit)} className="page-content space-y-5">
        {/* Nom */}
        <div>
          <label className="field-label">Nom du produit *</label>
          <input {...register("name")} className="input" placeholder="Ex: Ciment CPA 50kg" autoFocus />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        {/* Catégorie */}
        <div>
          <label className="field-label">Catégorie</label>
          <select {...register("categoryId")} className="input">
            <option value="">— Choisir une catégorie —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Unité */}
        <div>
          <label className="field-label">Unité de vente</label>
          <div className="flex flex-wrap gap-2">
            {UNITS.map((u) => {
              return (
                <label
                  key={u}
                  className="tap-feedback"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    {...register("unit")}
                    type="radio"
                    value={u}
                    className="sr-only"
                  />
                  <span
                    style={{
                      padding: "0.375rem 0.875rem",
                      borderRadius: "var(--radius-full)",
                      fontSize: "var(--text-sm)",
                      fontWeight: u === selectedUnit ? 600 : 500,
                      border: `1.5px solid ${u === selectedUnit ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: u === selectedUnit ? "var(--color-primary-50)" : "var(--color-surface)",
                      color: u === selectedUnit ? "var(--color-primary)" : "var(--color-text-muted)",
                    }}
                  >
                    {u}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Prix */}
        <div className="card space-y-4">
          <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)" }}>
            Prix
          </h3>
          <div>
            <label className="field-label">Prix d'achat (FCFA)</label>
            <input
              {...register("buyPrice", { valueAsNumber: true })}
              className="input amount"
              placeholder="0"
              type="number"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="field-label">Prix de vente détail (FCFA) *</label>
            <input
              {...register("sellPrice", { valueAsNumber: true })}
              className="input amount"
              placeholder="5 000"
              type="number"
              inputMode="numeric"
            />
            {errors.sellPrice && <p className="field-error">{errors.sellPrice.message}</p>}
          </div>
          <div>
            <label className="field-label">Prix de vente en gros (FCFA) — optionnel</label>
            <input
              {...register("sellPriceGros", { valueAsNumber: true })}
              className="input amount"
              placeholder="4 500"
              type="number"
              inputMode="numeric"
            />
          </div>
        </div>

        {/* Stock */}
        <div className="card space-y-4">
          <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)" }}>
            Stock initial
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Quantité en stock</label>
              <input
                {...register("stockQty", { valueAsNumber: true })}
                className="input amount"
                placeholder="0"
                type="number"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="field-label">Seuil d'alerte rupture</label>
              <input
                {...register("stockAlert", { valueAsNumber: true })}
                className="input amount"
                placeholder="5"
                type="number"
                inputMode="numeric"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Enregistrement..." : "Ajouter le produit"}
        </button>
      </form>

      <style>{`
        .field-label {
          display: block;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 0.5rem;
        }
        .field-error {
          font-size: var(--text-xs);
          color: var(--color-danger);
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}

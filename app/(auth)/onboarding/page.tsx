"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, ShoppingCart, Lock, CheckCircle2, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

const STEPS = [
  {
    step: 1,
    title: "Votre boutique est prête !",
    subtitle: "Commençons par ajouter votre premier produit",
    icon: Package,
    color: "var(--color-primary)",
  },
  {
    step: 2,
    title: "Faites votre première vente",
    subtitle: "Enregistrez une vente en 3 secondes",
    icon: ShoppingCart,
    color: "var(--color-accent)",
  },
  {
    step: 3,
    title: "Sécurisez l'accès",
    subtitle: "Créez un code PIN à 4 chiffres pour ouvrir l'app rapidement",
    icon: Lock,
    color: "var(--color-primary)",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { shop } = useAuthStore();
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [productDone, setProductDone] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    name: string;
    sellPrice: number;
    stockQty: number;
  }>();

  const addProduct = async (data: any) => {
    setProductLoading(true);
    try {
      await api.post("/api/products", { ...data, unit: "pièce" });
      setProductDone(true);
      setTimeout(() => setStep(2), 800);
    } catch {
      // continue anyway
      setStep(2);
    } finally {
      setProductLoading(false);
    }
  };

  const savePin = async () => {
    if (pin.length !== 4) { setPinError("Le PIN doit avoir 4 chiffres"); return; }
    try {
      await api.post("/api/auth/pin/set", { pin });
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  };

  const skipPin = () => router.push("/dashboard");

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;
  const current = STEPS[step - 1];
  const Icon = current.icon;

  return (
    <div className="min-h-screen flex flex-col px-6 pt-10 pb-8 max-w-md mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        {STEPS.map((s) => (
          <div
            key={s.step}
            className="flex-1 h-1.5 rounded-full transition-all duration-300"
            style={{
              background: s.step <= step ? "var(--color-primary)" : "var(--color-border)",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div
          className="flex items-center justify-center rounded-2xl mb-4"
          style={{
            width: 56,
            height: 56,
            background: `${current.color}15`,
          }}
        >
          <Icon size={28} color={current.color} strokeWidth={1.8} />
        </div>
        <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text)", marginBottom: "0.25rem" }}>
          {current.title}
        </h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          {current.subtitle}
        </p>
      </div>

      {/* Step 1 — Premier produit */}
      {step === 1 && (
        <form onSubmit={handleSubmit(addProduct)} className="space-y-4 flex-1 flex flex-col">
          <div>
            <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", display: "block", marginBottom: "0.5rem" }}>
              Nom du produit
            </label>
            <input
              {...register("name", { required: true })}
              className="input"
              placeholder="Ex: Ciment CPA 50kg"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", display: "block", marginBottom: "0.5rem" }}>
                Prix de vente (FCFA)
              </label>
              <input
                {...register("sellPrice", { required: true, valueAsNumber: true })}
                className="input amount"
                placeholder="5 000"
                type="number"
                inputMode="numeric"
              />
            </div>
            <div>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", display: "block", marginBottom: "0.5rem" }}>
                Quantité en stock
              </label>
              <input
                {...register("stockQty", { valueAsNumber: true })}
                className="input amount"
                placeholder="100"
                type="number"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="flex-1" />

          {productDone ? (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "var(--color-success-50)" }}
            >
              <CheckCircle2 size={20} color="var(--color-success)" />
              <p style={{ fontWeight: 600, color: "var(--color-success)", fontSize: "var(--text-sm)" }}>
                Produit ajouté !
              </p>
            </div>
          ) : (
            <>
              <button
                type="submit"
                disabled={productLoading}
                className="btn-primary"
              >
                {productLoading ? "Ajout..." : "Ajouter ce produit"}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-ghost"
                style={{ borderColor: "transparent", color: "var(--color-text-muted)" }}
              >
                Passer cette étape
              </button>
            </>
          )}
        </form>
      )}

      {/* Step 2 — Première vente */}
      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <div
            className="card flex-1 flex flex-col items-center justify-center gap-4 mb-4"
            style={{ minHeight: 200 }}
          >
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 64, height: 64, background: "rgba(201,149,42,0.1)" }}
            >
              <ShoppingCart size={32} color="var(--color-accent)" strokeWidth={1.8} />
            </div>
            <p
              style={{
                textAlign: "center",
                fontSize: "var(--text-base)",
                color: "var(--color-text-muted)",
                lineHeight: 1.6,
              }}
            >
              Cliquez sur <strong style={{ color: "var(--color-primary)" }}>+ Vente</strong> pour
              enregistrer une vente. Le stock se met à jour automatiquement !
            </p>
          </div>

          <button
            onClick={() => router.push("/sales/new")}
            className="btn-primary mb-3"
            style={{ background: "var(--color-accent)" }}
          >
            Faire ma première vente
          </button>
          <button
            onClick={() => setStep(3)}
            className="btn-ghost"
            style={{ borderColor: "transparent", color: "var(--color-text-muted)" }}
          >
            Passer cette étape
          </button>
        </div>
      )}

      {/* Step 3 — PIN */}
      {step === 3 && (
        <div className="flex-1 flex flex-col">
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "2rem" }}>
            Le PIN vous permet de rouvrir l'app rapidement sans retaper votre mot de passe.
          </p>

          {/* PIN input */}
          <div className="flex gap-3 justify-center mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: 56,
                  height: 64,
                  background: "var(--color-surface)",
                  border: `2px solid ${pin.length > i ? "var(--color-primary)" : "var(--color-border)"}`,
                  fontSize: "var(--text-2xl)",
                  fontWeight: 800,
                  color: "var(--color-primary)",
                }}
              >
                {pin.length > i ? "•" : ""}
              </div>
            ))}
          </div>

          {/* Clavier numérique */}
          <div className="grid grid-cols-3 gap-3 mb-4 max-w-xs mx-auto w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "⌫"].map((key, idx) => (
              <button
                key={idx}
                disabled={key === null}
                onClick={() => {
                  if (key === null) return;
                  if (key === "⌫") {
                    setPin((p) => p.slice(0, -1));
                    setPinError("");
                  } else if (pin.length < 4) {
                    setPin((p) => p + key);
                    setPinError("");
                  }
                }}
                className="tap-feedback flex items-center justify-center rounded-xl"
                style={{
                  height: 56,
                  background: key === null ? "transparent" : "var(--color-surface)",
                  border: key === null ? "none" : "1.5px solid var(--color-border)",
                  fontSize: "var(--text-xl)",
                  fontWeight: 700,
                  color: "var(--color-text)",
                  boxShadow: key !== null && key !== null ? "var(--shadow-card)" : "none",
                }}
              >
                {key}
              </button>
            ))}
          </div>

          {pinError && (
            <p style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-danger)", marginBottom: "0.75rem" }}>
              {pinError}
            </p>
          )}

          <div className="flex-1" />

          <button
            onClick={savePin}
            disabled={pin.length !== 4}
            className="btn-primary mb-3"
            style={{ opacity: pin.length !== 4 ? 0.5 : 1 }}
          >
            Configurer mon PIN
          </button>
          <button
            onClick={skipPin}
            className="btn-ghost"
            style={{ borderColor: "transparent", color: "var(--color-text-muted)" }}
          >
            Passer cette étape
          </button>
        </div>
      )}
    </div>
  );
}

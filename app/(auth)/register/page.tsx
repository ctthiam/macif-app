"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, Lock, User, Store, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  name: z.string().min(2, "Prénom trop court"),
  phone: z.string().min(9, "Numéro invalide"),
  shopName: z.string().min(2, "Nom de boutique trop court"),
  password: z.string().min(6, "Minimum 6 caractères"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/register", {
        name: data.name,
        phone: data.phone,
        shopName: data.shopName,
        password: data.password,
      });
      const { user, shop } = res.data.data;
      setAuth(user, shop, "owner");
      router.push("/onboarding");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "name" as const, label: "Votre prénom", placeholder: "Moussa", icon: User, type: "text", autoComplete: "given-name" },
    { name: "phone" as const, label: "Numéro de téléphone", placeholder: "77 000 00 00", icon: Phone, type: "tel", autoComplete: "tel" },
    { name: "shopName" as const, label: "Nom de votre boutique", placeholder: "Quincaillerie Diallo", icon: Store, type: "text", autoComplete: "organization" },
  ];

  return (
    <div className="flex-1 flex flex-col px-6 pt-8 pb-8 max-w-md mx-auto w-full">
      <div className="mb-6">
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text)", marginBottom: "0.25rem" }}>
          Créez votre boutique
        </h1>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          30 jours d'essai gratuit · Sans carte bancaire
        </p>
      </div>

      {/* Badge essai */}
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 mb-6"
        style={{ background: "var(--color-primary-50)", border: "1px solid var(--color-primary-100)" }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: "var(--color-primary)", flexShrink: 0 }}
        />
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 600 }}>
          Essai gratuit 30 jours — puis 10 000 FCFA/mois
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map(({ name, label, placeholder, icon: Icon, type, autoComplete }) => (
          <div key={name}>
            <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", display: "block", marginBottom: "0.5rem" }}>
              {label}
            </label>
            <div className="relative">
              <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--color-text-muted)" />
              <input
                {...register(name)}
                className="input pl-10"
                placeholder={placeholder}
                type={type}
                autoComplete={autoComplete}
              />
            </div>
            {errors[name] && (
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: "0.25rem" }}>
                {errors[name]?.message}
              </p>
            )}
          </div>
        ))}

        {/* Password */}
        {(["password", "confirmPassword"] as const).map((name) => (
          <div key={name}>
            <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", display: "block", marginBottom: "0.5rem" }}>
              {name === "password" ? "Mot de passe" : "Confirmer le mot de passe"}
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--color-text-muted)" />
              <input
                {...register(name)}
                className="input pl-10 pr-12"
                placeholder="••••••"
                type={showPwd ? "text" : "password"}
                autoComplete={name === "password" ? "new-password" : "new-password"}
              />
              {name === "confirmPassword" && (
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              )}
            </div>
            {errors[name] && (
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: "0.25rem" }}>
                {errors[name]?.message}
              </p>
            )}
          </div>
        ))}

        {error && (
          <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-danger-50)" }}>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-danger)", fontWeight: 600 }}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Création en cours..." : "Créer ma boutique →"}
        </button>

        <p style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Déjà un compte ?{" "}
          <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 700 }}>
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}

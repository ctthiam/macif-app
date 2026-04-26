"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, Lock, Eye, EyeOff, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  phone: z.string().min(9, "Numéro invalide"),
  password: z.string().min(6, "Mot de passe trop court"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
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
      const res = await api.post("/api/auth/login", data);
      const { user, shop, hasPin } = res.data.data;
      setAuth(user, shop, user.role ?? "owner");
      if (hasPin) {
        router.push("/pin");
      } else {
        router.push("/dashboard");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-12 pb-8 max-w-md mx-auto w-full">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{ width: 52, height: 52, background: "var(--color-primary)" }}
        >
          <Wrench size={28} color="white" strokeWidth={2} />
        </div>
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 900, color: "var(--color-primary)", letterSpacing: "-0.02em" }}>
            MACIF
          </h1>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Gestion intelligente de quincaillerie
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text)", marginBottom: "0.25rem" }}>
        Bienvenue !
      </h2>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "2rem" }}>
        Connectez-vous à votre boutique
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1 flex flex-col">
        {/* Phone */}
        <div>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", display: "block", marginBottom: "0.5rem" }}>
            Numéro de téléphone
          </label>
          <div className="relative">
            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--color-text-muted)" />
            <input
              {...register("phone")}
              className="input pl-10"
              placeholder="77 000 00 00"
              type="tel"
              autoComplete="tel"
            />
          </div>
          {errors.phone && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: "0.25rem" }}>
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", display: "block", marginBottom: "0.5rem" }}>
            Mot de passe
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--color-text-muted)" />
            <input
              {...register("password")}
              className="input pl-10 pr-12"
              placeholder="••••••"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-muted)" }}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: "0.25rem" }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {error && (
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: "var(--color-danger-50)", border: "1px solid rgba(183,28,28,0.2)" }}
          >
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-danger)", fontWeight: 600 }}>{error}</p>
          </div>
        )}

        <div className="flex-1" />

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <p style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Pas encore de compte ?{" "}
          <Link href="/register" style={{ color: "var(--color-primary)", fontWeight: 700 }}>
            Créer ma boutique
          </Link>
        </p>
      </form>
    </div>
  );
}

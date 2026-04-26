"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Lock, Shield, Eye, EyeOff, Check, ChevronRight,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";

type Section = "main" | "password" | "pin";

export default function ProfilePage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [section, setSection] = useState<Section>("main");

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const [pwError, setPwError] = useState("");

  // PIN
  const [pin, setPin] = useState(["", "", "", ""]);
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [pinConfirm, setPinConfirm] = useState(["", "", "", ""]);
  const [pinSaving, setPinSaving] = useState(false);
  const [pinDone, setPinDone] = useState(false);
  const [pinError, setPinError] = useState("");

  const handleChangePassword = async () => {
    setPwError("");
    if (newPw !== confirmPw) { setPwError("Les mots de passe ne correspondent pas"); return; }
    if (newPw.length < 6) { setPwError("6 caractères minimum"); return; }
    setPwSaving(true);
    try {
      await api.post("/api/auth/change-password", { currentPassword: currentPw, newPassword: newPw });
      setPwDone(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => { setPwDone(false); setSection("main"); }, 1500);
    } catch (e: any) {
      setPwError(e?.response?.data?.message ?? "Mot de passe actuel incorrect");
    } finally {
      setPwSaving(false);
    }
  };

  const handlePinDigit = (digit: string, idx: number, isConfirm: boolean) => {
    if (!/^\d?$/.test(digit)) return;
    if (isConfirm) {
      const next = [...pinConfirm];
      next[idx] = digit;
      setPinConfirm(next);
    } else {
      const next = [...pin];
      next[idx] = digit;
      setPin(next);
      if (digit && idx === 3) setTimeout(() => setPinStep("confirm"), 200);
    }
  };

  const handleSetPin = async () => {
    setPinError("");
    const p = pin.join("");
    const c = pinConfirm.join("");
    if (p !== c) { setPinError("Les PINs ne correspondent pas"); setPinConfirm(["","","",""]); return; }
    setPinSaving(true);
    try {
      await api.post("/api/auth/pin/set", { pin: p });
      setPinDone(true);
      setTimeout(() => { setPinDone(false); setSection("main"); setPin(["","","",""]); setPinConfirm(["","","",""]); setPinStep("enter"); }, 1500);
    } catch {
      setPinError("Erreur lors de la configuration du PIN");
    } finally {
      setPinSaving(false);
    }
  };

  const pinComplete = pin.every(Boolean);
  const pinConfirmComplete = pinConfirm.every(Boolean);

  if (section === "password") {
    return (
      <div>
        <PageHeader title="Changer le mot de passe" back={() => setSection("main")} />
        <div className="page-content space-y-4">
          {pwDone && (
            <div className="flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: "rgba(27,94,32,0.08)", border: "1px solid rgba(27,94,32,0.2)" }}>
              <Check size={18} color="var(--color-primary)" />
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-primary)" }}>
                Mot de passe modifié avec succès !
              </p>
            </div>
          )}
          {pwError && (
            <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(183,28,28,0.06)", border: "1px solid rgba(183,28,28,0.15)" }}>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>{pwError}</p>
            </div>
          )}
          {[
            { label: "Mot de passe actuel", val: currentPw, set: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent((v) => !v) },
            { label: "Nouveau mot de passe", val: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew((v) => !v) },
            { label: "Confirmer le nouveau", val: confirmPw, set: setConfirmPw, show: showNew, toggle: () => {} },
          ].map(({ label, val, set, show, toggle }) => (
            <div key={label}>
              <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}
              </label>
              <div className="relative mt-1.5">
                <input
                  type={show ? "text" : "password"}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••"
                />
                <button onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {show ? <EyeOff size={16} color="var(--color-text-muted)" /> : <Eye size={16} color="var(--color-text-muted)" />}
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={handleChangePassword}
            disabled={pwSaving || !currentPw || !newPw || !confirmPw}
            className="w-full rounded-2xl tap-feedback"
            style={{
              height: 52,
              background: currentPw && newPw && confirmPw ? "var(--color-primary)" : "var(--color-border)",
              color: currentPw && newPw && confirmPw ? "white" : "var(--color-text-muted)",
              fontWeight: 700,
              fontSize: "var(--text-base)",
            }}
          >
            {pwSaving ? "Modification…" : "Changer le mot de passe"}
          </button>
        </div>
      </div>
    );
  }

  if (section === "pin") {
    const currentPin = pinStep === "enter" ? pin : pinConfirm;
    const setCurrentPin = pinStep === "enter"
      ? (d: string, i: number) => handlePinDigit(d, i, false)
      : (d: string, i: number) => handlePinDigit(d, i, true);

    return (
      <div>
        <PageHeader
          title={pinStep === "enter" ? "Nouveau PIN" : "Confirmer le PIN"}
          back={() => pinStep === "confirm" ? (setPinStep("enter"), setPinConfirm(["","","",""])) : setSection("main")}
        />
        <div className="page-content">
          <div className="flex flex-col items-center py-8">
            {pinDone && (
              <div className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-6 w-full" style={{ background: "rgba(27,94,32,0.08)" }}>
                <Check size={18} color="var(--color-primary)" />
                <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-primary)" }}>PIN configuré !</p>
              </div>
            )}
            {pinError && (
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-danger)", marginBottom: 16, fontWeight: 600 }}>
                {pinError}
              </p>
            )}
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: 24, textAlign: "center" }}>
              {pinStep === "enter" ? "Entrez votre nouveau PIN à 4 chiffres" : "Confirmez votre PIN"}
            </p>
            {/* Dots */}
            <div className="flex gap-4 mb-8">
              {[0,1,2,3].map((i) => (
                <div key={i} className="rounded-full" style={{ width: 20, height: 20, background: currentPin[i] ? "var(--color-primary)" : "var(--color-border)", transition: "all 0.15s" }} />
              ))}
            </div>
            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key) => {
                if (!key) return <div key="empty" />;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      const filled = currentPin.filter(Boolean).length;
                      if (key === "⌫") {
                        const last = [...currentPin];
                        for (let i = 3; i >= 0; i--) { if (last[i]) { setCurrentPin("", i); break; } }
                        if (pinStep === "enter") { const next = [...pin]; for (let i=3;i>=0;i--) { if(next[i]){next[i]="";setPin(next);break;} } }
                        else { const next = [...pinConfirm]; for (let i=3;i>=0;i--) { if(next[i]){next[i]="";setPinConfirm(next);break;} } }
                      } else if (filled < 4) {
                        setCurrentPin(key, filled);
                      }
                    }}
                    className="flex items-center justify-center rounded-2xl tap-feedback"
                    style={{
                      height: 64,
                      background: key === "⌫" ? "var(--color-surface-2)" : "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      fontSize: key === "⌫" ? "var(--text-lg)" : "var(--text-2xl)",
                      fontWeight: 700,
                      color: "var(--color-text)",
                    }}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
            {pinStep === "confirm" && pinConfirmComplete && (
              <button
                onClick={handleSetPin}
                disabled={pinSaving}
                className="w-full rounded-2xl tap-feedback mt-6"
                style={{ height: 52, background: "var(--color-primary)", color: "white", fontWeight: 700, fontSize: "var(--text-base)", maxWidth: 320 }}
              >
                {pinSaving ? "Configuration…" : "Confirmer le PIN"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main section
  return (
    <div>
      <PageHeader title="Mon profil" back />
      <div className="page-content space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center py-4">
          <div
            className="flex items-center justify-center rounded-3xl mb-3 font-bold"
            style={{ width: 72, height: 72, background: "var(--color-primary)", color: "white", fontSize: "var(--text-2xl)" }}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? "G"}
          </div>
          <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)" }}>
            {user?.name}
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: 2 }}>
            {user?.phone}
          </p>
        </div>

        {/* Sécurité */}
        <section>
          <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem", paddingLeft: "0.25rem" }}>
            Sécurité
          </p>
          <div className="card space-y-0 p-0 overflow-hidden">
            {[
              { icon: Lock, label: "Changer le mot de passe", sub: "Modifiez votre mot de passe", action: () => setSection("password") },
              { icon: Shield, label: "Configurer le PIN", sub: "PIN à 4 chiffres pour déverrouiller", action: () => { setPin(["","","",""]); setPinConfirm(["","","",""]); setPinStep("enter"); setPinError(""); setPinDone(false); setSection("pin"); } },
            ].map(({ icon: Icon, label, sub, action }, idx) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left tap-feedback"
                style={{ borderTop: idx > 0 ? "1px solid var(--color-border)" : "none" }}
              >
                <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 40, height: 40, background: "var(--color-primary-10)" }}>
                  <Icon size={18} color="var(--color-primary)" />
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)" }}>{label}</p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{sub}</p>
                </div>
                <ChevronRight size={16} color="var(--color-text-light)" />
              </button>
            ))}
          </div>
        </section>

        {/* Subscription shortcut */}
        <button
          onClick={() => router.push("/more/subscription")}
          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left tap-feedback"
          style={{ background: "rgba(201,149,42,0.08)", border: "1px solid rgba(201,149,42,0.2)" }}
        >
          <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 40, height: 40, background: "rgba(201,149,42,0.12)" }}>
            <Shield size={18} color="var(--color-accent)" />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-accent)" }}>Mon abonnement</p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", opacity: 0.8 }}>10 000 FCFA / mois</p>
          </div>
          <ChevronRight size={16} color="var(--color-accent)" />
        </button>
      </div>
    </div>
  );
}

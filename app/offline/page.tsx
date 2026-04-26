"use client";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      style={{ background: "var(--color-surface)" }}
    >
      <div
        className="flex items-center justify-center rounded-3xl mb-6"
        style={{
          width: 80,
          height: 80,
          background: "var(--color-primary-10)",
        }}
      >
        <WifiOff size={36} color="var(--color-primary)" />
      </div>

      <h1
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: 700,
          color: "var(--color-text)",
          marginBottom: 8,
        }}
      >
        Pas de connexion
      </h1>
      <p
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
          maxWidth: 280,
          lineHeight: 1.6,
          marginBottom: 32,
        }}
      >
        Vérifiez votre connexion internet et réessayez. MACIF nécessite une
        connexion pour synchroniser vos données.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 rounded-2xl tap-feedback"
        style={{
          height: 52,
          padding: "0 24px",
          background: "var(--color-primary)",
          color: "white",
          fontWeight: 700,
          fontSize: "var(--text-base)",
        }}
      >
        <RefreshCw size={18} />
        Réessayer
      </button>
    </div>
  );
}

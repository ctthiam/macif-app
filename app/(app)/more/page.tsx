"use client";
import { useRouter } from "next/navigation";
import {
  Wallet, Receipt, BarChart2, Settings, LogOut,
  ChevronRight, User, Building2, Truck, Users, Shield,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";

const MENU_SECTIONS = [
  {
    title: "Finance",
    items: [
      {
        icon: Wallet,
        label: "Caisse journalière",
        subtitle: "Ouverture, fermeture, solde",
        href: "/more/cash",
        color: "#1B5E20",
      },
      {
        icon: Receipt,
        label: "Dépenses",
        subtitle: "Loyer, électricité, salaires…",
        href: "/more/expenses",
        color: "#B71C1C",
      },
    ],
  },
  {
    title: "Achats & Stock",
    items: [
      {
        icon: Truck,
        label: "Fournisseurs",
        subtitle: "Liste et bons de commande",
        href: "/more/suppliers",
        color: "#C9952A",
      },
    ],
  },
  {
    title: "Analyse",
    items: [
      {
        icon: BarChart2,
        label: "Rapports",
        subtitle: "CA mensuel, produits top",
        href: "/more/reports",
        color: "#C9952A",
      },
    ],
  },
  {
    title: "Paramètres",
    items: [
      {
        icon: Building2,
        label: "Ma boutique",
        subtitle: "Nom, adresse, logo",
        href: "/more/shop",
        color: "#1B5E20",
      },
      {
        icon: User,
        label: "Mon profil",
        subtitle: "Mot de passe, PIN",
        href: "/more/profile",
        color: "#666",
      },
      {
        icon: Users,
        label: "Mon équipe",
        subtitle: "Gérer les accès vendeurs",
        href: "/more/team",
        color: "#5C35A0",
      },
      {
        icon: Shield,
        label: "Abonnement",
        subtitle: "10 000 FCFA / mois",
        href: "/more/subscription",
        color: "#C9952A",
      },
    ],
  },
];

export default function MorePage() {
  const router = useRouter();
  const { user, shop, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      //
    } finally {
      clearAuth();
      router.replace("/login");
    }
  };

  return (
    <div>
      <PageHeader title="Plus" />

      <div className="page-content space-y-5">
        {/* Profil */}
        <div
          className="rounded-2xl px-4 py-4 flex items-center gap-4"
          style={{ background: "var(--color-primary)", color: "white" }}
        >
          <div
            className="flex items-center justify-center rounded-2xl shrink-0 font-bold"
            style={{
              width: 52,
              height: 52,
              background: "rgba(255,255,255,0.2)",
              fontSize: "var(--text-xl)",
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? "G"}
          </div>
          <div className="flex-1 min-w-0">
            <p
              style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "white" }}
              className="truncate"
            >
              {user?.name ?? "Gérant"}
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.75)" }} className="truncate">
              {shop?.name ?? "Ma boutique"}
            </p>
          </div>
          <button
            onClick={() => router.push("/more/shop")}
            className="flex items-center justify-center rounded-xl tap-feedback"
            style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)" }}
          >
            <Settings size={18} color="white" />
          </button>
        </div>

        {/* Sections */}
        {MENU_SECTIONS.map((section) => (
          <section key={section.title}>
            <p
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "0.5rem",
                paddingLeft: "0.25rem",
              }}
            >
              {section.title}
            </p>
            <div className="card space-y-0 overflow-hidden p-0">
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left tap-feedback"
                    style={{
                      borderTop:
                        idx > 0 ? "1px solid var(--color-border)" : "none",
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-xl shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        background: `${item.color}12`,
                      }}
                    >
                      <Icon size={18} color={item.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: 700,
                          color: "var(--color-text)",
                        }}
                      >
                        {item.label}
                      </p>
                      <p
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                    <ChevronRight size={16} color="var(--color-text-light)" />
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-2xl tap-feedback"
          style={{
            height: 52,
            background: "rgba(183,28,28,0.06)",
            color: "var(--color-danger)",
            fontWeight: 700,
            fontSize: "var(--text-base)",
            border: "1px solid rgba(183,28,28,0.12)",
          }}
        >
          <LogOut size={18} />
          Se déconnecter
        </button>

        {/* Version */}
        <p
          className="text-center pb-2"
          style={{ fontSize: "var(--text-xs)", color: "var(--color-text-light)" }}
        >
          MACIF v1.0.0 · Essai gratuit
        </p>
      </div>
    </div>
  );
}

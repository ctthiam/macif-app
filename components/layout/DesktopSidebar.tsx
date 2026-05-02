"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, ShoppingCart, Package, Users, Wallet, Receipt,
  Truck, BarChart2, Building2, Shield, LogOut, Plus, ShoppingBag,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";

const NAV_PRIMARY = [
  { href: "/dashboard", icon: Home, label: "Accueil" },
  { href: "/sales", icon: ShoppingCart, label: "Ventes" },
  { href: "/stock", icon: Package, label: "Stock" },
  { href: "/clients", icon: Users, label: "Clients" },
];

const NAV_FINANCE = [
  { href: "/more/cash", icon: Wallet, label: "Caisse" },
  { href: "/more/expenses", icon: Receipt, label: "Dépenses" },
  { href: "/more/suppliers", icon: Truck, label: "Fournisseurs" },
  { href: "/more/reports", icon: BarChart2, label: "Rapports" },
];

const NAV_SETTINGS = [
  { href: "/more/shop", icon: Building2, label: "Boutique" },
  { href: "/more/team", icon: Users, label: "Équipe" },
  { href: "/more/subscription", icon: Shield, label: "Abonnement" },
];

function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
      style={{
        background: active ? "rgba(255,255,255,0.15)" : "transparent",
        color: active ? "white" : "rgba(255,255,255,0.6)",
        fontWeight: active ? 700 : 400,
        fontSize: "var(--text-sm)",
        textDecoration: "none",
      }}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
      {label}
    </Link>
  );
}

const Separator = () => (
  <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "0.5rem 0.75rem" }} />
);

const SectionLabel = ({ label }: { label: string }) => (
  <p style={{
    fontSize: 10,
    fontWeight: 700,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "0.25rem 0.75rem",
    marginBottom: "0.125rem",
  }}>
    {label}
  </p>
);

export default function DesktopSidebar() {
  const router = useRouter();
  const { user, shop, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await api.post("/api/auth/logout"); } catch { /* */ }
    clearAuth();
    router.replace("/login");
  };

  return (
    <aside
      className="hidden lg:flex flex-col"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: 240,
        background: "var(--color-primary-dark)",
        zIndex: 20,
        overflowY: "auto",
      }}
    >
      {/* Brand */}
      <div style={{ padding: "1.5rem 1rem 1rem" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)" }}
          >
            <ShoppingBag size={20} color="white" />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: "var(--text-base)", color: "white", lineHeight: 1 }}>
              MACIF
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginTop: 3 }}>
              Gestion de boutique
            </p>
          </div>
        </div>
      </div>

      {/* Shop card */}
      <div style={{ margin: "0 0.75rem 1rem", padding: "0.75rem 1rem", background: "rgba(0,0,0,0.2)", borderRadius: 12 }}>
        <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "white", marginBottom: 2 }} className="truncate">
          {shop?.name ?? "Ma boutique"}
        </p>
        <p style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.55)" }} className="truncate">
          {user?.name ?? "Gérant"}
        </p>
      </div>

      {/* New sale CTA */}
      <div style={{ padding: "0 0.75rem 1.25rem" }}>
        <button
          onClick={() => router.push("/sales/new")}
          className="w-full flex items-center justify-center gap-2 rounded-xl"
          style={{
            height: 40,
            background: "var(--color-accent)",
            color: "white",
            fontWeight: 700,
            fontSize: "var(--text-sm)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Nouvelle vente
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: "0 0.75rem", flex: 1 }} className="space-y-0.5">
        {NAV_PRIMARY.map((item) => <NavItem key={item.href} {...item} />)}

        <Separator />
        <SectionLabel label="Finance & Stock" />
        {NAV_FINANCE.map((item) => <NavItem key={item.href} {...item} />)}

        <Separator />
        <SectionLabel label="Paramètres" />
        {NAV_SETTINGS.map((item) => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Logout */}
      <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            color: "rgba(255,120,120,0.9)",
            fontWeight: 600,
            fontSize: "var(--text-sm)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}

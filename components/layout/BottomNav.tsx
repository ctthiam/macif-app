"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Package, Users, MoreHorizontal } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Accueil" },
  { href: "/sales", icon: ShoppingCart, label: "Ventes" },
  { href: "/stock", icon: Package, label: "Stock" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/more", icon: MoreHorizontal, label: "Plus" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            style={{ color: active ? "var(--color-primary)" : "var(--color-text-light)" }}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 1.8}
              fill={active ? "var(--color-primary-50)" : "none"}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.02em",
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Building2, Phone, MapPin, Check } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

interface ShopData {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  logoUrl: string | null;
  _count: { products: number; customers: number };
}

interface Form {
  name: string;
  phone: string;
  address: string;
  city: string;
}

export default function ShopSettingsPage() {
  const { shop, updateShop } = useAuthStore();
  const [data, setData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Form>({ name: "", phone: "", address: "", city: "" });

  useEffect(() => {
    api
      .get("/api/shops/mine")
      .then((r) => {
        const s = r.data.data;
        setData(s);
        setForm({
          name: s.name ?? "",
          phone: s.phone ?? "",
          address: s.address ?? "",
          city: s.city ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!data || !form.name.trim()) return;
    setSaving(true);
    try {
      const res = await api.put(`/api/shops/${data.id}`, {
        name: form.name,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
      });
      updateShop({ name: form.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    data &&
    (form.name !== (data.name ?? "") ||
      form.phone !== (data.phone ?? "") ||
      form.address !== (data.address ?? "") ||
      form.city !== (data.city ?? ""));

  return (
    <div>
      <PageHeader title="Ma boutique" back />

      <div className="page-content space-y-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton rounded-2xl" style={{ height: 68 }} />)}
          </div>
        ) : (
          <>
            {/* Stats rapides */}
            {data && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Produits", value: data._count.products, color: "var(--color-primary)" },
                  { label: "Clients", value: data._count.customers, color: "var(--color-accent)" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="card text-center">
                    <p className="amount" style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color }}>
                      {value}
                    </p>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire */}
            <section>
              <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem", paddingLeft: "0.25rem" }}>
                Informations
              </p>
              <div className="space-y-3">
                {[
                  { key: "name", label: "Nom de la boutique *", placeholder: "Ma Quincaillerie", icon: Building2 },
                  { key: "phone", label: "Téléphone", placeholder: "77 000 00 00", icon: Phone },
                  { key: "address", label: "Adresse", placeholder: "Rue 10, Médina", icon: MapPin },
                  { key: "city", label: "Ville", placeholder: "Dakar", icon: MapPin },
                ].map(({ key, label, placeholder, icon: Icon }) => (
                  <div key={key}>
                    <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {label}
                    </label>
                    <div className="relative mt-1.5">
                      <Icon
                        size={16}
                        color="var(--color-text-muted)"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      />
                      <input
                        type="text"
                        placeholder={placeholder}
                        value={form[key as keyof Form]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="input pl-10"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Bouton sauvegarder */}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="w-full flex items-center justify-center gap-2 rounded-2xl tap-feedback"
              style={{
                height: 52,
                background: isDirty ? (saved ? "#1B5E20" : "var(--color-primary)") : "var(--color-border)",
                color: isDirty ? "white" : "var(--color-text-muted)",
                fontWeight: 700,
                fontSize: "var(--text-base)",
                transition: "all 0.2s",
              }}
            >
              {saved ? (
                <>
                  <Check size={18} strokeWidth={2.5} />
                  Sauvegardé !
                </>
              ) : saving ? (
                "Enregistrement…"
              ) : (
                "Sauvegarder les modifications"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

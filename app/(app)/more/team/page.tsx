"use client";
import { useEffect, useState } from "react";
import {
  Users, User, Phone, Shield, Clock, UserX, Plus, X,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import api, { formatDate } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

interface TeamMember {
  role: string;
  user: {
    id: number;
    name: string;
    phone: string;
    isActive: boolean;
    lastLoginAt: string | null;
  };
}

export default function TeamPage() {
  const { shop, user: me } = useAuthStore();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeactivate, setConfirmDeactivate] = useState<TeamMember | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const load = () => {
    if (!shop?.id) return;
    api
      .get(`/api/shops/${shop.id}/team`)
      .then((r) => setTeam(r.data.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleDeactivate = async () => {
    if (!confirmDeactivate || !shop?.id) return;
    setDeactivating(true);
    try {
      await api.delete(`/api/shops/${shop.id}/team/${confirmDeactivate.user.id}`);
      setConfirmDeactivate(null);
      load();
    } catch {
      //
    } finally {
      setDeactivating(false);
    }
  };

  const isOwner = team.find((m) => m.user.id === me?.id)?.role === "owner";

  return (
    <div>
      <PageHeader
        title="Mon équipe"
        subtitle={loading ? "…" : `${team.length} membre${team.length > 1 ? "s" : ""}`}
        back
      />

      <div className="page-content space-y-4">
        {/* Info */}
        <div
          className="rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{ background: "var(--color-primary-10)", border: "1px solid rgba(27,94,32,0.15)" }}
        >
          <Shield size={18} color="var(--color-primary)" className="shrink-0 mt-0.5" />
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", lineHeight: 1.5 }}>
            La gestion multi-utilisateurs (vendeurs, caissiers) est disponible dans la prochaine version. Votre compte est actuellement le seul accès à la boutique.
          </p>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="skeleton rounded-2xl" style={{ height: 72 }} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {team.map((member) => {
              const isMe = member.user.id === me?.id;
              const isOwnerRole = member.role === "owner";
              return (
                <div
                  key={member.user.id}
                  className="card flex items-center gap-3"
                  style={{ padding: "0.75rem", opacity: member.user.isActive ? 1 : 0.5 }}
                >
                  <div
                    className="flex items-center justify-center rounded-xl shrink-0 font-bold"
                    style={{
                      width: 44,
                      height: 44,
                      background: isOwnerRole ? "var(--color-primary-10)" : "var(--color-surface-2)",
                      color: isOwnerRole ? "var(--color-primary)" : "var(--color-text-muted)",
                      fontSize: "var(--text-base)",
                    }}
                  >
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)" }}>
                        {member.user.name}
                        {isMe && (
                          <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}> (vous)</span>
                        )}
                      </p>
                      <span
                        className="rounded-lg px-1.5 py-0.5 shrink-0"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: isOwnerRole ? "var(--color-primary-10)" : "var(--color-surface-2)",
                          color: isOwnerRole ? "var(--color-primary)" : "var(--color-text-muted)",
                        }}
                      >
                        {isOwnerRole ? "Gérant" : "Vendeur"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                        <Phone size={11} />
                        <span style={{ fontSize: "var(--text-xs)" }}>{member.user.phone}</span>
                      </div>
                      {member.user.lastLoginAt && (
                        <div className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                          <Clock size={11} />
                          <span style={{ fontSize: "var(--text-xs)" }}>
                            {formatDate(member.user.lastLoginAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {!member.user.isActive && (
                    <span className="badge-danger shrink-0">Inactif</span>
                  )}
                  {isOwner && !isMe && member.user.isActive && (
                    <button
                      onClick={() => setConfirmDeactivate(member)}
                      className="flex items-center justify-center rounded-xl tap-feedback shrink-0"
                      style={{ width: 32, height: 32, background: "rgba(183,28,28,0.06)" }}
                    >
                      <UserX size={15} color="var(--color-danger)" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Coming soon: ajouter membre */}
        <div
          className="card flex items-center gap-3 opacity-50"
          style={{ border: "1.5px dashed var(--color-border)" }}
        >
          <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 44, height: 44, background: "var(--color-surface-2)" }}>
            <Plus size={20} color="var(--color-text-muted)" />
          </div>
          <div>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-muted)" }}>
              Ajouter un vendeur
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              Disponible dans la prochaine mise à jour
            </p>
          </div>
        </div>
      </div>

      {/* Confirm deactivate */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-3xl w-full max-w-sm" style={{ background: "var(--color-surface)", padding: "1.5rem" }}>
            <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.5rem" }}>
              Désactiver {confirmDeactivate.user.name} ?
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Cette personne ne pourra plus se connecter à MACIF.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="rounded-2xl tap-feedback"
                style={{ height: 48, background: "var(--color-surface-2)", color: "var(--color-text)", fontWeight: 700 }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deactivating}
                className="rounded-2xl tap-feedback"
                style={{ height: 48, background: "var(--color-danger)", color: "white", fontWeight: 700 }}
              >
                {deactivating ? "…" : "Désactiver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

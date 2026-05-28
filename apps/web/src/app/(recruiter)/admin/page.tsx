"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Building2, Users, Shield, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid var(--color-border-light)",
  boxShadow: "var(--shadow-card)",
  padding: "24px",
};

const th: React.CSSProperties = {
  textAlign: "left", padding: "10px 20px",
  fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)",
  textTransform: "uppercase", letterSpacing: "0.05em",
  background: "var(--color-background)",
  borderBottom: "1px solid var(--color-border-light)",
};

const td: React.CSSProperties = {
  padding: "13px 20px", fontSize: 13,
  color: "var(--color-text-secondary)",
  borderBottom: "1px solid var(--color-border-light)",
  verticalAlign: "middle",
};

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  admin:     { label: "Admin",      bg: "#f3eff9", text: "#7c3aed" },
  recruiter: { label: "Recrutador", bg: "#e8eff9", text: "#1c62cb" },
  candidate: { label: "Candidato",  bg: "#f1f1f1", text: "#52575f" },
};

const MOCK_USERS = [
  { id: "1", full_name: "Admin TechCorp",  email: "admin@techcorp.com",     role: "admin",     is_active: true,  last_login: "2026-05-12" },
  { id: "2", full_name: "Ana Recruiter",   email: "recruiter@techcorp.com", role: "recruiter", is_active: true,  last_login: "2026-05-11" },
  { id: "3", full_name: "Carlos Mendes",   email: "carlos@techcorp.com",    role: "recruiter", is_active: true,  last_login: "2026-05-10" },
  { id: "4", full_name: "Beatriz Souza",   email: "beatriz@techcorp.com",   role: "recruiter", is_active: false, last_login: "2026-04-20" },
  { id: "5", full_name: "João Candidato",  email: "candidate@example.com",  role: "candidate", is_active: true,  last_login: "2026-05-09" },
];

export default function AdminPage() {
  const { user } = useAuthStore();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState("recruiter");
  const [sending, setSending] = useState(false);

  async function handleInvite() {
    if (!inviteEmail.trim() || !inviteName.trim() || !invitePassword.trim()) {
      toast.error("Preencha nome, e-mail e senha");
      return;
    }
    setSending(true);
    try {
      await api.post("/auth/invite-user", {
        email: inviteEmail.trim(),
        full_name: inviteName.trim(),
        password: invitePassword,
        role: inviteRole,
      });
      toast.success(`Usuário ${inviteEmail} criado`);
      setInviteEmail("");
      setInviteName("");
      setInvitePassword("");
      setShowInvite(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Erro ao criar usuário");
    } finally {
      setSending(false);
    }
  }

  if (user?.role !== "admin") {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "var(--color-text-disabled)" }}>
        <Shield size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
        <p style={{ fontSize: 14, fontWeight: 500 }}>Acesso restrito a administradores</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.4px" }}>
          Administração
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 4 }}>
          Empresa e usuários
        </p>
      </div>

      {/* Company info */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={16} style={{ color: "var(--color-primary)" }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
            Dados da empresa
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          {[
            { label: "Nome",   value: "TechCorp Demo" },
            { label: "Slug",   value: "techcorp" },
          ].map(({ label, value }) => (
            <div key={label} style={{ paddingBottom: 14, borderBottom: "1px solid var(--color-border-light)", paddingRight: 24 }}>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <button style={{
            padding: "7px 16px", borderRadius: 8,
            border: "1px solid var(--color-border-light)", background: "#fff",
            fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", cursor: "pointer",
          }}>
            Editar informações
          </button>
        </div>
      </div>

      {/* Users */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} style={{ color: "var(--color-primary)" }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
              Usuários ({MOCK_USERS.length})
            </div>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 8,
              border: "none", background: "var(--color-primary)", color: "#fff",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Plus size={13} /> Convidar usuário
          </button>
        </div>

        {showInvite && (
          <div style={{
            background: "var(--color-primary-lightest)",
            border: "1px solid var(--color-primary-light)",
            borderRadius: 10, padding: 16, marginBottom: 20,
            display: "flex", gap: 10, alignItems: "flex-end",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 5 }}>Nome</div>
              <input
                style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1px solid var(--color-border)", fontSize: 13, boxSizing: "border-box" }}
                value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 5 }}>E-mail</div>
              <input
                style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1px solid var(--color-border)", fontSize: 13, boxSizing: "border-box" }}
                type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="nome@empresa.com"
              />
            </div>
            <div style={{ width: 140 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 5 }}>Senha</div>
              <input
                style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1px solid var(--color-border)", fontSize: 13, boxSizing: "border-box" }}
                type="text" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)}
                placeholder="senha inicial"
              />
            </div>
            <div style={{ width: 160 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 5 }}>Perfil</div>
              <select
                style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1px solid var(--color-border)", fontSize: 13 }}
                value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="recruiter">Recrutador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              onClick={handleInvite} disabled={sending}
              style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: "var(--color-primary)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: sending ? 0.6 : 1 }}
            >
              {sending ? "Enviando..." : "Enviar convite"}
            </button>
            <button
              onClick={() => setShowInvite(false)}
              style={{ padding: "8px 12px", borderRadius: 7, border: "1px solid var(--color-border-light)", background: "#fff", fontSize: 12, cursor: "pointer" }}
            >
              Cancelar
            </button>
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Usuário</th>
              <th style={th}>E-mail</th>
              <th style={th}>Perfil</th>
              <th style={th}>Status</th>
              <th style={th}>Último acesso</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_USERS.map((u, idx) => {
              const rc = ROLE_CONFIG[u.role];
              const isLast = idx === MOCK_USERS.length - 1;
              return (
                <tr key={u.id} style={{ background: "#fff" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-background)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: "var(--color-primary)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>
                        {u.full_name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{u.full_name}</span>
                    </div>
                  </td>
                  <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>{u.email}</td>
                  <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                    <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: rc.bg, color: rc.text }}>
                      {rc.label}
                    </span>
                  </td>
                  <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: u.is_active ? "#3d7a30" : "#9ca3af" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: u.is_active ? "#3d7a30" : "#9ca3af" }} />
                      {u.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                    {new Date(u.last_login).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

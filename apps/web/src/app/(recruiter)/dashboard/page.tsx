"use client";

import { useQueries } from "@tanstack/react-query";
import { Briefcase, Users, ClipboardList, TrendingUp } from "lucide-react";
import { api } from "@/lib/api-client";
import Link from "next/link";

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid var(--color-border-light)",
  boxShadow: "var(--shadow-card)",
  padding: "20px 22px",
};

const STATS = [
  { label: "Vagas publicadas",  color: "#1c62cb", lightBg: "#e8eff9", icon: Briefcase,    href: "/jobs" },
  { label: "Candidatos",        color: "#3d7a30", lightBg: "#eef5ec", icon: Users,        href: "/candidates" },
  { label: "Em avaliação",      color: "#e6960a", lightBg: "#fdf5e6", icon: ClipboardList, href: "/applications?status=assessment" },
  { label: "Contratados",       color: "#7c3aed", lightBg: "#f3eff9", icon: TrendingUp,   href: "/applications?status=hired" },
];

const STAGES = [
  { value: "submitted", label: "Recebidas",  color: "#6b7280" },
  { value: "screening", label: "Triagem",    color: "#1c62cb" },
  { value: "assessment",label: "Avaliação",  color: "#7c3aed" },
  { value: "interview", label: "Entrevista", color: "#e6960a" },
  { value: "offer",     label: "Proposta",   color: "#ea580c" },
  { value: "hired",     label: "Contratados",color: "#3d7a30" },
];

export default function DashboardPage() {
  const statResults = useQueries({
    queries: [
      { queryKey: ["stats-jobs"],        queryFn: async () => { const { data } = await api.get("/jobs", { params: { page_size: 1, status: "published" } }); return data.total as number; } },
      { queryKey: ["stats-candidates"],  queryFn: async () => { const { data } = await api.get("/candidates", { params: { page_size: 1 } }); return data.total as number; } },
      { queryKey: ["stats-assessment"],  queryFn: async () => { const { data } = await api.get("/applications", { params: { page_size: 1, appl_status: "assessment" } }); return data.total as number; } },
      { queryKey: ["stats-hired"],       queryFn: async () => { const { data } = await api.get("/applications", { params: { page_size: 1, appl_status: "hired" } }); return data.total as number; } },
    ],
  });

  const pipelineResults = useQueries({
    queries: STAGES.map((s) => ({
      queryKey: ["pipeline", s.value],
      queryFn: async () => {
        const { data } = await api.get("/applications", { params: { page_size: 1, appl_status: s.value } });
        return data.total as number;
      },
    })),
  });

  const anyLoading = statResults.some((r) => r.isLoading);
  const pipelineLoading = pipelineResults.some((r) => r.isLoading);
  const pipelineTotal = pipelineResults.reduce((s, r) => s + (r.data ?? 0), 0);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.4px" }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 4 }}>
          Visão geral do processo seletivo
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {STATS.map(({ label, color, lightBg, icon: Icon, href }, i) => {
          const val = statResults[i].data ?? 0;
          return (
            <Link key={label} href={href} style={{ ...card, textDecoration: "none", display: "block", transition: "box-shadow 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-card)")}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    {label}
                  </div>
                  {anyLoading ? (
                    <div style={{ height: 32, width: 56, background: "var(--color-border-light)", borderRadius: 6, animation: "pulse 1.5s infinite" }} />
                  ) : (
                    <div style={{ fontSize: 32, fontWeight: 700, color, letterSpacing: "-1px", lineHeight: 1 }}>
                      {val}
                    </div>
                  )}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: lightBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} style={{ color }} strokeWidth={2} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Lower row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Pipeline */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 20 }}>
            Pipeline de candidaturas
          </div>

          {pipelineLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ height: 16, background: "var(--color-border-light)", borderRadius: 4 }} />
              ))}
            </div>
          ) : pipelineTotal === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-text-disabled)" }}>Nenhuma candidatura ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {STAGES.map((s, i) => {
                const count = pipelineResults[i].data ?? 0;
                const pct = pipelineTotal > 0 ? Math.round((count / pipelineTotal) * 100) : 0;
                return (
                  <div key={s.value}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)" }}>{s.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>{count}</span>
                    </div>
                    <div style={{ height: 5, background: "var(--color-border-light)", borderRadius: 100 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: s.color, borderRadius: 100, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                );
              })}
              <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>
                {pipelineTotal} candidatura{pipelineTotal !== 1 ? "s" : ""} no total
              </p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 20 }}>
            Ações rápidas
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { href: "/jobs/new",      label: "Criar nova vaga",            icon: Briefcase,    primary: true },
              { href: "/applications",  label: "Ver candidaturas pendentes", icon: ClipboardList, primary: false },
              { href: "/candidates",    label: "Ver candidatos",              icon: Users,         primary: false },
            ].map(({ href, label, icon: Icon, primary }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px ${primary ? "solid" : "dashed"} ${primary ? "var(--color-primary)" : "var(--color-border-light)"}`,
                  background: primary ? "var(--color-primary-lightest)" : "#fff",
                  color: primary ? "var(--color-primary)" : "var(--color-text-secondary)",
                  fontSize: 13, fontWeight: 500,
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = primary ? "var(--color-primary-light)" : "var(--color-background)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = primary ? "var(--color-primary-lightest)" : "#fff"; }}
              >
                <Icon size={15} strokeWidth={2} />
                {label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

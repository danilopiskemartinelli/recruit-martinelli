"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { MapPin, Clock, Briefcase, ChevronRight, FileText, CheckCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid var(--color-border-light)",
  boxShadow: "var(--shadow-card)",
  padding: "20px 22px",
};

const MOCK_JOBS = [
  {
    id: "j1", title: "Desenvolvedor Frontend", company: "TechCorp Demo",
    location: "São Paulo, SP", modality: "remote", job_type: "full_time",
    description: "Buscamos um Desenvolvedor Frontend experiente para trabalhar com React, TypeScript e Next.js em projetos de grande escala.",
    tags: ["React", "TypeScript", "Next.js", "Tailwind"],
    salary_min: 8000, salary_max: 14000,
  },
  {
    id: "j2", title: "Engenheiro Backend Sênior", company: "TechCorp Demo",
    location: "Remoto", modality: "remote", job_type: "full_time",
    description: "Vaga para Engenheiro Backend com forte experiência em Node.js ou Python, APIs RESTful e arquitetura de microsserviços.",
    tags: ["Node.js", "Python", "AWS", "PostgreSQL"],
    salary_min: 12000, salary_max: 20000,
  },
  {
    id: "j3", title: "Analista de Dados", company: "TechCorp Demo",
    location: "Híbrido – São Paulo", modality: "hybrid", job_type: "full_time",
    description: "Procuramos um Analista de Dados para transformar dados complexos em insights acionáveis para o negócio.",
    tags: ["Python", "SQL", "Power BI", "Machine Learning"],
    salary_min: 7000, salary_max: 12000,
  },
  {
    id: "j4", title: "Product Designer", company: "TechCorp Demo",
    location: "São Paulo, SP", modality: "hybrid", job_type: "full_time",
    description: "Oportunidade para Product Designer criar experiências digitais centradas no usuário, do discovery ao handoff.",
    tags: ["Figma", "Design System", "UX Research"],
    salary_min: 7000, salary_max: 11000,
  },
];

const MOCK_APPLICATIONS = [
  { id: "a1", job: "Desenvolvedor Frontend", status: "assessment",  applied_at: "2026-05-08" },
  { id: "a2", job: "Analista de Dados",       status: "screening",   applied_at: "2026-05-03" },
];

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  submitted:  { label: "Recebida",   bg: "#f1f1f1", text: "#52575f", dot: "#9ca3af" },
  screening:  { label: "Triagem",    bg: "#e8eff9", text: "#1c62cb", dot: "#1c62cb" },
  assessment: { label: "Avaliação",  bg: "#f3eff9", text: "#7c3aed", dot: "#7c3aed" },
  interview:  { label: "Entrevista", bg: "#fdf5e6", text: "#e6960a", dot: "#e6960a" },
  offer:      { label: "Proposta",   bg: "#fff2ed", text: "#ea580c", dot: "#ea580c" },
  hired:      { label: "Contratado", bg: "#eef5ec", text: "#3d7a30", dot: "#3d7a30" },
  rejected:   { label: "Reprovado",  bg: "#fceaea", text: "#c62828", dot: "#c62828" },
};

const MODALITY_LABEL: Record<string, string> = {
  remote: "Remoto", hybrid: "Híbrido", onsite: "Presencial",
};
const JOB_TYPE_LABEL: Record<string, string> = {
  full_time: "Tempo integral", part_time: "Meio período", contract: "Contrato", internship: "Estágio",
};

export default function PortalPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState<"jobs" | "my">("jobs");
  const [applied, setApplied] = useState<Set<string>>(new Set(MOCK_APPLICATIONS.map((a) => a.id.replace("a", "j"))));
  const [applying, setApplying] = useState<string | null>(null);

  async function handleApply(jobId: string) {
    setApplying(jobId);
    await new Promise((r) => setTimeout(r, 800));
    setApplied((prev) => new Set([...prev, jobId]));
    setApplying(null);
    toast.success("Candidatura enviada com sucesso!");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>
      {/* Top bar */}
      <header style={{
        background: "#fff", borderBottom: "1px solid var(--color-border-light)",
        padding: "0 32px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-primary)", letterSpacing: "-0.3px" }}>
          HR Platform
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400, marginLeft: 8 }}>Portal do Candidato</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            Olá, {user?.full_name?.split(" ")[0] ?? "Candidato"}
          </span>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "1px solid var(--color-border-light)",
              borderRadius: 7, padding: "6px 12px", cursor: "pointer",
              fontSize: 12, color: "var(--color-text-secondary)",
            }}
          >
            <LogOut size={13} /> Sair
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "2px solid var(--color-border-light)", paddingBottom: 0 }}>
          {[
            { key: "jobs", label: "Vagas abertas" },
            { key: "my",   label: `Minhas candidaturas (${MOCK_APPLICATIONS.length})` },
          ].map(({ key, label }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key as typeof tab)}
                style={{
                  padding: "10px 20px",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: `2px solid ${active ? "var(--color-primary)" : "transparent"}`,
                  marginBottom: -2, transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {tab === "jobs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {MOCK_JOBS.map((job) => {
              const alreadyApplied = applied.has(job.id);
              return (
                <div key={job.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)" }}>{job.title}</h3>
                      {alreadyApplied && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#3d7a30", background: "#eef5ec", padding: "2px 8px", borderRadius: 100 }}>
                          <CheckCircle size={10} /> Candidatado
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12, lineHeight: 1.5, maxWidth: 560 }}>
                      {job.description}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-tertiary)" }}>
                        <MapPin size={11} /> {job.location}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-tertiary)" }}>
                        <Briefcase size={11} /> {MODALITY_LABEL[job.modality]}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-tertiary)" }}>
                        <Clock size={11} /> {JOB_TYPE_LABEL[job.job_type]}
                      </span>
                      {job.salary_min && (
                        <span style={{ fontSize: 11, color: "#3d7a30", fontWeight: 500 }}>
                          R$ {job.salary_min.toLocaleString("pt-BR")} – {job.salary_max.toLocaleString("pt-BR")}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {job.tags.map((t) => (
                        <span key={t} style={{ padding: "2px 8px", borderRadius: 100, background: "var(--color-primary-light)", color: "var(--color-primary)", fontSize: 10, fontWeight: 500 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginLeft: 24, flexShrink: 0 }}>
                    <button
                      onClick={() => !alreadyApplied && handleApply(job.id)}
                      disabled={alreadyApplied || applying === job.id}
                      style={{
                        padding: "9px 20px", borderRadius: 8, border: "none",
                        background: alreadyApplied ? "var(--color-background)" : "var(--color-primary)",
                        color: alreadyApplied ? "var(--color-text-disabled)" : "#fff",
                        fontSize: 13, fontWeight: 600,
                        cursor: alreadyApplied ? "default" : "pointer",
                        opacity: applying === job.id ? 0.6 : 1,
                        transition: "all 0.15s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {applying === job.id ? "Enviando..." : alreadyApplied ? "Candidatado" : "Candidatar-se"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "my" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {MOCK_APPLICATIONS.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "var(--color-text-disabled)" }}>
                <FileText size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
                <p style={{ fontSize: 13, fontWeight: 500 }}>Você ainda não se candidatou a nenhuma vaga</p>
                <button onClick={() => setTab("jobs")} style={{ marginTop: 8, fontSize: 13, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer" }}>
                  Ver vagas abertas →
                </button>
              </div>
            ) : (
              MOCK_APPLICATIONS.map((app) => {
                const sc = STATUS_LABELS[app.status];
                return (
                  <div key={app.id} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>{app.job}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                        Candidatado em {new Date(app.applied_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: sc.bg, color: sc.text,
                      padding: "5px 14px", borderRadius: 100,
                      fontSize: 12, fontWeight: 600,
                      border: `1px solid ${sc.dot}30`,
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot }} />
                      {sc.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

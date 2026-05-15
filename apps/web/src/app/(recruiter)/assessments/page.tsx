"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ClipboardList, Clock, CheckCircle, Users, MoreHorizontal } from "lucide-react";

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  quiz:        { label: "Quiz",       bg: "#e8eff9", text: "#1c62cb" },
  technical:   { label: "Técnica",    bg: "#f3eff9", text: "#7c3aed" },
  coding:      { label: "Código",     bg: "#fdf5e6", text: "#e6960a" },
  personality: { label: "Perfil",     bg: "#eef5ec", text: "#3d7a30" },
  mixed:       { label: "Mista",      bg: "#fff2ed", text: "#ea580c" },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active:   { label: "Ativa",     bg: "#eef5ec", text: "#3d7a30", dot: "#3d7a30" },
  draft:    { label: "Rascunho",  bg: "#f1f1f1", text: "#52575f", dot: "#9ca3af" },
  archived: { label: "Arquivada", bg: "#fceaea", text: "#c62828", dot: "#c62828" },
};

const MOCK_ASSESSMENTS = [
  {
    id: "1", title: "Lógica de Programação", type: "technical", status: "active",
    questions: 20, time_limit_minutes: 60, candidates_count: 34, passing_score: 70,
    created_at: "2026-04-10",
  },
  {
    id: "2", title: "Raciocínio Lógico Geral", type: "quiz", status: "active",
    questions: 15, time_limit_minutes: 30, candidates_count: 61, passing_score: 60,
    created_at: "2026-04-02",
  },
  {
    id: "3", title: "Desafio React + TypeScript", type: "coding", status: "active",
    questions: 5, time_limit_minutes: 90, candidates_count: 18, passing_score: 75,
    created_at: "2026-03-28",
  },
  {
    id: "4", title: "Perfil Comportamental DISC", type: "personality", status: "active",
    questions: 28, time_limit_minutes: null, candidates_count: 45, passing_score: null,
    created_at: "2026-03-15",
  },
  {
    id: "5", title: "SQL e Banco de Dados", type: "technical", status: "draft",
    questions: 12, time_limit_minutes: 45, candidates_count: 0, passing_score: 65,
    created_at: "2026-05-01",
  },
  {
    id: "6", title: "Comunicação e Soft Skills", type: "mixed", status: "draft",
    questions: 20, time_limit_minutes: 40, candidates_count: 0, passing_score: 60,
    created_at: "2026-05-08",
  },
  {
    id: "7", title: "Python Avançado 2025", type: "coding", status: "archived",
    questions: 10, time_limit_minutes: 120, candidates_count: 22, passing_score: 80,
    created_at: "2025-11-10",
  },
];

const FILTERS = [
  { value: "all",      label: "Todas" },
  { value: "active",   label: "Ativas" },
  { value: "draft",    label: "Rascunhos" },
  { value: "archived", label: "Arquivadas" },
];

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid var(--color-border-light)",
  boxShadow: "var(--shadow-card)",
  padding: "20px 22px",
};

export default function AssessmentsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all"
    ? MOCK_ASSESSMENTS
    : MOCK_ASSESSMENTS.filter((a) => a.status === filter);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.4px" }}>
            Avaliações
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 4 }}>
            {MOCK_ASSESSMENTS.filter((a) => a.status === "active").length} avaliações ativas
          </p>
        </div>
        <button
          onClick={() => router.push("/assessments/new")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--color-primary)", color: "#fff",
            padding: "9px 16px", borderRadius: 8, border: "none",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-primary-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-primary)")}
        >
          <Plus size={15} strokeWidth={2.5} />
          Nova avaliação
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "5px 14px", borderRadius: 100,
                fontSize: 12, fontWeight: 500,
                border: active ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border-light)",
                background: active ? "var(--color-primary-light)" : "#fff",
                color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--color-text-disabled)" }}>
          <ClipboardList size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
          <p style={{ fontSize: 13, fontWeight: 500 }}>Nenhuma avaliação encontrada</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {filtered.map((a) => {
            const sc = STATUS_CONFIG[a.status];
            const tc = TYPE_CONFIG[a.type];
            return (
              <div
                key={a.id}
                style={{ ...card, cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
                  (e.currentTarget as HTMLElement).style.borderColor = "#c5d3e8";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-light)";
                }}
              >
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                      background: tc.bg, color: tc.text,
                    }}>{tc.label}</span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                      background: sc.bg, color: sc.text,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot }} />
                      {sc.label}
                    </span>
                  </div>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", padding: 2 }}>
                    <MoreHorizontal size={15} />
                  </button>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 16, lineHeight: 1.4 }}>
                  {a.title}
                </h3>

                {/* Stats */}
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-text-tertiary)" }}>
                    <CheckCircle size={13} />
                    {a.questions} questões
                  </div>
                  {a.time_limit_minutes && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-text-tertiary)" }}>
                      <Clock size={13} />
                      {a.time_limit_minutes} min
                    </div>
                  )}
                  {a.candidates_count > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-text-tertiary)" }}>
                      <Users size={13} />
                      {a.candidates_count}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--color-border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                    {new Date(a.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  {a.passing_score && (
                    <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                      Mínimo: {a.passing_score}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Brain, TrendingUp, AlertCircle, CheckCircle, Star, ChevronDown } from "lucide-react";

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid var(--color-border-light)",
  boxShadow: "var(--shadow-card)",
  padding: "20px 22px",
};

const MOCK_INSIGHTS = [
  {
    id: "1", candidate: "Lucas Ferreira", job: "Engenheiro Backend Sênior",
    score: 91, skills_match: 88, experience_match: 95, culture_fit: 82,
    summary: "Forte alinhamento técnico. Experiência sólida com Node.js e AWS. Recomendado para entrevista técnica.",
    recommendation: "strong_yes", applied_at: "2026-05-10",
    top_skills: ["Node.js", "AWS", "PostgreSQL"],
    gaps: ["Kubernetes"],
  },
  {
    id: "2", candidate: "Mariana Costa", job: "Product Designer",
    score: 87, skills_match: 92, experience_match: 80, culture_fit: 90,
    summary: "Portfólio impressionante com casos de uso centrados no usuário. Cultura bem alinhada.",
    recommendation: "yes", applied_at: "2026-05-09",
    top_skills: ["Figma", "Design System", "UX Research"],
    gaps: ["Motion Design"],
  },
  {
    id: "3", candidate: "Rafael Souza", job: "Engenheiro Backend Sênior",
    score: 74, skills_match: 70, experience_match: 78, culture_fit: 68,
    summary: "Bom perfil técnico, porém com menos experiência em sistemas distribuídos. Vale explorar em triagem.",
    recommendation: "maybe", applied_at: "2026-05-08",
    top_skills: ["Python", "Django", "Redis"],
    gaps: ["AWS", "Microsserviços"],
  },
  {
    id: "4", candidate: "Camila Alves", job: "Analista de Dados",
    score: 95, skills_match: 96, experience_match: 93, culture_fit: 94,
    summary: "Perfil excepcional. Histórico comprovado em análise preditiva e visualização de dados. Prioridade alta.",
    recommendation: "strong_yes", applied_at: "2026-05-07",
    top_skills: ["Python", "Power BI", "SQL", "Machine Learning"],
    gaps: [],
  },
  {
    id: "5", candidate: "Thiago Lima", job: "Desenvolvedor Frontend",
    score: 62, skills_match: 65, experience_match: 60, culture_fit: 58,
    summary: "Nível júnior, abaixo do esperado para a vaga sênior. Pode ser considerado para vaga júnior futura.",
    recommendation: "no", applied_at: "2026-05-06",
    top_skills: ["React", "JavaScript"],
    gaps: ["TypeScript", "Next.js", "Testes"],
  },
  {
    id: "6", candidate: "Fernanda Rocha", job: "Gerente de Projetos",
    score: 83, skills_match: 85, experience_match: 88, culture_fit: 75,
    summary: "Boa experiência em gestão ágil. Certificação PMP é diferencial. Cultura requer avaliação adicional.",
    recommendation: "yes", applied_at: "2026-05-05",
    top_skills: ["Scrum", "Jira", "PMP", "Stakeholder Management"],
    gaps: ["OKRs"],
  },
];

const RECOMMENDATION_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  strong_yes: { label: "Recomendado", bg: "#eef5ec", text: "#3d7a30", icon: CheckCircle },
  yes:        { label: "Sim",          bg: "#e8eff9", text: "#1c62cb", icon: TrendingUp },
  maybe:      { label: "Talvez",       bg: "#fdf5e6", text: "#e6960a", icon: AlertCircle },
  no:         { label: "Não",          bg: "#fceaea", text: "#c62828", icon: AlertCircle },
};

const th: React.CSSProperties = {
  textAlign: "left", padding: "10px 18px",
  fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)",
  textTransform: "uppercase", letterSpacing: "0.05em",
  background: "var(--color-background)",
  borderBottom: "1px solid var(--color-border-light)",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "13px 18px", fontSize: 13,
  color: "var(--color-text-secondary)",
  borderBottom: "1px solid var(--color-border-light)",
  verticalAlign: "middle",
};

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: "var(--color-border-light)", borderRadius: 100 }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 100, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-primary)", minWidth: 28 }}>{value}%</span>
    </div>
  );
}

export default function InsightsPage() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all"
    ? MOCK_INSIGHTS
    : MOCK_INSIGHTS.filter((i) => i.recommendation === filter);

  const avg = Math.round(MOCK_INSIGHTS.reduce((s, i) => s + i.score, 0) / MOCK_INSIGHTS.length);
  const strongYes = MOCK_INSIGHTS.filter((i) => i.recommendation === "strong_yes").length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.4px" }}>
          Insights de IA
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 4 }}>
          Análise automática de currículos e candidaturas
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Analisados",       value: MOCK_INSIGHTS.length, color: "#1c62cb", bg: "#e8eff9", icon: Brain },
          { label: "Score médio",      value: `${avg}%`,             color: "#7c3aed", bg: "#f3eff9", icon: Star },
          { label: "Recomendados",     value: strongYes,             color: "#3d7a30", bg: "#eef5ec", icon: CheckCircle },
          { label: "Requerem atenção", value: MOCK_INSIGHTS.filter((i) => i.recommendation === "no").length, color: "#c62828", bg: "#fceaea", icon: AlertCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  {label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: "-0.5px", lineHeight: 1 }}>
                  {value}
                </div>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={17} style={{ color }} strokeWidth={2} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[
          { value: "all",        label: "Todos" },
          { value: "strong_yes", label: "Recomendados" },
          { value: "yes",        label: "Sim" },
          { value: "maybe",      label: "Talvez" },
          { value: "no",         label: "Não" },
        ].map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "5px 14px", borderRadius: 100, fontSize: 12, fontWeight: 500,
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

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--color-border-light)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Candidato</th>
              <th style={th}>Vaga</th>
              <th style={{ ...th, minWidth: 140 }}>Score geral</th>
              <th style={{ ...th, minWidth: 140 }}>Match skills</th>
              <th style={th}>Destaques</th>
              <th style={th}>IA sugere</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const rec = RECOMMENDATION_CONFIG[item.recommendation];
              const RecIcon = rec.icon;
              const isLast = idx === filtered.length - 1;
              const scoreColor = item.score >= 85 ? "#3d7a30" : item.score >= 70 ? "#1c62cb" : item.score >= 55 ? "#e6960a" : "#c62828";

              return (
                <tr
                  key={item.id}
                  style={{ background: "#fff" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-background)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                    <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{item.candidate}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                      {new Date(item.applied_at).toLocaleDateString("pt-BR")}
                    </div>
                  </td>
                  <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                    <span style={{ maxWidth: 180, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.job}
                    </span>
                  </td>
                  <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                    <ScoreBar value={item.score} color={scoreColor} />
                  </td>
                  <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                    <ScoreBar value={item.skills_match} color="#1c62cb" />
                  </td>
                  <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {item.top_skills.slice(0, 3).map((s) => (
                        <span key={s} style={{
                          padding: "2px 7px", borderRadius: 100,
                          background: "var(--color-primary-light)", color: "var(--color-primary)",
                          fontSize: 10, fontWeight: 500,
                        }}>{s}</span>
                      ))}
                      {item.gaps.length > 0 && (
                        <span style={{ padding: "2px 7px", borderRadius: 100, background: "#fceaea", color: "#c62828", fontSize: 10, fontWeight: 500 }}>
                          Gap: {item.gaps[0]}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: rec.bg, color: rec.text,
                      padding: "4px 10px", borderRadius: 100,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      <RecIcon size={11} />
                      {rec.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: 11, color: "var(--color-text-disabled)", marginTop: 16, textAlign: "center" }}>
        Análises geradas por IA são auxiliares e não substituem a avaliação humana.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";

type SubFactor = { score: number; raw: number; max: number };
type BigFiveFactor = { score: number; raw: number; max: number; sub_factors: Record<string, SubFactor> };
type Scores = {
  big_five: Record<string, BigFiveFactor>;
  stress: { score: number; max: number; level: string };
  depression: { score: number; max: number; level: string };
  motivators: Record<string, { score: number; max: number; pct: number }>;
  disc: Record<string, { name: string; score: number; max: number; pct: number; level: string }>;
  qa: { score: number; max: number; level: string };
};

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid var(--color-border-light)",
  boxShadow: "var(--shadow-card)",
  padding: "20px 22px",
  marginBottom: 16,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "var(--color-text-primary)",
  marginBottom: 14,
  letterSpacing: "-0.2px",
};

function Bar({ pct, label, value }: { pct: number; label: string; value?: string }) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>
          {value ?? `${Math.round(clamped * 100)}%`}
        </span>
      </div>
      <div style={{ height: 6, background: "#eef2f7", borderRadius: 100, overflow: "hidden" }}>
        <div style={{
          width: `${clamped * 100}%`,
          height: "100%",
          background: "var(--color-primary)",
          borderRadius: 100,
        }} />
      </div>
    </div>
  );
}

type AnswersPayload = {
  completed_at: string;
  tests: {
    big_five: { title: string; scale: { min: number; max: number }; questions: { num: number; text: string; factor: string; sub_factor: string }[]; answers: Record<string, number> };
    stress: { title: string; scale: { min: number; max: number; labels: Record<string, string> }; questions: { num: number; text: string }[]; answers: Record<string, number> };
    depression: { title: string; questions: { key: string; text: string; options: string[] }[]; answers: Record<string, number> };
    motivators: { title: string; scale: { min: number; max: number; labels: Record<string, string> }; groups: Record<string, { num: number; text: string }[]>; answers: Record<string, number> };
    disc: { title: string; scale: { min: number; max: number }; dimensions: Record<string, { name: string; pairs: [string, string][] }>; answers: Record<string, number[]> };
    qa: { title: string; scale: { min: number; max: number; labels: Record<string, string> }; questions: { num: number; text: string }[]; answers: Record<string, number> };
  };
};

const qaRow: React.CSSProperties = {
  padding: "10px 0",
  borderBottom: "1px solid var(--color-border-light)",
  fontSize: 13,
  color: "var(--color-text-primary)",
  lineHeight: 1.5,
};
const answerPill: React.CSSProperties = {
  display: "inline-block",
  marginLeft: 8,
  padding: "2px 8px",
  borderRadius: 100,
  background: "var(--color-primary)",
  color: "#fff",
  fontSize: 11,
  fontWeight: 600,
};

function AnswersView({ data }: { data: AnswersPayload }) {
  const { tests } = data;
  return (
    <div>
      {/* Big Five */}
      <div style={card}>
        <div style={sectionTitle}>{tests.big_five.title} — Respostas (escala {tests.big_five.scale.min}–{tests.big_five.scale.max})</div>
        {tests.big_five.questions.map(q => (
          <div key={q.num} style={qaRow}>
            <span style={{ color: "var(--color-text-tertiary)", marginRight: 6 }}>{q.num}.</span>
            {q.text}
            <span style={answerPill}>{tests.big_five.answers[String(q.num)] ?? "—"}</span>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>
              {q.factor} · {q.sub_factor}
            </div>
          </div>
        ))}
      </div>

      {/* Stress */}
      <div style={card}>
        <div style={sectionTitle}>{tests.stress.title} — Respostas</div>
        {tests.stress.questions.map(q => {
          const v = tests.stress.answers[String(q.num)];
          return (
            <div key={q.num} style={qaRow}>
              <span style={{ color: "var(--color-text-tertiary)", marginRight: 6 }}>{q.num}.</span>
              {q.text}
              <span style={answerPill}>
                {v ?? "—"}{v != null ? ` · ${tests.stress.scale.labels[String(v)] ?? ""}` : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Depression */}
      <div style={card}>
        <div style={sectionTitle}>{tests.depression.title} — Respostas</div>
        {tests.depression.questions.map(q => {
          const idx = tests.depression.answers[q.key];
          return (
            <div key={q.key} style={qaRow}>
              <span style={{ color: "var(--color-text-tertiary)", marginRight: 6 }}>{q.key.toUpperCase()}.</span>
              {q.text}
              <div style={{ marginTop: 4, paddingLeft: 16 }}>
                {q.options.map((opt, i) => (
                  <div key={i} style={{
                    fontSize: 12,
                    color: i === idx ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                    fontWeight: i === idx ? 600 : 400,
                  }}>
                    {i === idx ? "● " : "○ "}{opt}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivators */}
      <div style={card}>
        <div style={sectionTitle}>{tests.motivators.title} — Respostas (escala {tests.motivators.scale.min}–{tests.motivators.scale.max})</div>
        {Object.entries(tests.motivators.groups).map(([group, qs]) => (
          <div key={group} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", marginTop: 8, marginBottom: 4 }}>{group}</div>
            {qs.map(q => {
              const v = tests.motivators.answers[String(q.num)];
              return (
                <div key={q.num} style={qaRow}>
                  <span style={{ color: "var(--color-text-tertiary)", marginRight: 6 }}>{q.num}.</span>
                  {q.text}
                  <span style={answerPill}>
                    {v ?? "—"}{v != null ? ` · ${tests.motivators.scale.labels[String(v)] ?? ""}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* DISC */}
      <div style={card}>
        <div style={sectionTitle}>{tests.disc.title} — Respostas (7 opções; meio = neutro)</div>
        {Object.entries(tests.disc.dimensions).map(([dim, info]) => {
          const values = tests.disc.answers[dim] ?? [];
          const DISC_VALUES = [0, 1, 2, 2.5, 3, 4, 5];
          return (
            <div key={dim} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", marginTop: 8, marginBottom: 4 }}>
                {dim} — {info.name}
              </div>
              {info.pairs.map(([left, right], i) => {
                const v = values[i];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--color-border-light)" }}>
                    <span style={{ width: 160, fontSize: 12, color: "var(--color-text-secondary)", textAlign: "right", flexShrink: 0 }}>{left}</span>
                    <div style={{ display: "flex", gap: 6, flex: 1, justifyContent: "center" }}>
                      {DISC_VALUES.map(opt => (
                        <div key={opt} style={{
                          width: 22, height: 22, borderRadius: "50%",
                          border: `2px solid ${v === opt ? "var(--color-primary)" : "var(--color-border-light)"}`,
                          background: v === opt ? "var(--color-primary)" : "#fff",
                          fontSize: 9, color: v === opt ? "#fff" : "var(--color-text-tertiary)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {opt === 2.5 ? "▪" : ""}
                        </div>
                      ))}
                    </div>
                    <span style={{ width: 160, fontSize: 12, color: "var(--color-text-secondary)", flexShrink: 0 }}>{right}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* QA */}
      <div style={card}>
        <div style={sectionTitle}>{tests.qa.title} — Respostas (escala {tests.qa.scale.min}–{tests.qa.scale.max})</div>
        {tests.qa.questions.map(q => {
          const v = tests.qa.answers[String(q.num)];
          return (
            <div key={q.num} style={qaRow}>
              <span style={{ color: "var(--color-text-tertiary)", marginRight: 6 }}>{q.num}.</span>
              {q.text}
              <span style={answerPill}>
                {v ?? "—"}{v != null ? ` · ${tests.qa.scale.labels[String(v)] ?? ""}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PsychResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [scores, setScores] = useState<Scores | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<AnswersPayload | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  useEffect(() => {
    api.get(`/applications/${id}/psych-results`)
      .then(({ data }) => {
        setScores(data.scores);
        setCompletedAt(data.completed_at);
      })
      .catch((e) => {
        const detail = e?.response?.data?.detail;
        setError(detail ?? "Erro ao carregar resultados");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, color: "var(--color-text-tertiary)" }}>Carregando...</div>;
  if (error || !scores) {
    return (
      <div style={card}>
        <h2 style={sectionTitle}>Resultados não disponíveis</h2>
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>{error ?? "Sem dados"}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.4px" }}>
            Resultado do Assessment Psicológico
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 4 }}>
            Concluído em {completedAt ? new Date(completedAt).toLocaleString("pt-BR") : "—"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={async () => {
            if (showAnswers) { setShowAnswers(false); return; }
            if (!answers) {
              setLoadingAnswers(true);
              try {
                const { data } = await api.get(`/applications/${id}/psych-answers`);
                setAnswers(data);
              } catch {
                alert("Erro ao carregar respostas");
                setLoadingAnswers(false);
                return;
              }
              setLoadingAnswers(false);
            }
            setShowAnswers(true);
          }}
          style={{
            background: "#fff", color: "var(--color-primary)",
            padding: "9px 16px", borderRadius: 8,
            border: "1px solid var(--color-primary)",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          {loadingAnswers ? "Carregando..." : showAnswers ? "Ocultar respostas" : "Ver respostas"}
        </button>
        <button
          onClick={async () => {
            try {
              const res = await api.get(`/applications/${id}/psych-results.xlsx`, { responseType: "blob" });
              const url = URL.createObjectURL(new Blob([res.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              }));
              const a = document.createElement("a");
              a.href = url;
              const disp = res.headers["content-disposition"] || "";
              const m = disp.match(/filename="?([^"]+)"?/);
              a.download = m ? m[1] : `psych-results-${id}.xlsx`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch {
              alert("Erro ao exportar XLSX");
            }
          }}
          style={{
            background: "var(--color-primary)", color: "#fff",
            padding: "9px 16px", borderRadius: 8, border: "none",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Exportar Excel
        </button>
        </div>
      </div>

      {showAnswers && answers ? <AnswersView data={answers} /> : null}

      {/* Big Five */}
      <div style={card}>
        <div style={sectionTitle}>Big Five — Traços de Personalidade</div>
        {Object.entries(scores.big_five).map(([factor, data]) => (
          <div key={factor} style={{ marginBottom: 14 }}>
            <Bar pct={data.score} label={factor} value={`${Math.round(data.score * 100)}% (${data.raw}/${data.max})`} />
            <div style={{ paddingLeft: 12, marginTop: 4 }}>
              {Object.entries(data.sub_factors).map(([sub, s]) => (
                <Bar key={sub} pct={s.score} label={sub} value={`${s.raw}/${s.max}`} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stress + Depression */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={sectionTitle}>Nível de Stress</div>
          <Bar pct={scores.stress.score / scores.stress.max} label="Pontuação" value={`${scores.stress.score}/${scores.stress.max}`} />
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", marginTop: 6 }}>
            {scores.stress.level}
          </div>
        </div>
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={sectionTitle}>Sintomático de Depressão</div>
          <Bar pct={scores.depression.score / scores.depression.max} label="Pontuação" value={`${scores.depression.score}/${scores.depression.max}`} />
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", marginTop: 6 }}>
            {scores.depression.level}
          </div>
        </div>
      </div>

      {/* Motivators */}
      <div style={card}>
        <div style={sectionTitle}>Motivadores</div>
        {Object.entries(scores.motivators).map(([group, m]) => (
          <Bar key={group} pct={m.pct} label={group} value={`${m.score}/${m.max}`} />
        ))}
      </div>

      {/* DISC */}
      <div style={card}>
        <div style={sectionTitle}>DISC</div>
        {Object.entries(scores.disc).map(([dim, d]) => (
          <div key={dim} style={{ marginBottom: 10 }}>
            <Bar pct={d.pct} label={`${dim} — ${d.name}`} value={`${d.score}/${d.max}`} />
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: -4, marginBottom: 6 }}>{d.level}</div>
          </div>
        ))}
      </div>

      {/* QA */}
      <div style={card}>
        <div style={sectionTitle}>Quociente de Adversidade</div>
        <Bar pct={scores.qa.score / scores.qa.max} label="Pontuação" value={`${scores.qa.score}/${scores.qa.max}`} />
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 6, lineHeight: 1.5 }}>
          {scores.qa.level}
        </div>
      </div>
    </div>
  );
}

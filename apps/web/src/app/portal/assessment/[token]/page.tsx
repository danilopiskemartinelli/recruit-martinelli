"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, ChevronLeft, ChevronRight, AlertCircle, Loader } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ────────────────────────────────────────────────────────────────────

interface BigFiveQ { num: number; text: string; factor: string; sub_factor: string }
interface SimpleQ { num: number; text: string }
interface DepQ { key: string; text: string; options: string[] }
interface MotivatorQ { num: number; text: string }
interface DiscPair { 0: string; 1: string }
interface AssessmentData {
  token: string;
  expires_at: string;
  tests: {
    big_five: { title: string; instruction: string; scale: { labels: Record<string, string> }; questions: BigFiveQ[] };
    stress: { title: string; instruction: string; scale: { labels: Record<string, string> }; questions: SimpleQ[] };
    depression: { title: string; instruction: string; questions: DepQ[] };
    motivators: { title: string; instruction: string; scale: { labels: Record<string, string> }; groups: Record<string, MotivatorQ[]> };
    disc: { title: string; instruction: string; dimensions: Record<string, { name: string; pairs: DiscPair[] }> };
    qa: { title: string; instruction: string; scale: { labels: Record<string, string> }; questions: SimpleQ[] };
  };
}

type Answers = {
  big_five: Record<string, number>;
  stress: Record<string, number>;
  depression: Record<string, number>;
  motivators: Record<string, number>;
  disc: Record<string, (number | null)[]>;
  qa: Record<string, number>;
};

// ── Scale button component ────────────────────────────────────────────────────

function ScaleBtn({ value, selected, onClick, label }: { value: number; selected: boolean; onClick: () => void; label?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <button
        onClick={onClick}
        style={{
          width: 36, height: 36, borderRadius: "50%", border: `2px solid ${selected ? "var(--color-primary)" : "var(--color-border-light)"}`,
          background: selected ? "var(--color-primary)" : "#fff",
          color: selected ? "#fff" : "var(--color-text-secondary)",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "all 0.15s",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {value}
      </button>
      {label && <span style={{ fontSize: 9, color: "var(--color-text-tertiary)", textAlign: "center", maxWidth: 52, lineHeight: 1.2 }}>{label}</span>}
    </div>
  );
}

// ── DISC Pair row ─────────────────────────────────────────────────────────────

const DISC_VALUES = [0, 1, 2, 2.5, 3, 4, 5];

function DiscPairRow({ low, high, value, onChange }: { low: string; high: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-border-light)" }}>
      <span style={{ width: 130, fontSize: 12, color: "var(--color-text-secondary)", textAlign: "right", flexShrink: 0 }}>{low}</span>
      <div style={{ display: "flex", gap: 6, flex: 1, justifyContent: "center" }}>
        {DISC_VALUES.map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              border: `2px solid ${value === v ? "var(--color-primary)" : "var(--color-border-light)"}`,
              background: value === v ? "var(--color-primary)" : "#fff",
              cursor: "pointer", transition: "all 0.15s",
              fontSize: 9, color: value === v ? "#fff" : "var(--color-text-tertiary)",
              flexShrink: 0,
            }}
          >
            {v === 2.5 ? "▪" : ""}
          </button>
        ))}
      </div>
      <span style={{ width: 130, fontSize: 12, color: "var(--color-text-secondary)", flexShrink: 0 }}>{high}</span>
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEP_LABELS = ["Big Five", "Estresse", "Depressão", "Motivadores", "DISC", "QA"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, padding: "0 16px" }}>
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: done ? "#3d7a30" : active ? "var(--color-primary)" : "var(--color-border-light)",
                color: done || active ? "#fff" : "var(--color-text-tertiary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
                border: active ? "2px solid var(--color-primary)" : "2px solid transparent",
                transition: "all 0.2s",
              }}>
                {done ? "✓" : step}
              </div>
              <span style={{ fontSize: 10, color: active ? "var(--color-primary)" : "var(--color-text-tertiary)", fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ width: 32, height: 2, background: done ? "#3d7a30" : "var(--color-border-light)", marginBottom: 16, flexShrink: 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AssessmentPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [step, setStep] = useState(1);
  const [bigFivePage, setBigFivePage] = useState(0);
  const BF_PAGE_SIZE = 28;

  const [answers, setAnswers] = useState<Answers>({
    big_five: {},
    stress: {},
    depression: {},
    motivators: {},
    disc: { D: Array(10).fill(null), I: Array(10).fill(null), S: Array(10).fill(null), C: Array(10).fill(null) },
    qa: {},
  });

  useEffect(() => {
    fetch(`${API}/api/v1/psych-assessments/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.detail || "Erro ao carregar o assessment.");
        }
        return r.json();
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-background)" }}>
      <Loader size={28} className="animate-spin" style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-background)" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 32, background: "#fff", borderRadius: 16, border: "1px solid var(--color-border-light)" }}>
        <AlertCircle size={40} style={{ color: "#c62828", margin: "0 auto 16px", display: "block" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Link inválido</h2>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>{error}</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-background)" }}>
      <div style={{ textAlign: "center", maxWidth: 440, padding: 40, background: "#fff", borderRadius: 16, border: "1px solid var(--color-border-light)", boxShadow: "var(--shadow-card)" }}>
        <CheckCircle size={56} style={{ color: "#3d7a30", margin: "0 auto 20px", display: "block" }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "var(--color-text-primary)" }}>Assessment concluído!</h2>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          Obrigado(a) por responder. Suas respostas foram registradas com sucesso.<br />
          Você pode fechar esta janela.
        </p>
      </div>
    </div>
  );

  if (!data) return null;

  const t = data.tests;
  const bfQuestions = t.big_five.questions;
  const bfTotalPages = Math.ceil(bfQuestions.length / BF_PAGE_SIZE);
  const bfPageQuestions = bfQuestions.slice(bigFivePage * BF_PAGE_SIZE, (bigFivePage + 1) * BF_PAGE_SIZE);

  function setBigFive(num: number, val: number) {
    setAnswers((prev) => ({ ...prev, big_five: { ...prev.big_five, [String(num)]: val } }));
  }
  function setStress(num: number, val: number) {
    setAnswers((prev) => ({ ...prev, stress: { ...prev.stress, [String(num)]: val } }));
  }
  function setDepression(key: string, val: number) {
    setAnswers((prev) => ({ ...prev, depression: { ...prev.depression, [key]: val } }));
  }
  function setMotivator(num: number, val: number) {
    setAnswers((prev) => ({ ...prev, motivators: { ...prev.motivators, [String(num)]: val } }));
  }
  function setDisc(dim: string, idx: number, val: number) {
    setAnswers((prev) => {
      const arr = [...(prev.disc[dim] || Array(10).fill(null))];
      arr[idx] = val;
      return { ...prev, disc: { ...prev.disc, [dim]: arr } };
    });
  }
  function setQA(num: number, val: number) {
    setAnswers((prev) => ({ ...prev, qa: { ...prev.qa, [String(num)]: val } }));
  }

  function canAdvance(): boolean {
    if (step === 1) {
      // check current page questions answered
      return bfPageQuestions.every((q) => answers.big_five[String(q.num)] !== undefined);
    }
    if (step === 2) return t.stress.questions.every((q) => answers.stress[String(q.num)] !== undefined);
    if (step === 3) return t.depression.questions.every((q) => answers.depression[q.key] !== undefined);
    if (step === 4) {
      const allNums = Object.values(t.motivators.groups).flat().map((q) => q.num);
      return allNums.every((n) => answers.motivators[String(n)] !== undefined);
    }
    if (step === 5) {
      return ["D", "I", "S", "C"].every((dim) =>
        (answers.disc[dim] || []).every((v) => v !== null)
      );
    }
    if (step === 6) return t.qa.questions.every((q) => answers.qa[String(q.num)] !== undefined);
    return false;
  }

  function handleNext() {
    if (step === 1) {
      if (bigFivePage < bfTotalPages - 1) {
        setBigFivePage((p) => p + 1);
        return;
      }
    }
    if (step < 6) {
      setStep((s) => s + 1);
      setBigFivePage(0);
    }
  }

  function handlePrev() {
    if (step === 1 && bigFivePage > 0) {
      setBigFivePage((p) => p - 1);
      return;
    }
    if (step > 1) {
      setStep((s) => s - 1);
      if (step - 1 === 1) setBigFivePage(bfTotalPages - 1);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = {
        big_five_answers: answers.big_five,
        stress_answers: answers.stress,
        depression_answers: answers.depression,
        motivators_answers: answers.motivators,
        disc_answers: answers.disc,
        qa_answers: answers.qa,
      };
      const r = await fetch(`${API}/api/v1/psych-assessments/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.detail || "Erro ao enviar as respostas.");
      }
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const isLastStep = step === 6;
  const isLastBigFivePage = step === 1 && bigFivePage === bfTotalPages - 1;
  const nextLabel = isLastStep ? (submitting ? "Enviando..." : "Enviar") : "Próximo";
  const canNext = canAdvance();

  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid var(--color-border-light)",
    boxShadow: "var(--shadow-card)",
    padding: "24px 28px",
    marginBottom: 16,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>
      {/* Header */}
      <header style={{
        background: "#fff", borderBottom: "1px solid var(--color-border-light)",
        padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-primary)", letterSpacing: "-0.3px" }}>
          HR Platform
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400, marginLeft: 8 }}>Assessment Psicológico</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
          Este teste é CONFIDENCIAL
        </div>
      </header>

      {/* Step indicator */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--color-border-light)", padding: "20px 32px" }}>
        <StepIndicator current={step} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 24px 100px" }}>

        {/* ── Step 1: Big Five ───────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <div style={card}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>1) Big Five</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>
                {t.big_five.instruction}
              </p>
              <div style={{ display: "flex", gap: 24, fontSize: 12, color: "var(--color-text-tertiary)", flexWrap: "wrap" }}>
                {Object.entries(t.big_five.scale.labels).map(([v, l]) => (
                  <span key={v}><strong style={{ color: "var(--color-primary)" }}>{v}</strong> = {l}</span>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--color-text-tertiary)" }}>
                Questões {bigFivePage * BF_PAGE_SIZE + 1}–{Math.min((bigFivePage + 1) * BF_PAGE_SIZE, bfQuestions.length)} de {bfQuestions.length}
                {" · "}Página {bigFivePage + 1} de {bfTotalPages}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {bfPageQuestions.map((q) => {
                const selected = answers.big_five[String(q.num)];
                return (
                  <div key={q.num} style={{ ...card, marginBottom: 0 }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-tertiary)", minWidth: 28, flexShrink: 0 }}>{q.num}.</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, color: "var(--color-text-primary)", marginBottom: 12, lineHeight: 1.5 }}>{q.text}</p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {[1, 2, 3, 4, 5, 6, 7].map((v) => (
                            <ScaleBtn
                              key={v}
                              value={v}
                              selected={selected === v}
                              onClick={() => setBigFive(q.num, v)}
                              label={v === 1 ? "Não me\ndescreve" : v === 4 ? "Média" : v === 7 ? "Descreve\nmuito bem" : undefined}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Stress ────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <div style={card}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>2) Nível de Estresse (SS)</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>{t.stress.instruction}</p>
              <div style={{ display: "flex", gap: 24, fontSize: 12, color: "var(--color-text-tertiary)", flexWrap: "wrap" }}>
                {Object.entries(t.stress.scale.labels).map(([v, l]) => (
                  <span key={v}><strong style={{ color: "var(--color-primary)" }}>{v}</strong> = {l}</span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {t.stress.questions.map((q) => {
                const sel = answers.stress[String(q.num)];
                return (
                  <div key={q.num} style={{ ...card, marginBottom: 0 }}>
                    <p style={{ fontSize: 14, marginBottom: 14, lineHeight: 1.5 }}><strong>{q.num}.</strong> {q.text}</p>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {[0, 1, 2, 3, 4].map((v) => (
                        <ScaleBtn key={v} value={v} selected={sel === v} onClick={() => setStress(q.num, v)}
                          label={t.stress.scale.labels[String(v)]} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Depression ───────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <div style={card}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>3) Sintomático de Depressão (SD)</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{t.depression.instruction}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {t.depression.questions.map((q) => {
                const sel = answers.depression[q.key];
                return (
                  <div key={q.key} style={{ ...card, marginBottom: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, lineHeight: 1.5 }}>
                      {q.key.toUpperCase()}) {q.text}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {q.options.map((opt, idx) => (
                        <label key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                          <input
                            type="radio"
                            name={`dep_${q.key}`}
                            checked={sel === idx}
                            onChange={() => setDepression(q.key, idx)}
                            style={{ marginTop: 2, accentColor: "var(--color-primary)", flexShrink: 0 }}
                          />
                          <span style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 4: Motivators ───────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <div style={card}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>4) Motivadores</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>{t.motivators.instruction}</p>
              <div style={{ display: "flex", gap: 24, fontSize: 12, color: "var(--color-text-tertiary)", flexWrap: "wrap" }}>
                {Object.entries(t.motivators.scale.labels).map(([v, l]) => (
                  <span key={v}><strong style={{ color: "var(--color-primary)" }}>{v}</strong> = {l}</span>
                ))}
              </div>
            </div>
            {Object.entries(t.motivators.groups).map(([groupName, questions]) => (
              <div key={groupName}>
                <div style={{ padding: "10px 0 6px", fontSize: 12, fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {groupName}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {questions.map((q) => {
                    const sel = answers.motivators[String(q.num)];
                    return (
                      <div key={q.num} style={{ ...card, marginBottom: 0, padding: "16px 20px" }}>
                        <p style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}><strong>{q.num}.</strong> {q.text}</p>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {[0, 1, 2, 3, 4, 5].map((v) => (
                            <ScaleBtn key={v} value={v} selected={sel === v} onClick={() => setMotivator(q.num, v)}
                              label={t.motivators.scale.labels[String(v)]} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Step 5: DISC ─────────────────────────────────────────────── */}
        {step === 5 && (
          <div>
            <div style={card}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>5) DISC</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{t.disc.instruction}</p>
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--color-text-tertiary)" }}>
                <span>← Extremo baixo</span>
                <div style={{ flex: 1, height: 1, background: "var(--color-border-light)" }} />
                <span>Extremo alto →</span>
              </div>
            </div>
            {Object.entries(t.disc.dimensions).map(([dim, dimData]) => (
              <div key={dim} style={{ marginBottom: 20 }}>
                <div style={{ padding: "8px 0 4px", fontSize: 13, fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {dimData.name}
                </div>
                <div style={{ ...card, padding: "8px 20px", marginBottom: 0 }}>
                  {dimData.pairs.map((pair, idx) => (
                    <DiscPairRow
                      key={idx}
                      low={pair[0]}
                      high={pair[1]}
                      value={answers.disc[dim]?.[idx] ?? null}
                      onChange={(v) => setDisc(dim, idx, v)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Step 6: QA ───────────────────────────────────────────────── */}
        {step === 6 && (
          <div>
            <div style={card}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>6) Quociente de Adversidade (QA)</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>{t.qa.instruction}</p>
              <div style={{ display: "flex", gap: 24, fontSize: 12, color: "var(--color-text-tertiary)", flexWrap: "wrap" }}>
                {Object.entries(t.qa.scale.labels).map(([v, l]) => (
                  <span key={v}><strong style={{ color: "var(--color-primary)" }}>{v}</strong> = {l}</span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {t.qa.questions.map((q) => {
                const sel = answers.qa[String(q.num)];
                return (
                  <div key={q.num} style={{ ...card, marginBottom: 0 }}>
                    <p style={{ fontSize: 14, marginBottom: 14, lineHeight: 1.5 }}><strong>{q.num}.</strong> {q.text}</p>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {[1, 2, 3, 4, 5].map((v) => (
                        <ScaleBtn key={v} value={v} selected={sel === v} onClick={() => setQA(q.num, v)}
                          label={t.qa.scale.labels[String(v)]} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: "1px solid var(--color-border-light)",
        padding: "14px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 10,
      }}>
        <button
          onClick={handlePrev}
          disabled={step === 1 && bigFivePage === 0}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 8,
            border: "1px solid var(--color-border-light)",
            background: "#fff", color: "var(--color-text-secondary)",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            opacity: step === 1 && bigFivePage === 0 ? 0.4 : 1,
            transition: "all 0.15s",
          }}
        >
          <ChevronLeft size={15} /> Anterior
        </button>

        <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
          Etapa {step} de 6
          {step === 1 && ` · Página ${bigFivePage + 1}/${bfTotalPages}`}
        </div>

        <button
          onClick={isLastStep ? handleSubmit : handleNext}
          disabled={!canNext || submitting}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 24px", borderRadius: 8, border: "none",
            background: canNext && !submitting ? "var(--color-primary)" : "var(--color-border-light)",
            color: canNext && !submitting ? "#fff" : "var(--color-text-tertiary)",
            fontSize: 13, fontWeight: 600,
            cursor: canNext && !submitting ? "pointer" : "default",
            transition: "all 0.15s",
          }}
        >
          {nextLabel} {!isLastStep && <ChevronRight size={15} />}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Múltipla escolha" },
  { value: "true_false",      label: "Verdadeiro/Falso" },
  { value: "open_text",       label: "Texto livre" },
  { value: "code",            label: "Código" },
  { value: "rating_scale",    label: "Escala de avaliação" },
];

const ASSESSMENT_TYPES = [
  { value: "quiz",        label: "Quiz" },
  { value: "technical",   label: "Técnica" },
  { value: "coding",      label: "Código" },
  { value: "personality", label: "Perfil comportamental" },
  { value: "mixed",       label: "Mista" },
];

interface Question {
  id: string;
  type: string;
  content: string;
  points: number;
  options: string[];
  correct_answer: string;
}

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid var(--color-border-light)",
  boxShadow: "var(--shadow-card)",
  padding: "24px",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  fontSize: 13,
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  marginBottom: 6,
};

export default function NewAssessmentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("technical");
  const [timeLimit, setTimeLimit] = useState("");
  const [passingScore, setPassingScore] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "q1", type: "multiple_choice", content: "", points: 1, options: ["", "", "", ""], correct_answer: "" },
  ]);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { id: `q${Date.now()}`, type: "multiple_choice", content: "", points: 1, options: ["", "", "", ""], correct_answer: "" },
    ]);
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function updateQuestion(id: string, field: keyof Question, value: unknown) {
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, [field]: value } : q));
  }

  function updateOption(qid: string, idx: number, value: string) {
    setQuestions((prev) => prev.map((q) => {
      if (q.id !== qid) return q;
      const opts = [...q.options];
      opts[idx] = value;
      return { ...q, options: opts };
    }));
  }

  async function handleSave(status: "draft" | "active") {
    if (!title.trim()) { toast.error("Informe o título da avaliação"); return; }
    if (questions.length === 0) { toast.error("Adicione pelo menos uma questão"); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success(status === "active" ? "Avaliação publicada!" : "Rascunho salvo!");
    router.push("/assessments");
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", padding: 4, display: "flex" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.4px" }}>
            Nova avaliação
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 2 }}>
            Configure e adicione questões
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Config card */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 20 }}>
            Configurações gerais
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={label}>Título *</label>
              <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Lógica de Programação — Backend" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={label}>Descrição</label>
              <textarea
                style={{ ...input, minHeight: 72, resize: "vertical" }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instruções visíveis ao candidato antes de iniciar..."
              />
            </div>
            <div>
              <label style={label}>Tipo</label>
              <select style={{ ...input }} value={type} onChange={(e) => setType(e.target.value)}>
                {ASSESSMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Tempo limite (minutos)</label>
              <input style={input} type="number" min={5} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="Ex: 60 — deixe vazio para sem limite" />
            </div>
            <div>
              <label style={label}>Nota mínima (%)</label>
              <input style={input} type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(e.target.value)} placeholder="Ex: 70" />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
              Questões ({questions.length})
            </div>
            <button
              onClick={addQuestion}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 7,
                border: "1px dashed var(--color-primary)",
                background: "var(--color-primary-lightest)",
                color: "var(--color-primary)",
                fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >
              <Plus size={13} /> Adicionar questão
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {questions.map((q, idx) => (
              <div key={q.id} style={{ border: "1px solid var(--color-border-light)", borderRadius: 10, padding: 16 }}>
                {/* Question header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "var(--color-primary)", color: "#fff",
                    fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{idx + 1}</span>
                  <select
                    style={{ ...input, width: "auto", flex: 1 }}
                    value={q.type}
                    onChange={(e) => updateQuestion(q.id, "type", e.target.value)}
                  >
                    {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input
                    style={{ ...input, width: 70 }}
                    type="number" min={0.5} step={0.5}
                    value={q.points}
                    onChange={(e) => updateQuestion(q.id, "points", parseFloat(e.target.value))}
                    title="Pontos"
                  />
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>pts</span>
                  <button
                    onClick={() => removeQuestion(q.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", padding: 4 }}
                    title="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Content */}
                <textarea
                  style={{ ...input, minHeight: 60, resize: "vertical", marginBottom: 10 }}
                  value={q.content}
                  onChange={(e) => updateQuestion(q.id, "content", e.target.value)}
                  placeholder="Enunciado da questão..."
                />

                {/* Options for multiple choice */}
                {q.type === "multiple_choice" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: 2 }}>
                      Alternativas (marque a correta)
                    </div>
                    {q.options.map((opt, oi) => (
                      <div key={oi} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correct_answer === String(oi)}
                          onChange={() => updateQuestion(q.id, "correct_answer", String(oi))}
                          style={{ flexShrink: 0 }}
                        />
                        <input
                          style={{ ...input, flex: 1 }}
                          value={opt}
                          onChange={(e) => updateOption(q.id, oi, e.target.value)}
                          placeholder={`Alternativa ${String.fromCharCode(65 + oi)}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* True/False */}
                {q.type === "true_false" && (
                  <div style={{ display: "flex", gap: 16 }}>
                    {["true", "false"].map((v) => (
                      <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                        <input type="radio" name={`tf-${q.id}`} checked={q.correct_answer === v} onChange={() => updateQuestion(q.id, "correct_answer", v)} />
                        {v === "true" ? "Verdadeiro" : "Falso"}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => router.back()}
            style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid var(--color-border-light)", background: "#fff", color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid var(--color-primary)", background: "var(--color-primary-light)", color: "var(--color-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >
            Salvar rascunho
          </button>
          <button
            onClick={() => handleSave("active")}
            disabled={saving}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "var(--color-primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Salvando..." : "Publicar avaliação"}
          </button>
        </div>

      </div>
    </div>
  );
}

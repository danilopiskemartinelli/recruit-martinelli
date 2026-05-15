"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from "recharts";
import { TrendingUp, Users, Clock, CheckCircle, Calendar } from "lucide-react";

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid var(--color-border-light)",
  boxShadow: "var(--shadow-card)",
  padding: "20px 22px",
};

const MONTHLY_DATA = [
  { month: "Dez/25", candidaturas: 28, entrevistas: 12, contratados: 3 },
  { month: "Jan/26", candidaturas: 35, entrevistas: 16, contratados: 4 },
  { month: "Fev/26", candidaturas: 42, entrevistas: 19, contratados: 5 },
  { month: "Mar/26", candidaturas: 38, entrevistas: 15, contratados: 4 },
  { month: "Abr/26", candidaturas: 55, entrevistas: 24, contratados: 7 },
  { month: "Mai/26", candidaturas: 48, entrevistas: 21, contratados: 6 },
];

const PIPELINE_DATA = [
  { name: "Candidaturas",  value: 246, fill: "#6b7280" },
  { name: "Triagem",       value: 148, fill: "#1c62cb" },
  { name: "Avaliação",     value: 89,  fill: "#7c3aed" },
  { name: "Entrevista",    value: 52,  fill: "#e6960a" },
  { name: "Proposta",      value: 19,  fill: "#ea580c" },
  { name: "Contratados",   value: 29,  fill: "#3d7a30" },
];

const SOURCE_DATA = [
  { source: "LinkedIn",       count: 94, color: "#0a66c2" },
  { source: "Site da empresa", count: 62, color: "#1c62cb" },
  { source: "Indicação",       count: 45, color: "#7c3aed" },
  { source: "Indeed",          count: 31, color: "#003a9b" },
  { source: "Outros",          count: 14, color: "#9ca3af" },
];

const TOP_JOBS = [
  { title: "Engenheiro Backend Sênior", applications: 47, hired: 2, avg_days: 28 },
  { title: "Product Designer",          applications: 38, hired: 1, avg_days: 22 },
  { title: "Analista de Dados",          applications: 35, hired: 3, avg_days: 19 },
  { title: "Desenvolvedor Frontend",    applications: 52, hired: 2, avg_days: 31 },
  { title: "Gerente de Projetos",       applications: 29, hired: 1, avg_days: 25 },
];

const PERIODS = ["Últimos 30 dias", "Últimos 90 dias", "Este ano", "Tudo"];

export default function ReportsPage() {
  const [period, setPeriod] = useState("Últimos 90 dias");
  const sourceTotal = SOURCE_DATA.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.4px" }}>
            Relatórios
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 4 }}>
            Métricas e análises do processo seletivo
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {PERIODS.map((p) => {
            const active = period === p;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
                  border: active ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border-light)",
                  background: active ? "var(--color-primary-light)" : "#fff",
                  color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Candidaturas",      value: 246, delta: "+18%", color: "#1c62cb", bg: "#e8eff9", icon: Users },
          { label: "Entrevistas",       value: 107, delta: "+12%", color: "#7c3aed", bg: "#f3eff9", icon: Calendar },
          { label: "Contratados",       value: 29,  delta: "+22%", color: "#3d7a30", bg: "#eef5ec", icon: CheckCircle },
          { label: "Tempo médio (dias)",value: 24,  delta: "-3 dias", color: "#e6960a", bg: "#fdf5e6", icon: Clock },
        ].map(({ label, value, delta, color, bg, icon: Icon }) => (
          <div key={label} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  {label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: "-0.5px", lineHeight: 1 }}>
                  {value}
                </div>
                <div style={{ fontSize: 11, color: "#3d7a30", marginTop: 6, fontWeight: 500 }}>
                  <TrendingUp size={10} style={{ display: "inline", marginRight: 3 }} />
                  {delta} vs. período anterior
                </div>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={17} style={{ color }} strokeWidth={2} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Monthly bar chart */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 20 }}>
            Evolução mensal
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY_DATA} barSize={10} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8eaed" }} />
              <Bar dataKey="candidaturas" fill="#c5d3e8" radius={[4, 4, 0, 0]} name="Candidaturas" />
              <Bar dataKey="entrevistas"  fill="#1c62cb" radius={[4, 4, 0, 0]} name="Entrevistas" />
              <Bar dataKey="contratados"  fill="#3d7a30" radius={[4, 4, 0, 0]} name="Contratados" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            {[
              { label: "Candidaturas", color: "#c5d3e8" },
              { label: "Entrevistas",  color: "#1c62cb" },
              { label: "Contratados",  color: "#3d7a30" },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-text-tertiary)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline funnel */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 20 }}>
            Funil de conversão
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PIPELINE_DATA.map((stage, idx) => {
              const pct = Math.round((stage.value / PIPELINE_DATA[0].value) * 100);
              return (
                <div key={stage.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{stage.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {stage.value} <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", fontWeight: 400 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: "var(--color-border-light)", borderRadius: 100 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: stage.fill, borderRadius: 100, transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Source of candidates */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 20 }}>
            Origem dos candidatos
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SOURCE_DATA.map((s) => {
              const pct = Math.round((s.count / sourceTotal) * 100);
              return (
                <div key={s.source}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{s.source}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>{s.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 5, background: "var(--color-border-light)", borderRadius: 100 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: s.color, borderRadius: 100 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top jobs */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 20 }}>
            Vagas com mais candidaturas
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {TOP_JOBS.map((job, idx) => (
              <div key={job.title} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: idx < TOP_JOBS.length - 1 ? "1px solid var(--color-border-light)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "var(--color-primary-light)", color: "var(--color-primary)",
                    fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{idx + 1}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {job.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 1 }}>
                      {job.hired} contratado{job.hired !== 1 ? "s" : ""} · {job.avg_days} dias em média
                    </div>
                  </div>
                </div>
                <span style={{
                  padding: "2px 8px", borderRadius: 100,
                  background: "var(--color-primary-light)", color: "var(--color-primary)",
                  fontSize: 11, fontWeight: 600,
                }}>{job.applications}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

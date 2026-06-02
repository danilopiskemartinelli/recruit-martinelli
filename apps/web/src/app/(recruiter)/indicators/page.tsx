"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Clock, UserCheck, Target, Globe, Star, Users,
  TrendingUp, AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api-client";

// ─── Styles ──────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid var(--color-border-light)",
  boxShadow: "var(--shadow-card)",
  padding: "22px 24px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--color-text-primary)",
  marginBottom: 4,
};

const sectionSub: React.CSSProperties = {
  fontSize: 11,
  color: "var(--color-text-tertiary)",
  marginBottom: 20,
};

const pill = (bg: string, text: string): React.CSSProperties => ({
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 100,
  background: bg,
  color: text,
  fontSize: 11,
  fontWeight: 600,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLORS = ["#1c62cb", "#3d7a30", "#e6960a", "#7c3aed", "#ea580c", "#0ea5e9", "#6b7280"];

const NPS_COLORS: Record<string, string> = {
  otimo:   "#3d7a30",
  bom:     "#1c62cb",
  regular: "#e6960a",
  ruim:    "#ef4444",
};
const NPS_LABELS: Record<string, string> = {
  otimo:   "Ótimo",
  bom:     "Bom",
  regular: "Regular",
  ruim:    "Ruim",
};

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-text-disabled)" }}>
      <AlertCircle size={28} style={{ margin: "0 auto 10px", display: "block", opacity: 0.35 }} />
      <p style={{ fontSize: 12 }}>{label}</p>
    </div>
  );
}

function KpiHeader({ icon: Icon, color, lightBg, title, subtitle }: {
  icon: React.ElementType; color: string; lightBg: string; title: string; subtitle: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: lightBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} style={{ color }} strokeWidth={2.2} />
      </div>
      <div>
        <div style={sectionTitle}>{title}</div>
        <div style={sectionSub}>{subtitle}</div>
      </div>
    </div>
  );
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function SlaCard({ data }: { data: any }) {
  const closed: any[] = data?.closed ?? [];
  const open: any[] = data?.open ?? [];
  const all = [
    ...closed.map((r: any) => ({ label: r.label, closed_days: r.avg_days, open_days: 0 })),
  ];
  // merge open into all
  open.forEach((o: any) => {
    const existing = all.find((a) => a.label === o.label);
    if (existing) existing.open_days = o.avg_days_open;
    else all.push({ label: o.label, closed_days: 0, open_days: o.avg_days_open });
  });

  const hasData = all.length > 0;

  return (
    <div style={card}>
      <KpiHeader
        icon={Clock} color="#1c62cb" lightBg="#e8eff9"
        title="SLA — Tempo de Preenchimento da Vaga"
        subtitle="Agilidade do processo seletivo por nível de senioridade"
      />
      {!hasData ? (
        <EmptyState label="Nenhuma vaga fechada com dados de SLA ainda." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={all} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis unit="d" tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: any, name: string) => [`${v} dias`, name === "closed_days" ? "Vagas fechadas" : "Vagas abertas"]}
            />
            <Bar dataKey="closed_days" name="Fechadas" fill="#1c62cb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="open_days" name="Em aberto" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function OfferCard({ data }: { data: any }) {
  const avgDays: number | null = data?.avg_days ?? null;
  const count: number = data?.count ?? 0;
  const dropouts: number = data?.dropout_count ?? 0;

  return (
    <div style={card}>
      <KpiHeader
        icon={UserCheck} color="#3d7a30" lightBg="#eef5ec"
        title="Aprovação → Aceite da Proposta"
        subtitle="Tempo entre aprovação do gestor e aceite do candidato"
      />
      {count === 0 ? (
        <EmptyState label="Nenhuma proposta aceita registrada ainda." />
      ) : (
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 42, fontWeight: 700, color: "#3d7a30", letterSpacing: "-2px", lineHeight: 1 }}>
              {avgDays ?? "—"}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 6 }}>
              dias em média
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
            <div style={{ background: "var(--color-background)", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Aceites registrados</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 2 }}>{count}</div>
            </div>
            <div style={{ background: "#fef2f2", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: "#ef4444" }}>Desistências de candidatos</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444", marginTop: 2 }}>{dropouts}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssertCard({ data }: { data: any }) {
  const rate: number | null = data?.rate ?? null;
  const total: number = data?.total_hired ?? 0;
  const passed: number = data?.hired_180_days ?? 0;

  const pct = rate ?? (total > 0 ? Math.round((passed / total) * 100) : null);

  return (
    <div style={card}>
      <KpiHeader
        icon={Target} color="#7c3aed" lightBg="#f3eff9"
        title="Taxa de Assertividade"
        subtitle="Contratados que permaneceram após 6 meses (180 dias)"
      />
      {total === 0 ? (
        <EmptyState label="Nenhum contratado com 180 dias ainda." />
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* Gauge */}
          <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: 110, height: 110, transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-border-light)" strokeWidth="3.5" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#7c3aed" strokeWidth="3.5"
                strokeDasharray={`${pct ?? 0} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#7c3aed", letterSpacing: "-1px" }}>
                {pct != null ? `${pct}%` : "—"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Total contratados</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>{total}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Passaram 6 meses</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#7c3aed" }}>{passed}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SourceCard({ data }: { data: any[] }) {
  const hasData = data && data.length > 0;

  return (
    <div style={card}>
      <KpiHeader
        icon={Globe} color="#ea580c" lightBg="#fff3ee"
        title="Origem das Contratações"
        subtitle="De onde vêm os candidatos que chegaram a contratação"
      />
      {!hasData ? (
        <EmptyState label="Nenhuma contratação registrada ainda." />
      ) : (
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={72}
                paddingAngle={2}
              >
                {data.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v} candidatos`]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
            {data.map((s: any, i: number) => (
              <div key={s.source} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)", flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>{s.count}</span>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", width: 36, textAlign: "right" }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NpsCard({ data }: { data: any }) {
  const total: number = data?.total_responses ?? 0;
  const dims: Record<string, any> = data?.dimensions ?? {};
  const ratings = ["otimo", "bom", "regular", "ruim"];

  return (
    <div style={card}>
      <KpiHeader
        icon={Star} color="#e6960a" lightBg="#fdf5e6"
        title="NPS dos Gestores"
        subtitle="Satisfação dos gestores com o processo seletivo"
      />
      {total === 0 ? (
        <EmptyState label="Nenhuma avaliação de gestor registrada ainda." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Object.entries(dims).map(([key, dim]: [string, any]) => {
            const breakdown: Record<string, number> = dim.breakdown ?? {};
            const dimTotal = Object.values(breakdown).reduce((s: number, v: any) => s + v, 0);
            return (
              <div key={key}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                  {dim.label}
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  {ratings.map((r) => {
                    const v = breakdown[r] ?? 0;
                    const pct = dimTotal > 0 ? Math.round((v / dimTotal) * 100) : 0;
                    return (
                      <div key={r} style={{ flex: pct || 1, minWidth: 6, height: 10, background: NPS_COLORS[r], borderRadius: 100, transition: "flex 0.3s" }} title={`${NPS_LABELS[r]}: ${v}`} />
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {ratings.map((r) => (
                    <span key={r} style={{ ...pill(NPS_COLORS[r] + "22", NPS_COLORS[r]), fontSize: 10 }}>
                      {NPS_LABELS[r]}: {breakdown[r] ?? 0}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>
            {total} avaliação{total !== 1 ? "ões" : ""} no total
          </p>
        </div>
      )}
    </div>
  );
}

function QuotaCard({ data }: { data: any }) {
  const total: number = data?.total_candidates ?? 0;
  const pcd = data?.pcd ?? { count: 0, pct: 0 };
  const apprentice = data?.young_apprentice ?? { count: 0, pct: 0 };

  // Indicative targets (legal minimums, configurable in future)
  const PCD_TARGET = 5;       // 5% lei de cotas
  const APPRENTICE_TARGET = 5; // ~5%

  function QuotaBar({ label, count, pct, target, color }: {
    label: string; count: number; pct: number; target: number; color: string;
  }) {
    const atTarget = pct >= target;
    return (
      <div style={{ background: "var(--color-background)", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</span>
          <span style={{ ...pill(atTarget ? "#eef5ec" : "#fef2f2", atTarget ? "#3d7a30" : "#ef4444") }}>
            {atTarget ? "✓ Meta atingida" : `Meta: ${target}%`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color, letterSpacing: "-2px", lineHeight: 1 }}>{pct}%</span>
          <span style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>{count} de {total}</span>
        </div>
        <div style={{ height: 8, background: "var(--color-border-light)", borderRadius: 100, position: "relative" }}>
          <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 100, transition: "width 0.4s ease" }} />
          {/* target marker */}
          <div style={{
            position: "absolute",
            top: -3, bottom: -3,
            left: `${Math.min(target, 100)}%`,
            width: 2,
            background: "#6b7280",
            borderRadius: 2,
            transform: "translateX(-50%)",
          }} title={`Meta: ${target}%`} />
        </div>
        <div style={{ fontSize: 10, color: "var(--color-text-disabled)", marginTop: 4 }}>
          Linha tracejada = meta de {target}%
        </div>
      </div>
    );
  }

  return (
    <div style={card}>
      <KpiHeader
        icon={Users} color="#0ea5e9" lightBg="#e0f2fe"
        title="Cota — PCD &amp; Jovem Aprendiz"
        subtitle="Percentual atual em relação à base total de candidatos"
      />
      {total === 0 ? (
        <EmptyState label="Nenhum candidato cadastrado ainda." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <QuotaBar label="Pessoa com Deficiência (PCD)" count={pcd.count} pct={pcd.pct} target={PCD_TARGET} color="#0ea5e9" />
          <QuotaBar label="Jovem Aprendiz" count={apprentice.count} pct={apprentice.pct} target={APPRENTICE_TARGET} color="#7c3aed" />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IndicatorsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["kpi"],
    queryFn: async () => {
      const { data } = await api.get("/kpi");
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <TrendingUp size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.5} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.4px" }}>
            Painel de Indicadores Estratégicos
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginLeft: 28 }}>
          Atração de Talentos — métricas de eficiência, qualidade e diversidade
        </p>
      </div>

      {isError && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 18px", marginBottom: 20, color: "#ef4444", fontSize: 13 }}>
          Erro ao carregar indicadores. Tente recarregar a página.
        </div>
      )}

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ ...card, height: 260, background: "var(--color-background)", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Row 1: SLA + Oferta */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <SlaCard data={data?.sla} />
            <OfferCard data={data?.offer_acceptance} />
          </div>

          {/* Row 2: Assertividade + Origem */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <AssertCard data={data?.assertiveness} />
            <SourceCard data={data?.source ?? []} />
          </div>

          {/* Row 3: NPS + Cota */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <NpsCard data={data?.nps} />
            <QuotaCard data={data?.quota} />
          </div>
        </div>
      )}
    </div>
  );
}

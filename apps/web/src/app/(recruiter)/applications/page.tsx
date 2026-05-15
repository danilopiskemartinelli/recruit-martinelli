"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, ChevronDown } from "lucide-react";
import { api } from "@/lib/api-client";

const STAGES = [
  { value: "submitted",  label: "Recebida",   bg: "#f1f1f1",  text: "#52575f", dot: "#9ca3af" },
  { value: "screening",  label: "Triagem",    bg: "#e8eff9",  text: "#1c62cb", dot: "#1c62cb" },
  { value: "assessment", label: "Avaliação",  bg: "#f3eff9",  text: "#7c3aed", dot: "#7c3aed" },
  { value: "interview",  label: "Entrevista", bg: "#fdf5e6",  text: "#e6960a", dot: "#e6960a" },
  { value: "offer",      label: "Proposta",   bg: "#fff2ed",  text: "#ea580c", dot: "#ea580c" },
  { value: "hired",      label: "Contratado", bg: "#eef5ec",  text: "#3d7a30", dot: "#3d7a30" },
  { value: "rejected",   label: "Reprovado",  bg: "#fceaea",  text: "#c62828", dot: "#c62828" },
  { value: "withdrawn",  label: "Desistiu",   bg: "#f1f1f1",  text: "#9ca3af", dot: "#c5c9d0" },
];

const stageMap = Object.fromEntries(STAGES.map((s) => [s.value, s]));

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 22px",
  fontSize: 11, fontWeight: 600,
  color: "var(--color-text-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  background: "var(--color-background)",
  borderBottom: "1px solid var(--color-border-light)",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "13px 22px",
  fontSize: 13,
  color: "var(--color-text-secondary)",
  borderBottom: "1px solid var(--color-border-light)",
  verticalAlign: "middle",
};

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["applications", filter, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
      if (filter !== "all") params.appl_status = filter;
      const { data } = await api.get("/applications", { params });
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/applications/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const applications = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.4px" }}>Candidaturas</h1>
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 4 }}>
          {total} candidatura{total !== 1 ? "s" : ""} no total
        </p>
      </div>

      {/* Stage filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {[{ value: "all", label: "Todas", bg: "#f1f1f1", text: "#52575f", dot: "#9ca3af" }, ...STAGES].map((s) => {
          const active = filter === s.value;
          return (
            <button
              key={s.value}
              onClick={() => { setFilter(s.value); setPage(1); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 12px", borderRadius: 100, cursor: "pointer",
                fontSize: 11, fontWeight: 600,
                background: active ? s.bg : "#fff",
                color: active ? s.text : "var(--color-text-secondary)",
                border: active ? `1.5px solid ${s.dot}40` : "1px solid var(--color-border-light)",
                transition: "all 0.15s",
              }}
            >
              {s.value !== "all" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? s.dot : "var(--color-text-disabled)", flexShrink: 0 }} />}
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 52, background: "var(--color-border-light)", borderRadius: 8 }} />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--color-text-disabled)" }}>
          <FileText size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
          <p style={{ fontSize: 13, fontWeight: 500 }}>Nenhuma candidatura encontrada</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--color-border-light)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Candidato</th>
                <th style={th}>Vaga</th>
                <th style={th}>Status</th>
                <th style={th}>Recebida em</th>
                <th style={th}>Mover para</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app: any, idx: number) => {
                const stage = stageMap[app.status];
                const isLast = idx === applications.length - 1;
                return (
                  <tr
                    key={app.id}
                    style={{ background: "#fff" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-background)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                  >
                    <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                      <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {app.candidate?.full_name ?? app.candidate_name ?? app.candidate_id}
                      </div>
                      {app.source && <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>via {app.source}</div>}
                    </td>
                    <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                      <span style={{ display: "block", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {app.job?.title ?? app.job_title ?? app.job_id}
                      </span>
                    </td>
                    <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                      {stage && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          background: stage.bg, color: stage.text,
                          padding: "3px 10px", borderRadius: 100,
                          fontSize: 11, fontWeight: 600,
                          border: `1px solid ${stage.dot}30`,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: stage.dot, flexShrink: 0 }} />
                          {stage.label}
                        </span>
                      )}
                    </td>
                    <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                      {new Date(app.applied_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ ...td, borderBottom: isLast ? "none" : td.borderBottom }}>
                      <div style={{ position: "relative", display: "inline-block" }} className="stage-dropdown">
                        <button
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "5px 10px", borderRadius: 6,
                            border: "1px solid var(--color-border-light)",
                            background: "#fff", color: "var(--color-text-secondary)",
                            fontSize: 11, fontWeight: 500, cursor: "pointer",
                          }}
                        >
                          Mover <ChevronDown size={11} />
                        </button>
                        <div className="stage-menu" style={{
                          position: "absolute", zIndex: 10, left: 0, top: "100%", marginTop: 4,
                          background: "#fff", border: "1px solid var(--color-border-light)",
                          borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          padding: "6px", minWidth: 160, display: "none",
                        }}>
                          {STAGES.filter((s) => s.value !== app.status).map((s) => (
                            <button
                              key={s.value}
                              onClick={() => updateMutation.mutate({ id: app.id, status: s.value })}
                              style={{
                                display: "flex", alignItems: "center", gap: 8,
                                width: "100%", textAlign: "left",
                                padding: "7px 10px", borderRadius: 6,
                                border: "none", background: "none",
                                fontSize: 12, color: "var(--color-text-secondary)",
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-background)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                            >
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24 }}>
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
            style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border-light)", background: "#fff", color: "var(--color-text-secondary)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
            Anterior
          </button>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
          </span>
          <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}
            style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border-light)", background: "#fff", color: "var(--color-text-secondary)", cursor: page * PAGE_SIZE >= total ? "not-allowed" : "pointer", opacity: page * PAGE_SIZE >= total ? 0.4 : 1 }}>
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

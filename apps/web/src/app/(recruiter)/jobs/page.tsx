"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Briefcase, MapPin, Clock } from "lucide-react";
import { api } from "@/lib/api-client";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  draft:     { label: "Rascunho",  bg: "#f1f1f1",  text: "#52575f", dot: "#9ca3af" },
  published: { label: "Publicada", bg: "#eef5ec",  text: "#3d7a30", dot: "#3d7a30" },
  paused:    { label: "Pausada",   bg: "#fdf5e6",  text: "#e6960a", dot: "#e6960a" },
  closed:    { label: "Encerrada", bg: "#fceaea",  text: "#c62828", dot: "#c62828" },
};

const FILTERS = [
  { value: "all",       label: "Todas" },
  { value: "published", label: "Publicadas" },
  { value: "draft",     label: "Rascunhos" },
  { value: "paused",    label: "Pausadas" },
  { value: "closed",    label: "Encerradas" },
];

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time:  "Tempo integral",
  part_time:  "Meio período",
  contract:   "Contrato",
  internship: "Estágio",
};

export default function JobsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", filter, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
      if (filter !== "all") params.status = filter;
      const { data } = await api.get("/jobs", { params });
      return data;
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/jobs/${id}`, { status: "published" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jobs"] }); toast.success("Vaga publicada!"); },
  });

  const jobs = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.4px" }}>Vagas</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 4 }}>
            {total} vaga{total !== 1 ? "s" : ""} no total
          </p>
        </div>
        <button
          onClick={() => router.push("/jobs/new")}
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
          Nova vaga
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
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

      {/* Content */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 160, background: "var(--color-border-light)", borderRadius: 12 }} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--color-text-disabled)" }}>
          <Briefcase size={36} style={{ margin: "0 auto 12px", opacity: 0.4, display: "block" }} />
          <p style={{ fontSize: 13, fontWeight: 500 }}>Nenhuma vaga encontrada</p>
          <button
            onClick={() => router.push("/jobs/new")}
            style={{ marginTop: 12, fontSize: 13, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer" }}
          >
            Criar primeira vaga →
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {jobs.map((job: any) => {
            const sc = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.draft;
            return (
              <div
                key={job.id}
                onClick={() => router.push(`/jobs/${job.id}`)}
                style={{
                  background: "#fff", borderRadius: 12,
                  border: "1px solid var(--color-border-light)",
                  boxShadow: "var(--shadow-card)",
                  padding: "20px 22px",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
                  (e.currentTarget as HTMLElement).style.borderColor = "#c5d3e8";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-light)";
                }}
              >
                {/* Status badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: sc.bg, color: sc.text,
                    padding: "3px 10px", borderRadius: 100,
                    fontSize: 11, fontWeight: 600,
                    border: `1px solid ${sc.dot}30`,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
                    {sc.label}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: 14, fontWeight: 600,
                  color: "var(--color-text-primary)",
                  marginBottom: 10, lineHeight: 1.4,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {job.title}
                </h3>

                {/* Meta */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {job.location && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-tertiary)" }}>
                      <MapPin size={12} />
                      {job.location}
                    </div>
                  )}
                  {job.job_type && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-tertiary)" }}>
                      <Clock size={12} />
                      {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--color-border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                    {new Date(job.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  {job.status === "draft" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); publishMutation.mutate(job.id); }}
                      style={{
                        fontSize: 11, fontWeight: 600,
                        color: "var(--color-primary)", background: "var(--color-primary-light)",
                        border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                      }}
                    >
                      Publicar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 28 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border-light)", background: "#fff", color: "var(--color-text-secondary)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}
          >
            Anterior
          </button>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Página {page}</span>
          <button
            disabled={page * PAGE_SIZE >= total}
            onClick={() => setPage((p) => p + 1)}
            style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border-light)", background: "#fff", color: "var(--color-text-secondary)", cursor: page * PAGE_SIZE >= total ? "not-allowed" : "pointer", opacity: page * PAGE_SIZE >= total ? 0.4 : 1 }}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

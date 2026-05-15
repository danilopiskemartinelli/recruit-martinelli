"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, MapPin, Briefcase, ExternalLink } from "lucide-react";
import { api } from "@/lib/api-client";

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 22px",
  fontSize: 11,
  fontWeight: 600,
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

export default function CandidatesPage() {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["candidates", page],
    queryFn: async () => {
      const { data } = await api.get("/candidates", { params: { page, page_size: PAGE_SIZE } });
      return data;
    },
  });

  const candidates = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.4px" }}>Candidatos</h1>
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 4 }}>
          {total} candidato{total !== 1 ? "s" : ""} no sistema
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: 52, background: "var(--color-border-light)", borderRadius: 8 }} />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--color-text-disabled)" }}>
          <Users size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
          <p style={{ fontSize: 13, fontWeight: 500 }}>Nenhum candidato ainda</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>Os candidatos aparecerão aqui conforme se candidatarem.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--color-border-light)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Candidato</th>
                <th style={th}>Email</th>
                <th style={{ ...th }}>Localização</th>
                <th style={{ ...th }}>Experiência</th>
                <th style={{ ...th }}>Skills</th>
                <th style={{ ...th }}>Links</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c: any, idx: number) => (
                <tr
                  key={c.id}
                  style={{ background: "#fff" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-background)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <td style={{ ...td, borderBottom: idx === candidates.length - 1 ? "none" : td.borderBottom }}>
                    <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 13 }}>{c.full_name}</div>
                    {c.phone && <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>{c.phone}</div>}
                  </td>
                  <td style={{ ...td, borderBottom: idx === candidates.length - 1 ? "none" : td.borderBottom }}>
                    {c.email}
                  </td>
                  <td style={{ ...td, borderBottom: idx === candidates.length - 1 ? "none" : td.borderBottom }}>
                    {c.location ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <MapPin size={12} />
                        {c.location}
                      </span>
                    ) : <span style={{ color: "var(--color-text-disabled)" }}>—</span>}
                  </td>
                  <td style={{ ...td, borderBottom: idx === candidates.length - 1 ? "none" : td.borderBottom }}>
                    {c.experience_years != null ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Briefcase size={12} />
                        {c.experience_years} ano{c.experience_years !== 1 ? "s" : ""}
                      </span>
                    ) : <span style={{ color: "var(--color-text-disabled)" }}>—</span>}
                  </td>
                  <td style={{ ...td, borderBottom: idx === candidates.length - 1 ? "none" : td.borderBottom }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {c.skills?.slice(0, 3).map((s: string) => (
                        <span key={s} style={{
                          padding: "2px 8px", borderRadius: 100,
                          background: "var(--color-primary-light)", color: "var(--color-primary)",
                          fontSize: 11, fontWeight: 500,
                        }}>{s}</span>
                      ))}
                      {(c.skills?.length ?? 0) > 3 && (
                        <span style={{
                          padding: "2px 8px", borderRadius: 100,
                          background: "var(--color-background)", color: "var(--color-text-tertiary)",
                          fontSize: 11, fontWeight: 500,
                        }}>+{c.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ ...td, borderBottom: idx === candidates.length - 1 ? "none" : td.borderBottom }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {c.resume_url && (
                        <a href={c.resume_url} target="_blank" rel="noreferrer"
                          style={{ color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 500, textDecoration: "none" }}
                          title="Currículo"
                        >
                          <ExternalLink size={13} /> CV
                        </a>
                      )}
                      {c.linkedin_url && (
                        <a href={c.linkedin_url} target="_blank" rel="noreferrer"
                          style={{ color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 500, textDecoration: "none" }}
                          title="LinkedIn"
                        >
                          <ExternalLink size={13} /> in
                        </a>
                      )}
                      {!c.resume_url && !c.linkedin_url && <span style={{ color: "var(--color-text-disabled)" }}>—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border-light)", background: "#fff", color: "var(--color-text-secondary)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}
          >
            Anterior
          </button>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
          </span>
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

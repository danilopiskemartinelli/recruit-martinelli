"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import {
  LayoutDashboard, Briefcase, Users, ClipboardList,
  FileText, Brain, BarChart3, LogOut, Building2,
} from "lucide-react";

const recruiterLinks = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/jobs",         label: "Vagas",         icon: Briefcase },
  { href: "/candidates",   label: "Candidatos",   icon: Users },
  { href: "/assessments",  label: "Avaliações",   icon: ClipboardList },
  { href: "/applications", label: "Candidaturas", icon: FileText },
  { href: "/insights",     label: "Insights IA",  icon: Brain },
  { href: "/reports",      label: "Relatórios",   icon: BarChart3 },
];

const adminLinks = [
  { href: "/admin", label: "Admin", icon: Building2 },
];

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const links = user?.role === "admin" ? [...recruiterLinks, ...adminLinks] : recruiterLinks;

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: "#fff",
      borderRight: "1px solid var(--color-border-light)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Logo */}
      <div style={{
        padding: "24px 20px 20px",
        borderBottom: "1px solid var(--color-border-light)",
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.3px" }}>
          HR Platform
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                background: active ? "var(--color-primary-light)" : "transparent",
                textDecoration: "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-background)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
                }
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: "16px 20px",
        borderTop: "1px solid var(--color-border-light)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "var(--color-primary)",
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>
          {initials(user?.full_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.full_name ?? "Usuário"}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", textTransform: "capitalize" }}>
            {user?.role ?? "recruiter"}
          </div>
        </div>
        <button
          onClick={logout}
          title="Sair"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--color-text-tertiary)", padding: 4, borderRadius: 6,
            display: "flex", alignItems: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-error)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}

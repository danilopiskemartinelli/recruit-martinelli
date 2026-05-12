"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import {
  LayoutDashboard, Briefcase, Users, ClipboardList,
  FileText, Brain, BarChart3, LogOut, Building2,
} from "lucide-react";

const recruiterLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Vagas", icon: Briefcase },
  { href: "/candidates", label: "Candidatos", icon: Users },
  { href: "/assessments", label: "Avaliações", icon: ClipboardList },
  { href: "/applications", label: "Candidaturas", icon: FileText },
  { href: "/insights", label: "Insights IA", icon: Brain },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
];

const adminLinks = [
  { href: "/admin", label: "Admin", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const links = user?.role === "admin" ? [...recruiterLinks, ...adminLinks] : recruiterLinks;

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="font-bold text-lg">HR Platform</h1>
        <p className="text-slate-400 text-xs mt-1">{user?.full_name}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === href
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white text-sm w-full rounded-lg hover:bg-slate-800 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}

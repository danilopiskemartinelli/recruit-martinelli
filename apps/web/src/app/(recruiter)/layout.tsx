"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role === "candidate") {
      router.push("/portal");
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{
        flex: 1,
        padding: "32px 36px",
        overflow: "auto",
        background: "var(--color-background)",
        minWidth: 0,
      }}>
        {children}
      </main>
    </div>
  );
}

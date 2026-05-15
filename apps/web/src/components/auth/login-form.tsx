"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  email:    z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  fontSize: 13,
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  marginBottom: 6,
};

export function LoginForm() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: tokens } = await api.post("/auth/login", data);
      setTokens(tokens.access_token, tokens.refresh_token);
      const { data: me } = await api.get("/auth/me");
      setUser(me);
      router.push(me.role === "candidate" ? "/portal" : "/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={labelStyle}>E-mail</label>
        <input
          type="email"
          {...register("email")}
          style={inputStyle}
          placeholder="seu@empresa.com"
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
        {errors.email && <p style={{ marginTop: 4, fontSize: 11, color: "var(--color-error)" }}>{errors.email.message}</p>}
      </div>

      <div>
        <label style={labelStyle}>Senha</label>
        <input
          type="password"
          {...register("password")}
          style={inputStyle}
          placeholder="••••••••"
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
        {errors.password && <p style={{ marginTop: 4, fontSize: 11, color: "var(--color-error)" }}>{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px 0",
          borderRadius: 8,
          border: "none",
          background: "var(--color-primary)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "background 0.15s",
          marginTop: 4,
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "var(--color-primary-hover)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-primary)"; }}
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

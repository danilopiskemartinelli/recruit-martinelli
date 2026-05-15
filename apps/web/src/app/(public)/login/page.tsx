import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-background)",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-primary)", letterSpacing: "-0.3px", marginBottom: 4 }}>
            HR Platform
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>
            Recrutamento & Seleção
          </div>
        </div>
        <div style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid var(--color-border-light)",
          boxShadow: "var(--shadow-card)",
          padding: "32px 28px",
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>Acesso ao sistema</div>
            <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 4 }}>Use suas credenciais corporativas</div>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

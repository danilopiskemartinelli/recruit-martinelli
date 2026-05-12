import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight">
            Recrutamento Inteligente
            <span className="block text-blue-400">com IA</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Avalie candidatos, gerencie vagas e obtenha insights de IA para tomar
            as melhores decisões de contratação.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 border border-slate-400 hover:border-white rounded-lg font-semibold transition-colors"
            >
              Criar Conta
            </Link>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "🎯", title: "Avaliações Inteligentes", desc: "Monte testes personalizados com múltiplos tipos de questões" },
            { icon: "🤖", title: "Insights de IA", desc: "Análise automática de currículos e respostas com IA" },
            { icon: "✍️", title: "Assinatura Digital", desc: "Assine documentos digitalmente com trilha de auditoria completa" },
          ].map((f) => (
            <div key={f.title} className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-300 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

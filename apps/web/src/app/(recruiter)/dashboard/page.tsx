import { Briefcase, Users, ClipboardList, TrendingUp } from "lucide-react";

const stats = [
  { label: "Vagas Ativas", value: "—", icon: Briefcase, color: "blue" },
  { label: "Candidatos", value: "—", icon: Users, color: "green" },
  { label: "Avaliações Pendentes", value: "—", icon: ClipboardList, color: "amber" },
  { label: "Contratações no Mês", value: "—", icon: TrendingUp, color: "purple" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral do processo seletivo</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`p-3 rounded-full bg-${color}-100`}>
                <Icon size={24} className={`text-${color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h2 className="font-semibold text-blue-900 mb-2">Sistema pronto para uso!</h2>
        <p className="text-blue-700 text-sm">
          A plataforma foi configurada com sucesso. Comece criando suas primeiras vagas e avaliações.
        </p>
      </div>
    </div>
  );
}

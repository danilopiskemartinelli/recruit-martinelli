import { JobForm } from "@/components/jobs/job-form";

export default function NewJobPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nova vaga</h1>
        <p className="text-gray-500 mt-1 text-sm">Preencha os dados da vaga para começar a receber candidaturas.</p>
      </div>
      <JobForm />
    </div>
  );
}

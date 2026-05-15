"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { JobForm } from "@/components/jobs/job-form";

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data } = await (await import("@/lib/api-client")).api.get(`/jobs/${id}`);
      return data;
    },
  });

  if (isLoading) {
    return <div className="h-96 bg-gray-100 rounded-xl animate-pulse max-w-3xl" />;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar vaga</h1>
        <p className="text-gray-500 mt-1 text-sm">{job?.title}</p>
      </div>
      <JobForm job={job} />
    </div>
  );
}

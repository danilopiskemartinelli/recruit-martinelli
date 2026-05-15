"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

const schema = z.object({
  title: z.string().min(3, "Título obrigatório"),
  description: z.string().min(10, "Descrição obrigatória"),
  requirements: z.string().optional(),
  location: z.string().optional(),
  job_type: z.enum(["full_time", "part_time", "contract", "internship", ""]).optional(),
  modality: z.enum(["remote", "hybrid", "onsite", ""]).optional(),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  salary_currency: z.string().default("BRL"),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface JobFormProps {
  job?: any;
}

export function JobForm({ job }: JobFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!job;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: job
      ? {
          title: job.title,
          description: job.description,
          requirements: job.requirements ?? "",
          location: job.location ?? "",
          job_type: job.job_type ?? "",
          modality: job.modality ?? "",
          salary_min: job.salary_min?.toString() ?? "",
          salary_max: job.salary_max?.toString() ?? "",
          salary_currency: job.salary_currency ?? "BRL",
          tags: job.tags?.join(", ") ?? "",
        }
      : { salary_currency: "BRL" },
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEditing ? api.patch(`/jobs/${job.id}`, data) : api.post("/jobs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success(isEditing ? "Vaga atualizada!" : "Vaga criada!");
      router.push("/jobs");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail ?? "Erro ao salvar vaga");
    },
  });

  const onSubmit = (data: FormData) => {
    const payload: any = {
      ...data,
      job_type: data.job_type || null,
      modality: data.modality || null,
      salary_min: data.salary_min ? Number(data.salary_min) : null,
      salary_max: data.salary_max ? Number(data.salary_max) : null,
      tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };
    delete payload.tags;
    payload.tags = data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
      <div className="grid grid-cols-1 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título da vaga *</label>
          <input
            {...register("title")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Desenvolvedor(a) Full Stack Sênior"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
          <textarea
            {...register("description")}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Descreva as responsabilidades, cultura da equipe, benefícios..."
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Requisitos</label>
          <textarea
            {...register("requirements")}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Liste os requisitos e diferenciais..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              {...register("job_type")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Selecionar</option>
              <option value="full_time">CLT / Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">PJ / Contrato</option>
              <option value="internship">Estágio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
            <select
              {...register("modality")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Selecionar</option>
              <option value="remote">Remoto</option>
              <option value="hybrid">Híbrido</option>
              <option value="onsite">Presencial</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
          <input
            {...register("location")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="São Paulo, SP"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salário mínimo</label>
            <input
              type="number"
              {...register("salary_min")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salário máximo</label>
            <input
              type="number"
              {...register("salary_max")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="8000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moeda</label>
            <select
              {...register("salary_currency")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="BRL">BRL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separadas por vírgula)</label>
          <input
            {...register("tags")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="React, TypeScript, Node.js"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {mutation.isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar vaga"}
        </button>
      </div>
    </form>
  );
}

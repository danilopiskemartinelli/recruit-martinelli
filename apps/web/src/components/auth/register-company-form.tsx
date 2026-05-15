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
  company_name: z.string().min(2, "Nome da empresa obrigatório"),
  company_slug: z
    .string()
    .min(2, "Slug obrigatório")
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
  admin_full_name: z.string().min(2, "Nome obrigatório"),
  admin_email: z.string().email("E-mail inválido"),
  admin_password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormData = z.infer<typeof schema>;

export function RegisterCompanyForm() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setValue("company_slug", slug, { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: res } = await api.post("/auth/register-company", data);
      setTokens(res.access_token, res.refresh_token);
      setUser(res.user);
      toast.success("Empresa criada com sucesso!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 mb-2">Dados da empresa</legend>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da empresa</label>
          <input
            {...register("company_name")}
            onChange={(e) => {
              register("company_name").onChange(e);
              onCompanyNameChange(e);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Acme Ltda"
          />
          {errors.company_name && <p className="mt-1 text-xs text-red-600">{errors.company_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
            <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r border-gray-300">hrplatform.com/</span>
            <input
              {...register("company_slug")}
              className="flex-1 px-3 py-2 focus:outline-none text-sm"
              placeholder="acme"
            />
          </div>
          {errors.company_slug && <p className="mt-1 text-xs text-red-600">{errors.company_slug.message}</p>}
        </div>
      </fieldset>

      <hr className="border-gray-100" />

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 mb-2">Dados do administrador</legend>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          <input
            {...register("admin_full_name")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="João Silva"
          />
          {errors.admin_full_name && <p className="mt-1 text-xs text-red-600">{errors.admin_full_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input
            type="email"
            {...register("admin_email")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="joao@acme.com"
          />
          {errors.admin_email && <p className="mt-1 text-xs text-red-600">{errors.admin_email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input
            type="password"
            {...register("admin_password")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mínimo 8 caracteres"
          />
          {errors.admin_password && <p className="mt-1 text-xs text-red-600">{errors.admin_password.message}</p>}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {loading ? "Criando conta..." : "Criar conta grátis"}
      </button>
    </form>
  );
}

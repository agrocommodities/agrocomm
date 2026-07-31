"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createJobListing,
  editUserJobListing,
  getCitiesForJobState,
} from "@/actions/jobs";
import { Briefcase, UserSearch } from "lucide-react";
import MarkdownEditor from "@/components/MarkdownEditor";
import { JOB_AREAS, CONTRACT_TYPES, AVAILABILITY_OPTIONS } from "@/lib/jobs";

interface State {
  id: number;
  code: string;
  name: string;
}

interface City {
  id: number;
  name: string;
}

export interface JobListingFormInitial {
  id: number;
  type: "oferta" | "candidato";
  title: string;
  area: string;
  description: string | null;
  companyName: string | null;
  contractType: string | null;
  salaryRange: string | null;
  positionsCount: number | null;
  requirements: string | null;
  benefits: string | null;
  desiredRole: string | null;
  experienceYears: number | null;
  availability: string | null;
  skills: string | null;
  stateId: number;
  cityId: number;
  contactPhone: string | null;
  contactEmail: string | null;
}

const inputClass =
  "w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 transition";

export default function JobListingForm({
  states,
  initial,
  initialCities,
  defaultType,
}: {
  states: State[];
  initial?: JobListingFormInitial;
  initialCities?: City[];
  defaultType?: "oferta" | "candidato";
}) {
  const router = useRouter();
  const isEdit = !!initial;
  const [type, setType] = useState<"oferta" | "candidato">(
    initial?.type ?? defaultType ?? "oferta",
  );
  const [citiesList, setCities] = useState<City[]>(initialCities ?? []);
  const [loadingCities, startCities] = useTransition();

  const [state, formAction, isPending] = useActionState(
    async (
      prev: { error?: string; success?: boolean } | null,
      formData: FormData,
    ) => {
      formData.set("type", type);
      if (isEdit) {
        formData.set("jobId", String(initial.id));
        const result = await editUserJobListing(prev, formData);
        if (result.success && result.slug) router.push(`/vagas/${result.slug}`);
        return result;
      }
      const result = await createJobListing(prev, formData);
      if (result.success && result.slug) router.push(`/vagas/${result.slug}`);
      return result;
    },
    null,
  );

  function handleStateChange(stateId: string) {
    if (!stateId) {
      setCities([]);
      return;
    }
    startCities(async () => {
      const c = await getCitiesForJobState(Number(stateId));
      setCities(c);
    });
  }

  return (
    <form
      action={formAction}
      className="bg-white/3 border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col gap-5"
    >
      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm text-green-400">
          Publicação enviada! Aguardando aprovação do administrador.
        </div>
      )}

      {/* Type toggle */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-white/60 font-medium">
          O que você quer publicar? *
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isEdit}
            onClick={() => setType("oferta")}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium border transition disabled:cursor-not-allowed disabled:opacity-70 ${
              type === "oferta"
                ? "bg-green-600/20 text-green-400 border-green-400/30"
                : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Oferecer vaga
          </button>
          <button
            type="button"
            disabled={isEdit}
            onClick={() => setType("candidato")}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium border transition disabled:cursor-not-allowed disabled:opacity-70 ${
              type === "candidato"
                ? "bg-green-600/20 text-green-400 border-green-400/30"
                : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
            }`}
          >
            <UserSearch className="w-4 h-4" />
            Procurar vaga
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-xs text-white/60 font-medium">
          {type === "oferta" ? "Título da vaga *" : "Título/Resumo *"}
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          defaultValue={initial?.title}
          placeholder={
            type === "oferta"
              ? "Ex: Operador de máquinas agrícolas"
              : "Ex: Técnico agrícola com 5 anos de experiência"
          }
          className={inputClass}
        />
      </div>

      {/* Area */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="area" className="text-xs text-white/60 font-medium">
          Área/Setor *
        </label>
        <select
          id="area"
          name="area"
          required
          defaultValue={initial?.area ?? ""}
          className={inputClass}
        >
          <option value="">Selecione...</option>
          {JOB_AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {type === "oferta" ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="companyName"
              className="text-xs text-white/60 font-medium"
            >
              Empresa/Propriedade *
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              maxLength={120}
              defaultValue={initial?.companyName ?? ""}
              placeholder="Ex: Fazenda Santa Rita"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="contractType"
                className="text-xs text-white/60 font-medium"
              >
                Tipo de contratação
              </label>
              <select
                id="contractType"
                name="contractType"
                defaultValue={initial?.contractType ?? ""}
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {CONTRACT_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="positionsCount"
                className="text-xs text-white/60 font-medium"
              >
                Nº de vagas
              </label>
              <input
                id="positionsCount"
                name="positionsCount"
                type="number"
                min={1}
                defaultValue={initial?.positionsCount ?? ""}
                placeholder="Ex: 2"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="salaryRange"
              className="text-xs text-white/60 font-medium"
            >
              Salário
            </label>
            <input
              id="salaryRange"
              name="salaryRange"
              type="text"
              maxLength={80}
              defaultValue={initial?.salaryRange ?? ""}
              placeholder="Ex: R$ 2.000 a R$ 2.500 ou A combinar"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="requirements"
              className="text-xs text-white/60 font-medium"
            >
              Requisitos
            </label>
            <MarkdownEditor
              id="requirements"
              name="requirements"
              maxLength={3000}
              defaultValue={initial?.requirements ?? ""}
              placeholder="Ex: Experiência com maquinário agrícola, CNH categoria D..."
              inputClassName={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="benefits"
              className="text-xs text-white/60 font-medium"
            >
              Benefícios
            </label>
            <MarkdownEditor
              id="benefits"
              name="benefits"
              maxLength={3000}
              defaultValue={initial?.benefits ?? ""}
              placeholder="Ex: Moradia, alimentação, vale-transporte..."
              inputClassName={inputClass}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="desiredRole"
              className="text-xs text-white/60 font-medium"
            >
              Cargo pretendido *
            </label>
            <input
              id="desiredRole"
              name="desiredRole"
              type="text"
              required
              maxLength={120}
              defaultValue={initial?.desiredRole ?? ""}
              placeholder="Ex: Tratorista, Veterinário, Gerente de fazenda"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="experienceYears"
                className="text-xs text-white/60 font-medium"
              >
                Anos de experiência
              </label>
              <input
                id="experienceYears"
                name="experienceYears"
                type="number"
                min={0}
                defaultValue={initial?.experienceYears ?? ""}
                placeholder="Ex: 3"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="availability"
                className="text-xs text-white/60 font-medium"
              >
                Disponibilidade
              </label>
              <select
                id="availability"
                name="availability"
                defaultValue={initial?.availability ?? ""}
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="skills"
              className="text-xs text-white/60 font-medium"
            >
              Habilidades e experiências
            </label>
            <MarkdownEditor
              id="skills"
              name="skills"
              maxLength={3000}
              defaultValue={initial?.skills ?? ""}
              placeholder="Ex: Manejo de gado, operação de colheitadeira, CNH categoria E..."
              inputClassName={inputClass}
            />
          </div>
        </>
      )}

      {/* Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="stateId"
            className="text-xs text-white/60 font-medium"
          >
            Estado *
          </label>
          <select
            id="stateId"
            name="stateId"
            required
            defaultValue={initial?.stateId ?? ""}
            className={inputClass}
            onChange={(e) => handleStateChange(e.target.value)}
          >
            <option value="">Selecione...</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cityId" className="text-xs text-white/60 font-medium">
            Cidade *
          </label>
          <select
            id="cityId"
            name="cityId"
            required
            defaultValue={initial?.cityId ?? ""}
            className={inputClass}
            disabled={loadingCities || citiesList.length === 0}
          >
            <option value="">
              {loadingCities ? "Carregando..." : "Selecione o estado primeiro"}
            </option>
            {citiesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="description"
          className="text-xs text-white/60 font-medium"
        >
          Descrição
        </label>
        <MarkdownEditor
          id="description"
          name="description"
          maxLength={5000}
          defaultValue={initial?.description ?? ""}
          placeholder={
            type === "oferta"
              ? "Descreva a vaga, atividades do dia a dia, e o que espera do candidato."
              : "Conte um pouco sobre sua trajetória e o que procura."
          }
          inputClassName={inputClass}
        />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="contactPhone"
            className="text-xs text-white/60 font-medium"
          >
            Telefone/WhatsApp
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            maxLength={20}
            defaultValue={initial?.contactPhone ?? ""}
            placeholder="(00) 00000-0000"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="contactEmail"
            className="text-xs text-white/60 font-medium"
          >
            E-mail
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            maxLength={120}
            defaultValue={initial?.contactEmail ?? ""}
            placeholder="seu@email.com"
            className={inputClass}
          />
        </div>
      </div>
      <p className="text-xs text-white/30 -mt-3">
        Informe ao menos um telefone ou e-mail para contato.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
      >
        {isPending ? "Enviando..." : isEdit ? "Salvar Alterações" : "Publicar"}
      </button>

      {!isEdit && (
        <p className="text-xs text-white/30 text-center">
          Sua publicação será revisada antes de ficar visível.
        </p>
      )}
    </form>
  );
}

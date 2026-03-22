"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClassified, getCitiesForState } from "@/actions/classifieds";
import { ImagePlus, X } from "lucide-react";
import MarkdownEditor from "@/components/MarkdownEditor";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface State {
  id: number;
  code: string;
  name: string;
}

interface City {
  id: number;
  name: string;
}

const YEAR_AND_MILEAGE_SLUGS = ["carros", "caminhoes", "camionetes", "motos"];
const YEAR_ONLY_SLUGS = [
  "tratores",
  "colheitadeiras",
  "implementos-agricolas",
  "maquinas",
];

function getCategorySlug(
  categories: Category[],
  categoryId: string,
): string | undefined {
  return categories.find((c) => String(c.id) === categoryId)?.slug;
}

const inputClass =
  "w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 transition";

function formatPrice(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("pt-BR");
}

export default function NewClassifiedForm({
  categories,
  states,
}: {
  categories: Category[];
  states: State[];
}) {
  const router = useRouter();
  const [citiesList, setCities] = useState<City[]>([]);
  const [loadingCities, startCities] = useTransition();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [priceDisplay, setPriceDisplay] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(
    async (
      prev: { error?: string; success?: boolean } | null,
      formData: FormData,
    ) => {
      // Replace the native file input entries with our managed files
      formData.delete("images");
      for (const file of imageFiles) {
        formData.append("images", file);
      }
      const result = await createClassified(prev, formData);
      if (result.success && result.slug) {
        router.push(`/classificados/${result.slug}`);
      }
      return result;
    },
    null,
  );

  const selectedSlug = getCategorySlug(categories, selectedCategoryId);
  const showYear =
    selectedSlug != null &&
    (YEAR_AND_MILEAGE_SLUGS.includes(selectedSlug) ||
      YEAR_ONLY_SLUGS.includes(selectedSlug));
  const showMileage =
    selectedSlug != null && YEAR_AND_MILEAGE_SLUGS.includes(selectedSlug);

  function handleStateChange(stateId: string) {
    if (!stateId) {
      setCities([]);
      return;
    }
    startCities(async () => {
      const c = await getCitiesForState(Number(stateId));
      setCities(c);
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setImageFiles((prev) => {
      const combined = [...prev, ...newFiles].slice(0, 6);
      setPreviews(combined.map((f) => URL.createObjectURL(f)));
      return combined;
    });
    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImageFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // Revoke old preview URL
      URL.revokeObjectURL(previews[index]);
      setPreviews(next.map((f) => URL.createObjectURL(f)));
      return next;
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
          Anúncio criado! Aguardando aprovação do administrador.
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-xs text-white/60 font-medium">
          Título *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          placeholder="Ex: Trator John Deere 6110J 2020"
          className={inputClass}
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="categoryId"
          className="text-xs text-white/60 font-medium"
        >
          Categoria *
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          className={inputClass}
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
        >
          <option value="">Selecione...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="price" className="text-xs text-white/60 font-medium">
          Valor (R$) *
        </label>
        <input
          id="price"
          name="price"
          type="text"
          inputMode="numeric"
          required
          placeholder="Ex: 150.000"
          value={priceDisplay}
          onChange={(e) => setPriceDisplay(formatPrice(e.target.value))}
          className={inputClass}
        />
      </div>

      {/* Year + Mileage (conditional) */}
      {showYear && (
        <div
          className={`grid grid-cols-1 ${showMileage ? "sm:grid-cols-2" : ""} gap-4`}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="year" className="text-xs text-white/60 font-medium">
              Ano
            </label>
            <input
              id="year"
              name="year"
              type="number"
              min={1900}
              max={new Date().getFullYear() + 1}
              placeholder="Ex: 2020"
              className={inputClass}
            />
          </div>
          {showMileage && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="mileage"
                className="text-xs text-white/60 font-medium"
              >
                Quilometragem (km)
              </label>
              <input
                id="mileage"
                name="mileage"
                type="number"
                min={0}
                placeholder="Ex: 85000"
                className={inputClass}
              />
            </div>
          )}
        </div>
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
          placeholder="Descreva o produto, estado de conservação, ano, horas de uso, etc."
          inputClassName={inputClass}
        />
      </div>

      {/* Images */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="images" className="text-xs text-white/60 font-medium">
          Imagens (até 6, máx. 5MB cada) — {imageFiles.length}/6
        </label>
        {imageFiles.length < 6 && (
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-xl py-6 cursor-pointer hover:border-green-400/40 transition">
            <ImagePlus className="w-5 h-5 text-white/40" />
            <span className="text-sm text-white/40">
              Clique para adicionar imagens
            </span>
            <input
              ref={fileInputRef}
              id="images"
              type="file"
              name="images"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        )}
        {previews.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {previews.map((url, i) => (
              <div
                key={imageFiles[i]?.name ?? url}
                className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-white/10 group"
              >
                {/* biome-ignore lint/performance/noImgElement: preview */}
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
      >
        {isPending ? "Publicando..." : "Publicar Anúncio"}
      </button>

      <p className="text-xs text-white/30 text-center">
        Seu anúncio será revisado antes de ser publicado.
      </p>
    </form>
  );
}

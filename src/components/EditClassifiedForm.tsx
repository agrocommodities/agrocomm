"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editUserClassified, getCitiesForState } from "@/actions/classifieds";
import { ImagePlus, X } from "lucide-react";

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

interface ExistingImage {
  id: number;
  url: string;
  position: number;
}

interface ClassifiedData {
  id: number;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  stateId: number;
  cityId: number;
  images: ExistingImage[];
}

const inputClass =
  "w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 transition";

function formatPrice(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("pt-BR");
}

export default function EditClassifiedForm({
  classified,
  categories,
  states,
  initialCities,
}: {
  classified: ClassifiedData;
  categories: Category[];
  states: State[];
  initialCities: City[];
}) {
  const router = useRouter();
  const [citiesList, setCities] = useState<City[]>(initialCities);
  const [loadingCities, startCities] = useTransition();
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    classified.images,
  );
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [priceDisplay, setPriceDisplay] = useState(
    classified.price.toLocaleString("pt-BR"),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(
    async (
      prev: { error?: string; success?: boolean } | null,
      formData: FormData,
    ) => {
      formData.set("classifiedId", String(classified.id));
      // Replace native file input with managed files
      formData.delete("images");
      for (const file of newFiles) {
        formData.append("images", file);
      }
      // Append removed image ids
      for (const id of removedIds) {
        formData.append("removedImageIds", String(id));
      }
      const result = await editUserClassified(prev, formData);
      if (result.success && result.slug) {
        router.push(`/classificados/${result.slug}`);
      }
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
      const c = await getCitiesForState(Number(stateId));
      setCities(c);
    });
  }

  const totalImages = existingImages.length + newFiles.length;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const added = Array.from(files);
    setNewFiles((prev) => {
      const combined = [...prev, ...added].slice(0, 6 - existingImages.length);
      setNewPreviews(combined.map((f) => URL.createObjectURL(f)));
      return combined;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeExistingImage(imgId: number) {
    setExistingImages((prev) => prev.filter((img) => img.id !== imgId));
    setRemovedIds((prev) => [...prev, imgId]);
  }

  function removeNewImage(index: number) {
    setNewFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(newPreviews[index]);
      setNewPreviews(next.map((f) => URL.createObjectURL(f)));
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
          Anúncio atualizado com sucesso!
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
          defaultValue={classified.title}
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
          defaultValue={classified.categoryId}
          className={inputClass}
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
          value={priceDisplay}
          onChange={(e) => setPriceDisplay(formatPrice(e.target.value))}
          className={inputClass}
        />
      </div>

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
            defaultValue={classified.stateId}
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
            defaultValue={classified.cityId}
            className={inputClass}
            disabled={loadingCities || citiesList.length === 0}
          >
            <option value="">
              {loadingCities ? "Carregando..." : "Selecione..."}
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
          Descrição *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          maxLength={5000}
          defaultValue={classified.description}
          className={inputClass}
        />
      </div>

      {/* Images */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-white/60 font-medium">
          Imagens (até 6, máx. 5MB cada) — {totalImages}/6
        </span>

        {/* Existing images */}
        {existingImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {existingImages.map((img) => (
              <div
                key={img.id}
                className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-white/10 group"
              >
                {/* biome-ignore lint/performance/noImgElement: preview */}
                <img
                  src={img.url}
                  alt="Imagem do anúncio"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New image previews */}
        {newPreviews.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {newPreviews.map((url, i) => (
              <div
                key={newFiles[i]?.name ?? url}
                className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-green-400/20 group"
              >
                {/* biome-ignore lint/performance/noImgElement: preview */}
                <img
                  src={url}
                  alt={`Nova imagem ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-[9px] text-center text-white py-0.5">
                  Nova
                </div>
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add more */}
        {totalImages < 6 && (
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-xl py-6 cursor-pointer hover:border-green-400/40 transition">
            <ImagePlus className="w-5 h-5 text-white/40" />
            <span className="text-sm text-white/40">Adicionar imagens</span>
            <input
              ref={fileInputRef}
              type="file"
              name="images"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
      >
        {isPending ? "Salvando..." : "Salvar Alterações"}
      </button>
    </form>
  );
}

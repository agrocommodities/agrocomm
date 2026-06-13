"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Copy, Link2, Loader2 } from "lucide-react";
import {
  createSharedCalculation,
  type SharedCalculatorData,
  type SharedCalculatorField,
} from "@/actions/shared-calculations";

type Props = {
  initialData?: SharedCalculatorData | null;
};

function getFieldLabel(element: HTMLInputElement | HTMLSelectElement): string {
  const label = element.closest("label");
  const title = label?.querySelector("span");
  return title?.textContent?.trim() ?? "";
}

function setNativeValue(
  element: HTMLInputElement | HTMLSelectElement,
  value: string,
) {
  const prototype =
    element instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : HTMLSelectElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export default function ShareCalculatorControls({ initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialData?.fields.length) return;

    const frame = window.requestAnimationFrame(() => {
      const root = document.querySelector<HTMLElement>("[data-calculator-root]");
      if (!root) return;

      const elements = Array.from(
        root.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
          "input, select",
        ),
      );

      for (const field of initialData.fields) {
        const element = elements.find(
          (candidate) =>
            getFieldLabel(candidate) === field.label &&
            (candidate instanceof HTMLInputElement ? "input" : "select") ===
              field.type,
        );
        if (element) setNativeValue(element, field.value);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [initialData]);

  function collectData(): SharedCalculatorData {
    const root = document.querySelector<HTMLElement>("[data-calculator-root]");
    if (!root) throw new Error("Calculadora não encontrada.");

    const fields: SharedCalculatorField[] = Array.from(
      root.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        "input, select",
      ),
    )
      .map((element) => ({
        label: getFieldLabel(element),
        value: element.value,
        type: element instanceof HTMLInputElement ? "input" as const : "select" as const,
      }))
      .filter((field) => field.label.length > 0);

    return { fields };
  }

  function handleCreateLink() {
    setError("");
    startTransition(async () => {
      try {
        const result = await createSharedCalculation(collectData());
        setShareUrl(
          `${window.location.origin}/ferramentas/calculadora-pecuaria/${result.uuid}`,
        );
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível criar o link de compartilhamento.",
        );
      }
    });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-2xl border border-green-500/20 bg-green-500/8 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <Link2 className="size-4 text-green-400" />
            Compartilhar simulação
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-white/45">
            Crie um link permanente com todos os dados atualmente preenchidos.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateLink}
          disabled={isPending}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
          Criar link
        </button>
      </div>

      {shareUrl && (
        <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={shareUrl}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white/70 outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10"
          >
            {copied ? <Check className="size-4 text-green-400" /> : <Copy className="size-4" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </section>
  );
}

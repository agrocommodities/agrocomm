"use client";

import { useEffect } from "react";

function updateControlledInput(input: HTMLInputElement, value: number) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;

  setter?.call(input, String(value));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function getNextValue(input: HTMLInputElement, direction: -1 | 1) {
  const current = Number(input.value) || 0;
  const step = Number(input.step) || 1;
  const minimum =
    input.min === "" ? Number.NEGATIVE_INFINITY : Number(input.min);
  const maximum =
    input.max === "" ? Number.POSITIVE_INFINITY : Number(input.max);
  const precision = Math.max(
    (String(step).split(".")[1] ?? "").length,
    (String(current).split(".")[1] ?? "").length,
  );

  const next = current + step * direction;
  const clamped = Math.min(maximum, Math.max(minimum, next));
  return Number(clamped.toFixed(precision));
}

function createButton(
  input: HTMLInputElement,
  direction: -1 | 1,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.numberControl = direction === -1 ? "decrement" : "increment";
  button.setAttribute(
    "aria-label",
    direction === -1 ? "Diminuir valor" : "Aumentar valor",
  );
  button.textContent = direction === -1 ? "−" : "+";
  button.className = [
    "absolute",
    "top-0",
    "z-10",
    "flex",
    "h-full",
    "w-10",
    "items-center",
    "justify-center",
    "border-white/10",
    "bg-white/5",
    "text-lg",
    "font-semibold",
    "text-white/65",
    "transition",
    "hover:bg-white/10",
    "hover:text-white",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-green-500/40",
    direction === -1
      ? "left-0 rounded-l-xl border-r"
      : "right-0 rounded-r-xl border-l",
  ].join(" ");

  button.addEventListener("click", () => {
    updateControlledInput(input, getNextValue(input, direction));
  });

  return button;
}

export default function NumericInputEnhancer() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-calculator-root]");
    if (!root) return;

    const enhance = () => {
      const inputs = root.querySelectorAll<HTMLInputElement>(
        'input[type="number"]:not([data-counter-enhanced])',
      );

      for (const input of inputs) {
        const container = input.parentElement;
        if (!container) continue;

        input.dataset.counterEnhanced = "true";
        input.classList.remove("px-3", "pr-14");
        input.classList.add(
          "h-11",
          "px-12",
          "text-center",
          "font-medium",
          "tabular-nums",
          "[appearance:textfield]",
          "[&::-webkit-inner-spin-button]:appearance-none",
          "[&::-webkit-outer-spin-button]:appearance-none",
        );

        const suffix = Array.from(container.children).find(
          (element) =>
            element instanceof HTMLSpanElement &&
            element.classList.contains("pointer-events-none"),
        );

        if (suffix instanceof HTMLSpanElement) {
          suffix.classList.remove("right-3");
          suffix.classList.add("right-12", "max-w-16", "truncate");
          input.classList.remove("pr-12");
          input.classList.add("pr-24");
        }

        container.prepend(createButton(input, -1));
        container.append(createButton(input, 1));
      }
    };

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}

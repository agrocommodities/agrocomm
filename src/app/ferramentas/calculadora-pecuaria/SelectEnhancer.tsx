"use client";

import { useEffect } from "react";

const CHEVRON_ICON = `
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="m6 8 4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

function enhanceSelect(select: HTMLSelectElement) {
  if (select.dataset.selectEnhanced === "true") return;

  const parent = select.parentElement;
  if (!parent) return;

  select.dataset.selectEnhanced = "true";
  select.classList.add(
    "h-11",
    "appearance-none",
    "rounded-xl",
    "border",
    "border-white/10",
    "bg-[#151a13]",
    "pl-3",
    "pr-11",
    "text-sm",
    "font-medium",
    "text-white/90",
    "shadow-sm",
    "outline-none",
    "transition",
    "hover:border-white/20",
    "hover:bg-white/[0.07]",
    "focus:border-green-500/50",
    "focus:ring-4",
    "focus:ring-green-500/10",
    "disabled:cursor-not-allowed",
    "disabled:opacity-50",
  );

  if (parent.dataset.selectWrapper === "true") return;

  const wrapper = document.createElement("div");
  wrapper.dataset.selectWrapper = "true";
  wrapper.className = "relative min-w-0";

  parent.insertBefore(wrapper, select);
  wrapper.appendChild(select);

  const icon = document.createElement("span");
  icon.className = [
    "pointer-events-none",
    "absolute",
    "right-3",
    "top-1/2",
    "flex",
    "size-5",
    "-translate-y-1/2",
    "items-center",
    "justify-center",
    "text-white/40",
    "transition",
    "[&>svg]:size-5",
  ].join(" ");
  icon.innerHTML = CHEVRON_ICON;
  wrapper.appendChild(icon);

  const updateState = () => {
    const hasValue = select.value !== "";
    select.classList.toggle("text-white/90", hasValue);
    select.classList.toggle("text-white/45", !hasValue);
  };

  select.addEventListener("change", updateState);
  select.addEventListener("focus", () => icon.classList.add("text-green-400"));
  select.addEventListener("blur", () =>
    icon.classList.remove("text-green-400"),
  );
  updateState();
}

export default function SelectEnhancer() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-calculator-root]");
    if (!root) return;

    const enhance = () => {
      const selects = root.querySelectorAll<HTMLSelectElement>(
        "select:not([data-select-enhanced])",
      );
      selects.forEach(enhanceSelect);
    };

    enhance();

    const observer = new MutationObserver(enhance);
    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

export default function MobileResultsFirst() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-calculator-root]");
    if (!root) return;

    const applyOrder = () => {
      const resultLabel = Array.from(root.querySelectorAll("p")).find(
        (element) =>
          element.textContent?.trim() === "Resultado do sistema selecionado",
      );

      const resultColumn =
        resultLabel?.closest<HTMLElement>(":scope section")?.parentElement;
      const columnsGrid = resultColumn?.parentElement;

      if (!resultColumn || !columnsGrid) return;

      const formColumn = Array.from(columnsGrid.children).find(
        (element) => element !== resultColumn,
      );

      if (!(formColumn instanceof HTMLElement)) return;

      resultColumn.classList.add("order-1", "xl:order-2");
      formColumn.classList.add("order-2", "xl:order-1");
    };

    applyOrder();

    const observer = new MutationObserver(applyOrder);
    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}

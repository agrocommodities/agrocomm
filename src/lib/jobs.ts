export const JOB_AREAS = [
  "Agricultura",
  "Pecuária",
  "Agroindústria",
  "Administrativo/Financeiro",
  "Comercial/Vendas",
  "Operacional/Campo",
  "Maquinário/Mecânica",
  "Veterinária/Zootecnia",
  "Logística/Transporte",
  "Tecnologia/Agro",
  "Outros",
];

export const CONTRACT_TYPES = [
  { value: "clt", label: "CLT" },
  { value: "temporario", label: "Temporário/Safra" },
  { value: "diarista", label: "Diarista" },
  { value: "meeiro", label: "Meeiro/Parceria" },
  { value: "estagio", label: "Estágio" },
  { value: "pj", label: "PJ/Autônomo" },
  { value: "outro", label: "Outro" },
];

export const AVAILABILITY_OPTIONS = [
  { value: "imediata", label: "Imediata" },
  { value: "a-combinar", label: "A combinar" },
];

export function contractTypeLabel(value: string | null): string | null {
  if (!value) return null;
  return CONTRACT_TYPES.find((c) => c.value === value)?.label ?? value;
}

export function availabilityLabel(value: string | null): string | null {
  if (!value) return null;
  return AVAILABILITY_OPTIONS.find((a) => a.value === value)?.label ?? value;
}

import type { State } from "@/types";

export const navLinks = [
  { name: "Início", href: "/" },
  { name: "Cotações", href: "/cotacoes" },
];

export const navigationItems = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/soja", label: "Soja", icon: "🌱" },
  { href: "/milho", label: "Milho", icon: "🌽" },
  { href: "/boi", label: "Boi", icon: "🐂" },
];

export const states: State[] = [
  { abbr: "AC", name: "Acre" },
  { abbr: "AL", name: "Alagoas" },
  { abbr: "AP", name: "Amapá" },
  { abbr: "AM", name: "Amazonas" },
  { abbr: "BA", name: "Bahia" },
  { abbr: "CE", name: "Ceará" },
  { abbr: "DF", name: "Distrito Federal" },
  { abbr: "ES", name: "Espírito Santo" },
  { abbr: "GO", name: "Goiás" },
  { abbr: "MA", name: "Maranhão" },
  { abbr: "MT", name: "Mato Grosso" },
  { abbr: "MS", name: "Mato Grosso do Sul" },
  { abbr: "MG", name: "Minas Gerais" },
  { abbr: "PA", name: "Pará" },
  { abbr: "PB", name: "Paraíba" },
  { abbr: "PR", name: "Paraná" },
  { abbr: "PE", name: "Pernambuco" },
  { abbr: "PI", name: "Piauí" },
  { abbr: "RJ", name: "Rio de Janeiro" },
  { abbr: "RN", name: "Rio Grande do Norte" },
  { abbr: "RS", name: "Rio Grande do Sul" },
  { abbr: "RO", name: "Rondônia" },
  { abbr: "RR", name: "Roraima" },
  { abbr: "SC", name: "Santa Catarina" },
  { abbr: "SP", name: "São Paulo" },
  { abbr: "SE", name: "Sergipe" },
  { abbr: "TO", name: "Tocantins" },
];
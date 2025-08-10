import type { State } from "@/types";

export interface NavLink {
  name: string;
  href?: string;
  subItems?: Array<{ name: string; href: string }>;
}

export const navLinks: NavLink[] = [
  { name: "Início", href: "/" },
  { 
    name: "Cotações", 
    subItems: [
      { name: "Soja", href: "/cotacoes/soja" },
      { name: "Milho", href: "/cotacoes/milho" },
      { name: "Arroba do Boi", href: "/cotacoes/boi" },
      { name: "Arroba da Vaca", href: "/cotacoes/vaca" },
    ]
  },
];

export const navigationItems = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/soja", label: "Soja", icon: "🌱" },
  { href: "/milho", label: "Milho", icon: "🌽" },
  { href: "/boi", label: "Boi", icon: "🐂" },
];

export const states: State[] = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
];
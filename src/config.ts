import type { PlanInfo, State } from "@/types";

export const navigationItems = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/soja", label: "Soja", icon: "🌱" },
  { href: "/milho", label: "Milho", icon: "🌽" },
  { href: "/boi", label: "Boi", icon: "🐂" },
  // { href: "/analises", label: "Análises", icon: "📊" },
];

// REGION
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

export const planos: Record<string, PlanInfo> = {
  free: {
    name: "free",
    displayName: "Gratuito",
    price: 0,
    features: [
      "Acesso básico às cotações",
      "Histórico de 7 dias",
      "1 alerta de preço",
    ],
    color: "gray",
  },
  basic: {
    name: "basic",
    displayName: "Básico",
    price: 29.90,
    features: [
      "Todas as funcionalidades gratuitas",
      "Histórico de 30 dias",
      "10 alertas de preço",
      "Relatórios mensais",
    ],
    color: "blue",
  },
  pro: {
    name: "pro",
    displayName: "Profissional",
    price: 79.90,
    features: [
      "Todas as funcionalidades básicas",
      "Histórico ilimitado",
      "Alertas ilimitados",
      "API de integração",
      "Suporte prioritário",
    ],
    color: "purple",
    popular: true,
  },
  enterprise: {
    name: "enterprise",
    displayName: "Empresarial",
    price: 199.90,
    features: [
      "Todas as funcionalidades",
      "Múltiplos usuários",
      "Relatórios personalizados",
      "Consultoria dedicada",
      "SLA garantido",
    ],
    color: "gold",
  },
};

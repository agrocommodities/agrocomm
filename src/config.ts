import { PlanInfo, Estado } from "@/types";

export const navigationItems = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/soja", label: "Soja", icon: "🌱" },
  { href: "/milho", label: "Milho", icon: "🌽" },
  { href: "/boi", label: "Boi", icon: "🐂" },
  // { href: "/analises", label: "Análises", icon: "📊" },
];

export const estados: Estado[] = [
  {
    sigla: "BR",
    nome: "Brasil",
    bandeira: "/images/bandeiras/square-rounded/br.svg",
  },
  {
    sigla: "AC",
    nome: "Acre",
    bandeira: "/images/bandeiras/square-rounded/ac.svg",
  },
  {
    sigla: "AL",
    nome: "Alagoas",
    bandeira: "/images/bandeiras/square-rounded/al.svg",
  },
  {
    sigla: "AP",
    nome: "Amapá",
    bandeira: "/images/bandeiras/square-rounded/ap.svg",
  },
  {
    sigla: "AM",
    nome: "Amazonas",
    bandeira: "/images/bandeiras/square-rounded/am.svg",
  },
  {
    sigla: "BA",
    nome: "Bahia",
    bandeira: "/images/bandeiras/square-rounded/ba.svg",
  },
  {
    sigla: "CE",
    nome: "Ceará",
    bandeira: "/images/bandeiras/square-rounded/ce.svg",
  },
  {
    sigla: "DF",
    nome: "Distrito Federal",
    bandeira: "/images/bandeiras/square-rounded/df.svg",
  },
  {
    sigla: "ES",
    nome: "Espírito Santo",
    bandeira: "/images/bandeiras/square-rounded/es.svg",
  },
  {
    sigla: "GO",
    nome: "Goiás",
    bandeira: "/images/bandeiras/square-rounded/go.svg",
  },
  {
    sigla: "MA",
    nome: "Maranhão",
    bandeira: "/images/bandeiras/square-rounded/ma.svg",
  },
  {
    sigla: "MT",
    nome: "Mato Grosso",
    bandeira: "/images/bandeiras/square-rounded/mt.svg",
  },
  {
    sigla: "MS",
    nome: "Mato Grosso do Sul",
    bandeira: "/images/bandeiras/square-rounded/ms.svg",
  },
  {
    sigla: "MG",
    nome: "Minas Gerais",
    bandeira: "/images/bandeiras/square-rounded/mg.svg",
  },
  {
    sigla: "PA",
    nome: "Pará",
    bandeira: "/images/bandeiras/square-rounded/pa.svg",
  },
  {
    sigla: "PB",
    nome: "Paraíba",
    bandeira: "/images/bandeiras/square-rounded/pb.svg",
  },
  {
    sigla: "PR",
    nome: "Paraná",
    bandeira: "/images/bandeiras/square-rounded/pr.svg",
  },
  {
    sigla: "PE",
    nome: "Pernambuco",
    bandeira: "/images/bandeiras/square-rounded/pe.svg",
  },
  {
    sigla: "PI",
    nome: "Piauí",
    bandeira: "/images/bandeiras/square-rounded/pi.svg",
  },
  {
    sigla: "RJ",
    nome: "Rio de Janeiro",
    bandeira: "/images/bandeiras/square-rounded/rj.svg",
  },
  {
    sigla: "RN",
    nome: "Rio Grande do Norte",
    bandeira: "/images/bandeiras/square-rounded/rn.svg",
  },
  {
    sigla: "RS",
    nome: "Rio Grande do Sul",
    bandeira: "/images/bandeiras/square-rounded/rs.svg",
  },
  {
    sigla: "RO",
    nome: "Rondônia",
    bandeira: "/images/bandeiras/square-rounded/ro.svg",
  },
  {
    sigla: "RR",
    nome: "Roraima",
    bandeira: "/images/bandeiras/square-rounded/rr.svg",
  },
  {
    sigla: "SC",
    nome: "Santa Catarina",
    bandeira: "/images/bandeiras/square-rounded/sc.svg",
  },
  {
    sigla: "SP",
    nome: "São Paulo",
    bandeira: "/images/bandeiras/square-rounded/sp.svg",
  },
  {
    sigla: "SE",
    nome: "Sergipe",
    bandeira: "/images/bandeiras/square-rounded/se.svg",
  },
  {
    sigla: "TO",
    nome: "Tocantins",
    bandeira: "/images/bandeiras/square-rounded/to.svg",
  },
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

import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { users, profiles, sessions, subscriptions } from "@/db/schema";

// Tipos base do banco
export type UserType = InferSelectModel<typeof users>;
export type Profile = InferSelectModel<typeof profiles>;
export type Session = InferSelectModel<typeof sessions>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;

// Tipos para inserção
export type NewUser = InferInsertModel<typeof users>;
export type NewProfile = InferInsertModel<typeof profiles>;

// Tipo combinado User + Profile (mais comum no app)
export type UserWithProfile = User & {
  profile: Profile | null;
};

// Tipo seguro para uso no frontend (sem senha/salt)
export type SafeUser = Omit<UserType, "password" | "salt">;

// Tipo combinado com subscrição
export type User = SafeUser & {
  profile: Profile | null;
  subscription: Subscription | null;
};

// Tipo para sessão
export type SessionUser = {
  id: number;
  email: string;
  role: "admin" | "user";
};

// Informações do plano
export interface PlanInfo {
  name: string;
  displayName: string;
  price: number;
  features: string[];
  color: string;
  popular?: boolean;
}

export const PLANS: Record<string, PlanInfo> = {
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

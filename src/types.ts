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

// Tipo seguro para uso no frontend (sem senha/salt)
export type SafeUser = Omit<UserType, "password" | "salt">;

// Tipo combinado User + Profile (mais comum no app)
export type UserWithProfile = SafeUser & {
  profile: Profile;
  subscription?: Subscription;
};

// Tipo combinado com subscrição
export type User = SafeUser & {
  profile?: Profile;
  subscription?: Subscription;
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

export interface Estado {
  sigla: string;
  nome: string;
  bandeira: string;
}
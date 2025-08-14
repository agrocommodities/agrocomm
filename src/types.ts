// src/types.ts (adicionar tipos do Stripe)
import { InferSelectModel } from "drizzle-orm";
import { users, subscriptions } from "@/db/schema";

type FullUser = InferSelectModel<typeof users>;
type FullSubscription = InferSelectModel<typeof subscriptions>;
export type Subscription = InferSelectModel<typeof subscriptions>;

// Tipos para objetos do Stripe
export interface StripeCustomer {
  id: string;
  object: 'customer';
  email: string;
  name?: string;
  deleted?: boolean;
}

export interface StripeProduct {
  id: string;
  object: 'product';
  name: string;
  description?: string;
}

export interface StripePrice {
  id: string;
  object: 'price';
  product: string | StripeProduct;
  unit_amount: number;
  recurring: {
    interval: 'month' | 'year';
    interval_count: number;
  };
}

export interface StripeSubscriptionItem {
  id: string;
  object: 'subscription_item';
  price: StripePrice;
  quantity: number;
}

export interface StripeSubscriptionFromWebhook {
  id: string;
  object: 'subscription';
  customer: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  created: number;
  current_period_start: number;
  current_period_end: number;
  start_date: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
  trial_start?: number;
  trial_end?: number;
  items: {
    data: StripeSubscriptionItem[];
  };
}

export interface StripeInvoice {
  id: string;
  object: 'invoice';
  created: number;
  subscription?: string;
  billing_reason?: string;
}

export interface StripeWebhookEvent {
  id: string;
  object: 'event';
  type: string;
  data: {
    object: StripeSubscriptionFromWebhook | StripeInvoice;
  };
}

// Tipos existentes
export type SessionUser = {
  id: number;
  email: string;
  role: string | null;
};

export type User = Omit<FullUser, "password" | "salt"> | null;
export type LocalSubscription = FullSubscription;

export interface State {
  code: string;
  name: string;
  flag?: string;
}

export interface News {
  title: string;
  url: string;
  source: string;
  summary?: string;
  imageUrl?: string;
}

export interface QuotationClientProps {
  commodity: string;
  states: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  prices: Array<{
    id: number;
    price: number;
    date: string;
    variation: number | null;
    stateCode: string;
    stateName: string;
    cityName: string | null;
  }>;
  availableDates: string[];
  selectedDate: string;
  selectedState: string;
  average: string;
  isSubscribed?: boolean;
}

export interface StripeSubscription {
  id: string;
  object: 'subscription';
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  created: number;
  current_period_start: number;
  current_period_end: number;
  start_date: number;
  customer: string;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number;
        recurring: {
          interval: 'month' | 'year';
        };
        product: {
          id: string;
          name: string;
        };
      };
    }>;
  };
}

export interface UserSubscriptionStatus {
  isSubscribed: boolean;
  user: User | null;
  subscription?: StripeSubscription;
  localSubscription?: LocalSubscription;
}

export interface State {
  code: string;
  name: string;
  flag?: string;
}

export interface News {
  title: string;
  url: string;
  source: string;
  summary?: string;
  imageUrl?: string;
}

export interface QuotationClientProps {
  commodity: string;
  states: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  prices: Array<{
    id: number;
    price: number;
    date: string;
    variation: number | null;
    stateCode: string;
    stateName: string;
    cityName: string | null;
  }>;
  availableDates: string[];
  selectedDate: string;
  selectedState: string;
  average: string;
  isSubscribed?: boolean;
}

export interface StripeSubscription {
  id: string;
  object: 'subscription';
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  created: number;
  current_period_start: number;
  current_period_end: number;
  start_date: number;
  customer: string;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number;
        recurring: {
          interval: 'month' | 'year';
        };
        product: {
          id: string;
          name: string;
        };
      };
    }>;
  };
}

// ATUALIZADO: Tipo para status de assinatura do usuário
export interface UserSubscriptionStatus {
  isSubscribed: boolean;
  user: User | null;
  subscription?: StripeSubscription;
  localSubscription?: Subscription; // Adicionar esta propriedade
}

export interface State {
  code: string;
  name: string;
  flag?: string;
}

export interface News {
  title: string;
  url: string;
  source: string;
  summary?: string;
  imageUrl?: string;
}

export interface QuotationClientProps {
  commodity: string;
  states: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  prices: Array<{
    id: number;
    price: number;
    date: string;
    variation: number | null;
    stateCode: string;
    stateName: string;
    cityName: string | null;
  }>;
  availableDates: string[];
  selectedDate: string;
  selectedState: string;
  average: string;
  isSubscribed?: boolean; // Nova prop
}

export interface StripeSubscription {
  id: string;
  object: 'subscription';
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  created: number;
  current_period_start: number;
  current_period_end: number;
  start_date: number;
  customer: string;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number;
        recurring: {
          interval: 'month' | 'year';
        };
        product: {
          id: string;
          name: string;
        };
      };
    }>;
  };
}

export interface UserSubscriptionStatus {
  isSubscribed: boolean;
  user: User | null;
  subscription?: StripeSubscription; // Manter como optional (undefined)
}
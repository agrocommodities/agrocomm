import { InferSelectModel } from "drizzle-orm";
import { users } from "@/db/schema";

type FullUser = InferSelectModel<typeof users>;
// export type NewUser = InferInsertModel<typeof users>;

// Tipo para sessão
export type SessionUser = {
  id: number;
  email: string;
  role: string | null;
};


export type User = Omit<FullUser, "password" | "salt"> | null;

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
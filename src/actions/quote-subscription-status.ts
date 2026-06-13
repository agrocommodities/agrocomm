"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userQuoteSubscriptions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getUserSubscription } from "@/actions/subscriptions";

export type QuoteSubscriptionStatus = {
  hasSession: boolean;
  canReceiveEmails: boolean;
  subscribed: boolean;
};

export async function getQuoteSubscriptionStatus(
  productId: number,
  cityId: number | null,
): Promise<QuoteSubscriptionStatus> {
  const session = await getSession();

  if (!session) {
    return {
      hasSession: false,
      canReceiveEmails: false,
      subscribed: false,
    };
  }

  const subscription = await getUserSubscription();
  const canReceiveEmails =
    subscription?.status === "active" && subscription.emailBulletins === 1;

  const conditions = [
    eq(userQuoteSubscriptions.userId, session.userId),
    eq(userQuoteSubscriptions.productId, productId),
  ];

  if (cityId !== null) {
    conditions.push(eq(userQuoteSubscriptions.cityId, cityId));
  }

  const [existing] = await db
    .select({ id: userQuoteSubscriptions.id })
    .from(userQuoteSubscriptions)
    .where(and(...conditions))
    .limit(1);

  return {
    hasSession: true,
    canReceiveEmails,
    subscribed: Boolean(existing),
  };
}

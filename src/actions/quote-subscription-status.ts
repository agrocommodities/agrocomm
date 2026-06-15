"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userQuoteSubscriptions, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getUserSubscription } from "@/actions/subscriptions";

export type QuoteSubscriptionStatus = {
  hasSession: boolean;
  canReceiveEmails: boolean;
  hasVerifiedPhone: boolean;
  subscribed: boolean;
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
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
      hasVerifiedPhone: false,
      subscribed: false,
      notifyEmail: false,
      notifyWhatsapp: false,
    };
  }

  const subscription = await getUserSubscription();
  const canReceiveEmails =
    subscription?.status === "active" && subscription.emailBulletins === 1;

  const [user] = await db
    .select({ phoneVerifiedAt: users.phoneVerifiedAt })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const conditions = [
    eq(userQuoteSubscriptions.userId, session.userId),
    eq(userQuoteSubscriptions.productId, productId),
  ];

  if (cityId !== null) {
    conditions.push(eq(userQuoteSubscriptions.cityId, cityId));
  }

  const [existing] = await db
    .select({
      id: userQuoteSubscriptions.id,
      notifyEmail: userQuoteSubscriptions.notifyEmail,
      notifyWhatsapp: userQuoteSubscriptions.notifyWhatsapp,
    })
    .from(userQuoteSubscriptions)
    .where(and(...conditions))
    .limit(1);

  return {
    hasSession: true,
    canReceiveEmails,
    hasVerifiedPhone: Boolean(user?.phoneVerifiedAt),
    subscribed: Boolean(existing),
    notifyEmail: existing?.notifyEmail === 1,
    notifyWhatsapp: existing?.notifyWhatsapp === 1,
  };
}

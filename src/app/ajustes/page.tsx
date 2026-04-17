import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import SettingsForm from "@/components/auth/SettingsForm";
import AvatarUpload from "@/components/auth/AvatarUpload";
import SubscriptionCard from "@/components/SubscriptionCard";
import QuoteSubscriptionManager from "@/components/QuoteSubscriptionManager";
import Breadcrumb from "@/components/Breadcrumb";
import {
  getUserSubscription,
  getUserQuoteSubscriptions,
} from "@/actions/subscriptions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ajustes — AgroComm" };

export default async function AjustesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user] = await db
    .select({
      avatarUrl: users.avatarUrl,
      countryId: users.countryId,
      geoStateId: users.geoStateId,
      geoCityId: users.geoCityId,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const [subscription, quoteSubscriptions] = await Promise.all([
    getUserSubscription(),
    getUserQuoteSubscriptions(),
  ]);

  const hasActivePlan = subscription?.status === "active";

  return (
    <main className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <Breadcrumb items={[{ label: "Ajustes" }]} />
        <h1 className="text-2xl font-bold mb-6 mt-1">Minha conta</h1>

        {/* Subscription */}
        <div className="mb-6">
          <SubscriptionCard subscription={subscription} />
        </div>

        {/* Quote Subscriptions */}
        <div className="mb-6">
          <QuoteSubscriptionManager
            subscriptions={quoteSubscriptions}
            hasActivePlan={hasActivePlan}
          />
        </div>

        {/* Profile */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
          <AvatarUpload
            currentAvatarUrl={user?.avatarUrl ?? null}
            userName={session.name}
          />
          <hr className="border-white/10 my-6" />
          <SettingsForm
            defaultName={session.name}
            defaultEmail={session.email}
            defaultCountryId={user?.countryId ?? null}
            defaultGeoStateId={user?.geoStateId ?? null}
            defaultGeoCityId={user?.geoCityId ?? null}
          />
        </div>
      </div>
    </main>
  );
}

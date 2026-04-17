import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptionPlans } from "@/db/schema";
import { getSession } from "@/lib/auth";
import Breadcrumb from "@/components/Breadcrumb";
import CheckoutClient from "@/components/CheckoutClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Checkout — AgroComm" };

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { slug } = await params;
  const { period: periodParam } = await searchParams;

  const [plan] = await db
    .select({
      id: subscriptionPlans.id,
      slug: subscriptionPlans.slug,
      name: subscriptionPlans.name,
      description: subscriptionPlans.description,
      priceMonthly: subscriptionPlans.priceMonthly,
      priceWeekly: subscriptionPlans.priceWeekly,
      maxClassifieds: subscriptionPlans.maxClassifieds,
      emailBulletins: subscriptionPlans.emailBulletins,
      priceHistory: subscriptionPlans.priceHistory,
      historyDays: subscriptionPlans.historyDays,
      sortOrder: subscriptionPlans.sortOrder,
    })
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.slug, slug))
    .limit(1);

  if (!plan) redirect("/planos");

  const period = periodParam === "weekly" ? "weekly" : "monthly";

  return (
    <main className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-lg px-2">
        <Breadcrumb
          items={[
            { label: "Planos", href: "/planos" },
            { label: `Checkout — ${plan.name}` },
          ]}
        />
        <h1 className="text-2xl font-bold mb-6 mt-1">Finalizar assinatura</h1>
        <CheckoutClient plan={plan} period={period} />
      </div>
    </main>
  );
}

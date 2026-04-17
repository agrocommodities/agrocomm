import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptionPlans } from "@/db/schema";
import { getSession } from "@/lib/auth";
import Modal from "@/components/Modal";
import CheckoutClient from "@/components/CheckoutClient";

export default async function CheckoutModal({
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
    <Modal>
      <h2 className="text-xl font-bold mb-4">Finalizar assinatura</h2>
      <CheckoutClient plan={plan} period={period} isModal />
    </Modal>
  );
}

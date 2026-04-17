import type { Metadata } from "next";
import {
  getSubscriptionPlans,
  getUserSubscription,
} from "@/actions/subscriptions";
import PlanSelector from "@/components/PlanSelector";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = { title: "Planos — AgroComm" };

export default async function PlanosPage() {
  const [plans, subscription] = await Promise.all([
    getSubscriptionPlans(),
    getUserSubscription(),
  ]);

  return (
    <main className="min-h-[80vh] py-8">
      <div className="max-w-5xl mx-auto px-2">
        <Breadcrumb items={[{ label: "Planos" }]} />
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold mb-2">Escolha seu plano</h1>
          <p className="text-white/50 max-w-lg mx-auto">
            Acompanhe cotações, receba boletins personalizados e publique
            anúncios na maior plataforma do agronegócio brasileiro.
          </p>
        </div>
        <PlanSelector plans={plans} currentSubscription={subscription} />
      </div>
    </main>
  );
}

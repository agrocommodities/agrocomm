import Modal from "@/components/Modal";
import {
  getSubscriptionPlans,
  getUserSubscription,
} from "@/actions/subscriptions";
import PlanSelector from "@/components/PlanSelector";

export default async function PlanosModal() {
  const [plans, subscription] = await Promise.all([
    getSubscriptionPlans(),
    getUserSubscription(),
  ]);

  return (
    <Modal>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold mb-2">Escolha seu plano</h2>
        <p className="text-sm text-white/50">
          Acompanhe cotações, receba boletins e publique anúncios.
        </p>
      </div>
      <PlanSelector plans={plans} currentSubscription={subscription} />
    </Modal>
  );
}

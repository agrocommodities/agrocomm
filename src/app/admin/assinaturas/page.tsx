import {
  getAdminSubscriptions,
  getAdminPlans,
  getAlertSettings,
  getSubscriptionStats,
  getAdminUsersForGrant,
} from "@/actions/admin-subscriptions";
import SubscriptionsManager from "@/components/admin/SubscriptionsManager";

export default async function AdminAssinaturasPage() {
  const [subs, plans, alerts, stats, usersForGrant] = await Promise.all([
    getAdminSubscriptions(),
    getAdminPlans(),
    getAlertSettings(),
    getSubscriptionStats(),
    getAdminUsersForGrant(),
  ]);

  return (
    <SubscriptionsManager
      subscriptions={subs}
      plans={plans}
      alertSettings={alerts}
      stats={stats}
      users={usersForGrant}
    />
  );
}

// src/app/(auth)/ajustes/page.tsx
import { SettingsForm } from "@/components/auth/settings";
import { SubscriptionManager } from "@/components/auth/subscription-manager";
import { getCurrentUser } from "@/lib/user";
import { checkUserSubscription } from "@/lib/subscription";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const { isSubscribed, subscription, localSubscription } = await checkUserSubscription();

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Ajustes</h1>
      <p className="mt-2 text-foreground/60 mb-8">
        Gerencie suas informações pessoais e configurações da conta
      </p>
      
      {/* Gestão de Assinatura */}
      {user && (
        <div className="mb-8">
          <SubscriptionManager 
            user={user} 
            isSubscribed={isSubscribed}
            subscription={subscription}
            localSubscription={localSubscription}
          />
        </div>
      )}
      
      {/* Formulário de Configurações */}
      <SettingsForm user={user} />
    </>
  );
}
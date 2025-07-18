import { getCurrentUser } from "@/lib/user";
import { redirect } from "next/navigation";
import ProfileEditForm from "@/components/auth/profile";

export default async function ProfilePage() {
  const user = await getCurrentUser({ withProfile: true, redirectIfNotFound: true });

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="mt-2 text-foreground/60">
            Gerencie suas informações pessoais e configurações da conta
          </p>
        </div>

        <ProfileEditForm user={user} />
      </div>
    </div>
  );
}
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SettingsForm from "@/components/auth/SettingsForm";

export const metadata = { title: "Ajustes — AgroComm" };

export default async function AjustesPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-8">Minha conta</h1>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
          <SettingsForm
            defaultName={session.name}
            defaultEmail={session.email}
          />
        </div>
      </div>
    </main>
  );
}

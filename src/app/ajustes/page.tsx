import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SettingsForm from "@/components/auth/SettingsForm";
import Breadcrumb from "@/components/Breadcrumb";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ajustes — AgroComm" };

export default async function AjustesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Breadcrumb items={[{ label: "Ajustes" }]} />
        <h1 className="text-2xl font-bold mb-8 mt-1">Minha conta</h1>
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

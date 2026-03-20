import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getClassifiedCategories,
  getStatesForClassifieds,
} from "@/actions/classifieds";
import NewClassifiedForm from "@/components/NewClassifiedForm";
import Breadcrumb from "@/components/Breadcrumb";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Novo Anúncio — Classificados AgroComm",
};

export default async function NovoClassificadoPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const [categories, statesList] = await Promise.all([
    getClassifiedCategories(),
    getStatesForClassifieds(),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Classificados", href: "/classificados" },
          { label: "Novo Anúncio" },
        ]}
      />

      <h1 className="text-2xl font-bold mb-6">Publicar Anúncio</h1>

      <NewClassifiedForm categories={categories} states={statesList} />
    </div>
  );
}

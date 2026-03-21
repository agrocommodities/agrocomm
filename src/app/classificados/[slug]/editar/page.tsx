import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getClassifiedBySlug,
  getClassifiedCategories,
  getStatesForClassifieds,
  getCitiesForState,
} from "@/actions/classifieds";
import EditClassifiedForm from "@/components/EditClassifiedForm";
import Breadcrumb from "@/components/Breadcrumb";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar Anúncio — Classificados AgroComm",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditarClassificadoPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { slug } = await params;
  const item = await getClassifiedBySlug(slug);
  if (!item) notFound();

  // Only the owner can edit
  if (item.userId !== session.userId) notFound();

  const [categories, statesList, initialCities] = await Promise.all([
    getClassifiedCategories(),
    getStatesForClassifieds(),
    getCitiesForState(item.stateId),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Classificados", href: "/classificados" },
          { label: item.title, href: `/classificados/${item.slug}` },
          { label: "Editar" },
        ]}
      />

      <h1 className="text-2xl font-bold mb-6">Editar Anúncio</h1>

      <EditClassifiedForm
        classified={{
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          categoryId: item.categoryId,
          stateId: item.stateId,
          cityId: item.cityId,
          images: item.images,
        }}
        categories={categories}
        states={statesList}
        initialCities={initialCities}
      />
    </div>
  );
}

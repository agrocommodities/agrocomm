import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getJobListingBySlug,
  getStatesForJobs,
  getCitiesForJobState,
} from "@/actions/jobs";
import JobListingForm from "@/components/JobListingForm";
import Breadcrumb from "@/components/Breadcrumb";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar Vaga — AgroComm",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditarVagaPage({ params }: Props) {
  const { slug } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const item = await getJobListingBySlug(slug);
  if (!item || item.userId !== session.userId) notFound();

  const [statesList, initialCities] = await Promise.all([
    getStatesForJobs(),
    getCitiesForJobState(item.stateId),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Vagas de Emprego", href: "/vagas" },
          { label: item.title, href: `/vagas/${item.slug}` },
          { label: "Editar" },
        ]}
      />

      <h1 className="text-2xl font-bold mb-6">Editar Publicação</h1>

      <JobListingForm
        states={statesList}
        initialCities={initialCities}
        initial={{
          id: item.id,
          type: item.type as "oferta" | "candidato",
          title: item.title,
          area: item.area,
          description: item.description,
          companyName: item.companyName,
          contractType: item.contractType,
          salaryRange: item.salaryRange,
          positionsCount: item.positionsCount,
          requirements: item.requirements,
          benefits: item.benefits,
          desiredRole: item.desiredRole,
          experienceYears: item.experienceYears,
          availability: item.availability,
          skills: item.skills,
          stateId: item.stateId,
          cityId: item.cityId,
          contactPhone: item.contactPhone,
          contactEmail: item.contactEmail,
        }}
      />
    </div>
  );
}

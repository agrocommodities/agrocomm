import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getStatesForJobs } from "@/actions/jobs";
import JobListingForm from "@/components/JobListingForm";
import Breadcrumb from "@/components/Breadcrumb";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publicar Vaga — AgroComm",
};

export default async function NovaVagaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const defaultType = params.tipo === "candidato" ? "candidato" : "oferta";

  const statesList = await getStatesForJobs();

  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Vagas de Emprego", href: "/vagas" },
          { label: "Publicar" },
        ]}
      />

      <h1 className="text-2xl font-bold mb-6">Publicar Vaga</h1>

      <JobListingForm states={statesList} defaultType={defaultType} />
    </div>
  );
}

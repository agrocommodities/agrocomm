import { getAdminJobListings } from "@/actions/adminJobs";
import JobsManager from "./JobsManager";

export const dynamic = "force-dynamic";

export default async function AdminVagasPage() {
  const data = await getAdminJobListings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Gerenciar Vagas de Emprego</h1>
        <p className="text-sm text-white/50 mt-1">
          {data.total} publicação{data.total !== 1 && "ões"}
        </p>
      </div>
      <JobsManager initialData={data} />
    </div>
  );
}

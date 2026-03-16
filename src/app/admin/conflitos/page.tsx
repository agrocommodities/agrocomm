import { getConflicts } from "@/actions/admin";
import ConflictsManager from "./ConflictsManager";

export const dynamic = "force-dynamic";

export default async function AdminConflictsPage() {
  const conflicts = await getConflicts();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Conflitos de Cotações</h1>
        <p className="text-sm text-white/50 mt-1">
          Cotações com preços divergentes entre fontes diferentes
        </p>
      </div>

      <ConflictsManager initialConflicts={conflicts} />
    </div>
  );
}

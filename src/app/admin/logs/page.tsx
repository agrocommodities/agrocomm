import { getAuditLogs } from "@/actions/adminClassifieds";
import LogsViewer from "./LogsViewer";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const data = await getAuditLogs();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
        <p className="text-sm text-white/50 mt-1">
          Histórico de todas as ações do sistema
        </p>
      </div>
      <LogsViewer initialData={data} />
    </div>
  );
}

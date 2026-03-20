import { getModerationSettings } from "@/actions/adminClassifieds";
import ModerationManager from "./ModerationManager";

export const dynamic = "force-dynamic";

export default async function AdminModeracaoPage() {
  const settings = await getModerationSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Moderação</h1>
        <p className="text-sm text-white/50 mt-1">
          Configure a moderação automática de contatos nos classificados
        </p>
      </div>
      <ModerationManager initialSettings={settings} />
    </div>
  );
}

import {
  getWhatsAppSubscribers,
  getWhatsAppLogs,
  getAllProducts,
  getWhatsAppStats,
} from "@/actions/whatsapp";
import WhatsAppManager from "./WhatsAppManager";

export const dynamic = "force-dynamic";

export default async function AdminWhatsAppPage() {
  const [subscribers, logs, allProducts, stats] = await Promise.all([
    getWhatsAppSubscribers(),
    getWhatsAppLogs(),
    getAllProducts(),
    getWhatsAppStats(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp</h1>
        <p className="text-sm text-white/50 mt-1">
          Gerencie assinantes e envie cotações diárias via WhatsApp
        </p>
      </div>

      <WhatsAppManager
        initialSubscribers={subscribers}
        initialLogs={logs}
        allProducts={allProducts}
        stats={stats}
      />
    </div>
  );
}

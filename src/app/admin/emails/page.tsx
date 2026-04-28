import {
  getEmailConfig,
  getEmailTemplateConfigs,
  getEmailAlertLogs,
} from "@/actions/emails";
import EmailsManager from "./EmailsManager";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  const [config, templates, logs] = await Promise.all([
    getEmailConfig(),
    getEmailTemplateConfigs(),
    getEmailAlertLogs(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">E-mails</h1>
        <p className="text-sm text-white/50 mt-1">
          Configuração SMTP, templates e histórico de envios
        </p>
      </div>

      <EmailsManager
        config={config}
        initialTemplates={templates}
        initialLogs={logs}
      />
    </div>
  );
}

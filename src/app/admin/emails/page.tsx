import {
  getEmailConfig,
  getEmailTemplateConfigs,
  getEmailAlertLogs,
  getBulletinSchedules,
} from "@/actions/emails";
import EmailsManager from "./EmailsManager";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  const [config, templates, logs, bulletinSchedules] = await Promise.all([
    getEmailConfig(),
    getEmailTemplateConfigs(),
    getEmailAlertLogs(),
    getBulletinSchedules(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">E-mails</h1>
        <p className="text-sm text-white/50 mt-1">
          Configuração SMTP, boletins, templates e histórico de envios
        </p>
      </div>

      <EmailsManager
        config={config}
        initialTemplates={templates}
        initialLogs={logs}
        initialBulletinSchedules={bulletinSchedules}
      />
    </div>
  );
}

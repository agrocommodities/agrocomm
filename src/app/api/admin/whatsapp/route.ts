import { getSession, getUserPermissions } from "@/lib/auth";
import { sendDailyQuotesInternal } from "@/actions/whatsapp";

/**
 * POST /api/admin/whatsapp
 *
 * Dispara o envio de cotações via WhatsApp para todos os assinantes ativos.
 * Pode ser chamado pelo admin (autenticado) ou por cron via header Authorization.
 *
 * Uso via cron:
 *   curl -X POST https://agrocomm.com.br/api/admin/whatsapp \
 *     -H "Authorization: Bearer $WHATSAPP_TOKEN"
 */
export async function POST(request: Request) {
  // Tenta auth via session (admin logado)
  const session = await getSession();
  if (session) {
    const perms = await getUserPermissions(session.userId);
    if (!perms.has("admin.access")) {
      return Response.json({ error: "Não autorizado" }, { status: 403 });
    }
  } else {
    // Fallback: auth via Bearer token (para cron)
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token || token !== process.env.WHATSAPP_TOKEN) {
      return Response.json({ error: "Não autorizado" }, { status: 403 });
    }
  }

  try {
    const results = await sendDailyQuotesInternal();
    return Response.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return Response.json({ error: message }, { status: 500 });
  }
}

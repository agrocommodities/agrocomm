const GRAPH_API_VERSION = "v25.0";

function getConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!phoneNumberId || !token) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_TOKEN são obrigatórios",
    );
  }
  return { phoneNumberId, token };
}

type SendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Envia uma mensagem de texto livre via WhatsApp Business API.
 */
export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<SendResult> {
  const { phoneNumberId, token } = getConfig();
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: { message: res.statusText } }));
    return {
      success: false,
      error: err?.error?.message ?? `HTTP ${res.status}`,
    };
  }

  const data = await res.json();
  return {
    success: true,
    messageId: data?.messages?.[0]?.id,
  };
}

/**
 * Formata as cotações para envio via WhatsApp.
 */
export function formatQuotesMessage(
  subscriberName: string,
  quotes: Array<{
    productName: string;
    unit: string;
    city: string;
    state: string;
    price: number;
    variation: number | null;
  }>,
  date: string,
): string {
  const dateFormatted = date.split("-").reverse().join("/");
  const lines = [`*AgroComm - Cotações ${dateFormatted}*`, ""];
  lines.push(`Olá, ${subscriberName}! Suas cotações de hoje:`, "");

  for (const q of quotes) {
    const arrow =
      q.variation != null && q.variation > 0
        ? "📈"
        : q.variation != null && q.variation < 0
          ? "📉"
          : "➡️";
    const variationStr =
      q.variation != null
        ? ` (${q.variation > 0 ? "+" : ""}${q.variation.toFixed(2)}%)`
        : "";
    lines.push(
      `${arrow} *${q.productName}* — ${q.city}/${q.state}`,
      `   ${q.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/${q.unit}${variationStr}`,
      "",
    );
  }

  lines.push("_agrocomm.com.br_");
  return lines.join("\n");
}

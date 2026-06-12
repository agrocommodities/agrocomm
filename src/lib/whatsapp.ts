const GRAPH_API_VERSION = "v25.0";
const WHATSAPP_SEND_INTERVAL_MS = 2 * 60 * 1000;

let sendQueue: Promise<void> = Promise.resolve();
let nextAllowedSendAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSendWindow() {
  const waitMs = Math.max(0, nextAllowedSendAt - Date.now());
  if (waitMs > 0) {
    await sleep(waitMs);
  }
}

function enqueueWhatsAppSend<T>(task: () => Promise<T>): Promise<T> {
  const queuedTask = async () => {
    await waitForSendWindow();

    try {
      return await task();
    } finally {
      nextAllowedSendAt = Date.now() + WHATSAPP_SEND_INTERVAL_MS;
    }
  };

  const result = sendQueue.then(queuedTask, queuedTask);
  sendQueue = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
}

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

async function sendWhatsAppPayload(payload: Record<string, unknown>) {
  return enqueueWhatsAppSend(async () => {
    const { phoneNumberId, token } = getConfig();
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: { message: res.statusText } }));
      return {
        success: false,
        error: err?.error?.message ?? `HTTP ${res.status}`,
      } satisfies SendResult;
    }

    const data = await res.json();
    return {
      success: true,
      messageId: data?.messages?.[0]?.id,
    } satisfies SendResult;
  });
}

/**
 * Envia uma mensagem de texto livre via WhatsApp Business API.
 */
export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<SendResult> {
  return sendWhatsAppPayload({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  });
}

/**
 * Envia código OTP usando template aprovado no WhatsApp Business (Meta).
 */
export async function sendWhatsAppOtpCode(
  to: string,
  otpCode: string,
): Promise<SendResult> {
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
  const templateLanguage =
    process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE ?? "pt_BR";

  if (!templateName) {
    return sendWhatsAppText(
      to,
      `Seu código de confirmação AgroComm é: ${otpCode}. Ele expira em 10 minutos.`,
    );
  }

  return sendWhatsAppPayload({
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLanguage },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: otpCode }],
        },
      ],
    },
  });
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

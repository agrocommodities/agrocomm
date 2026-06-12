import { NextResponse } from "next/server";

function getWebhookVerifyToken() {
  const token = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (!token) {
    throw new Error("WHATSAPP_WEBHOOK_VERIFY_TOKEN não configurado");
  }

  return token;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const verifyToken = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode !== "subscribe" || !challenge) {
      return NextResponse.json(
        { error: "Parâmetros de verificação inválidos" },
        { status: 400 },
      );
    }

    if (verifyToken !== getWebhookVerifyToken()) {
      return NextResponse.json(
        { error: "Token de verificação inválido" },
        { status: 403 },
      );
    }

    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    console.log("WhatsApp webhook recebido:", JSON.stringify(payload));

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// src/app/api/subscription/cancel/route.ts (novo arquivo)
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: "ID da assinatura é obrigatório" }, { status: 400 });
    }

    // Cancelar assinatura no Stripe
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    return NextResponse.json({ 
      success: true, 
      message: "Assinatura cancelada com sucesso",
      subscription 
    });

  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    return NextResponse.json(
      { error: "Erro ao cancelar assinatura" },
      { status: 500 }
    );
  }
}
// src/app/api/subscription/renew/route.ts (novo arquivo)
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

    // Criar sessão de checkout para renovação antecipada
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0].price.id;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      customer: subscription.customer as string,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ajustes?renewed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/ajustes`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Erro ao renovar assinatura:", error);
    return NextResponse.json(
      { error: "Erro ao renovar assinatura" },
      { status: 500 }
    );
  }
}
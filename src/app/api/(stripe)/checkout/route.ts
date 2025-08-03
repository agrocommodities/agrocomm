import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const { priceId } = await request.json();
  if (!priceId) return NextResponse.json({ error: "Price ID is required" }, { status: 400 });
  
  const origin = (await headers()).get("origin") || "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      line_items: [
        {
          quantity: 1,
          price: priceId,
        }
      ],
      mode: "subscription",
      // payment_method_types: ["boleto", "pix", "card"], // somente em produção
      payment_method_types: ["card"],
      return_url: `${origin}/pagamento?session_id={CHECKOUT_SESSION_ID}`
    })

    return NextResponse.json({
      id: session.id,
      client_secret: session.client_secret
    })
  } catch (error) {
    return NextResponse.json(error, { status: 400})
  }
}
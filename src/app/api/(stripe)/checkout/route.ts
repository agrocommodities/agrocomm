import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      line_items: [
        {
          quantity: 1,
          price: process.env.STRIPE_PRICE_BASIC,
        }
      ],
      mode: "subscription",
      // payment_method_types: ["boleto", "pix", "card"], // somente em produção
      payment_method_types: ["card"],
      return_url: `${request.headers.get('origin')}/pagamento?session_id={CHECKOUT_SESSION_ID}`
    })

    return NextResponse.json({
      id: session.id,
      client_secret: session.client_secret
    })
  } catch (error) {
    return NextResponse.json(error, { status: 400})
  }
}
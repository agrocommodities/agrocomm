import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/user";

export async function POST(request: Request) {
  const { priceId, customerData } = await request.json();
  if (!priceId) return NextResponse.json({ error: "Price ID is required" }, { status: 400 });  
  const origin = (await headers()).get("origin") || "http://localhost:3000";
  const user = await getCurrentUser();
  const paymentTypes = process.env.NODE_ENV === "production" ? ["card", "debito", "boleto", "pix"] : ["card"];

  try {
    let customer_email = undefined;
    let customer = undefined;

    // Se o usuário estiver logado, usar seus dados
    if (user) {
      customer_email = user.email;
      
      // Verificar se já existe um cliente no Stripe
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0].id;
      }
    }
    // Se dados foram passados via API, usar eles
    else if (customerData) {
      customer_email = customerData.email;
    }

    const sessionConfig: any = {
      ui_mode: "embedded",
      line_items: [
        {
          quantity: 1,
          price: priceId,
        }
      ],
      mode: "subscription",
      payment_method_types: paymentTypes,
      return_url: `${origin}/pagamento?session_id={CHECKOUT_SESSION_ID}`,
    };

    // Auto-preenchimento quando possível
    if (customer_email) {
      sessionConfig.customer_email = customer_email;
    }

    if (customer) {
      sessionConfig.customer = customer;
      // Se já tem customer, não precisa do customer_email
      delete sessionConfig.customer_email;
    }

    // Dados adicionais para pré-preenchimento
    if (user) {
      sessionConfig.custom_fields = [
        {
          key: "country",
          label: {
            type: "custom",
            custom: "País"
          },
          type: "dropdown",
          dropdown: {
            options: [
              { label: "Brasil", value: "BR" },
              { label: "Portugal", value: "PT" },
              { label: "Estados Unidos", value: "US" },
            ]
          },
          optional: false
        }
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      id: session.id,
      client_secret: session.client_secret
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(error, { status: 400});
  }
}
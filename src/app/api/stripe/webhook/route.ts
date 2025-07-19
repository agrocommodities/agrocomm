// app/api/webhooks/stripe/route.ts
import { Stripe } from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-11-20.acacia', // Use a versão mais recente
});

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  
  try {
    // Verificar idempotência primeiro
    const existingRecord = await checkIfAlreadyProcessed(event.id);
    if (existingRecord) {
      console.log('Evento já processado:', event.id);
      return;
    }

    console.log('Nova subscription criada:', {
      id: subscription.id,
      customer: subscription.customer,
      status: subscription.status,
      // Use o novo formato para períodos
      periodStart: subscription.items.data[0]?.current_period_start,
      periodEnd: subscription.items.data[0]?.current_period_end,
    });

    // Ativar acesso do usuário
    await activateUserAccess(subscription.customer as string);
    
    // Enviar email de boas-vindas
    await sendWelcomeEmail(subscription);
    
    // Marcar como processado
    await markEventAsProcessed(event.id);
    
  } catch (error) {
    console.error('Erro ao processar subscription.created:', error);
    throw error; // Permite retry do Stripe
  }
}

export async function POST(req: Request) {
  let event: Stripe.Event;

  try {
    const headersList = await headers();
    const stripeSignature = headersList.get('stripe-signature');
    
    // ⚠️ CRÍTICO: Use req.text() no App Router, não req.json()
    const body = await req.text();
    
    event = stripe.webhooks.constructEvent(
      body,
      stripeSignature as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log(`❌ Erro na verificação da assinatura: ${errorMessage}`);
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Processar eventos específicos
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event);
      break;
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event);
      break;
    default:
      console.log(`Evento não tratado: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
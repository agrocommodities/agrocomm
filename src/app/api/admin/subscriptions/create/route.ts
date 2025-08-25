
// src/app/api/admin/subscriptions/create/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { getCurrentUser } from '@/lib/user';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, planId, durationMonths } = body;

    if (!userId || !planId || !durationMonths) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes' },
        { status: 400 }
      );
    }

    const price = await stripe.prices.retrieve(planId, {
      expand: ['product'],
    });

    if (!price) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const newSubscription = await db
      .insert(subscriptions)
      .values({
        userId,
        stripeSubscriptionId: `manual_${userId}_${planId}`,
        stripePriceId: planId,
        stripeCustomerId: `manual_${userId}`,
        status: 'active',
        planName: (price.product as any).name,
        planPrice: price.unit_amount || 0,
        planInterval: price.recurring?.interval || 'month',
        firstSubscriptionDate: now.toISOString(),
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: endDate.toISOString(),
        lastPaymentDate: now.toISOString(),
      })
      .returning();

    return NextResponse.json(newSubscription[0]);
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

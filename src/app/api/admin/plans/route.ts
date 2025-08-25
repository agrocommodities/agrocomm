
// src/app/api/admin/plans/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    const plans = prices.data.map((price) => ({
      id: price.id,
      name: (price.product as any).name,
      price: price.unit_amount || 0,
    }));

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Erro ao carregar planos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

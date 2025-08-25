
// src/app/api/admin/subscriptions/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions, users } from '@/db/schema';
import { getCurrentUser } from '@/lib/user';
import { and, count, eq, or, ilike } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const search = searchParams.get('search') || '';
    const limit = 10;
    const offset = (page - 1) * limit;

    const where = search
      ? or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(subscriptions.status, `%${search}%`)
        )
      : undefined;

    const subscriptionsData = await db
      .select({
        id: subscriptions.id,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        plan: {
          id: subscriptions.stripePriceId,
          name: subscriptions.planName,
          price: subscriptions.planPrice,
        },
        status: subscriptions.status,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        createdAt: subscriptions.createdAt,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .where(where)
      .limit(limit)
      .offset(offset);

    const totalSubscriptions = await db
      .select({ value: count() })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .where(where);

    const totalPages = Math.ceil(totalSubscriptions[0].value / limit);

    return NextResponse.json({
      subscriptions: subscriptionsData,
      totalPages,
    });
  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/user';
import { and, count, eq, ilike } from 'drizzle-orm';

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
      ? ilike(users.name, `%${search}%`)
      : undefined;

    const usersData = await db.query.users.findMany({
      where: where,
      with: {
        subscriptions: true,
      },
      limit: limit,
      offset: offset,
    });

    const totalUsers = await db
      .select({ value: count() })
      .from(users)
      .where(where);

    const totalPages = Math.ceil(totalUsers[0].value / limit);

    return NextResponse.json({
      users: usersData,
      totalPages,
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

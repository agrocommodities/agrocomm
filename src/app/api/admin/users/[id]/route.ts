
// src/app/api/admin/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/user';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const userId = parseInt(params.id, 10);
    const body = await request.json();

    const { role, verified } = body;

    const updatedFields: Partial<typeof users.$inferInsert> = {};

    if (role) {
      updatedFields.role = role;
    }

    if (typeof verified === 'boolean') {
      updatedFields.verified = verified;
    }

    if (Object.keys(updatedFields).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    const updatedUser = await db
      .update(users)
      .set(updatedFields)
      .where(eq(users.id, userId))
      .returning();

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error(`Erro ao atualizar usuário ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const userId = parseInt(params.id, 10);

    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Não é possível deletar a si mesmo' },
        { status: 400 }
      );
    }

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error(`Erro ao deletar usuário ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

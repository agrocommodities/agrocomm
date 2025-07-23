import { cookies } from "next/headers";
import { getUserFromSession } from "@/lib/session";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import type { User, SessionUser } from "@/types";

export async function getUserById(id: string) {
  const userId = parseInt(id, 10);
  if (!userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      profile: true,
      subscription: true,
    },
    columns: {
      password: false,
      salt: false,
    },
  });

  // Retornar no formato esperado pelos componentes existentes
  // return {
  //   id: user.id,
  //   email: user.email,
  //   role: user.role,
  //   name: user.profile?.name || null,
  //   username: user.profile?.username || null,
  //   createdAt: user.createdAt,
  //   updatedAt: user.updatedAt,
  // };

  return user || null;
}

// Função simplificada que sempre busca todos os dados
async function getUserFromDb(id: number): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      profile: true,
      subscription: true,
    },
    columns: {
      password: false,
      salt: false,
    },
  });

  return user || null;
}

// Sobrecargas simplificadas
function _getCurrentUser(options: {
  sessionOnly?: false;
  redirectIfNotFound: true;
}): Promise<User>;

function _getCurrentUser(options?: {
  sessionOnly?: false;
  redirectIfNotFound?: false;
}): Promise<User | null>;

function _getCurrentUser(options: {
  sessionOnly: true;
  redirectIfNotFound?: boolean;
}): Promise<SessionUser | null>;

// Implementação
async function _getCurrentUser({
  sessionOnly = false,
  redirectIfNotFound = false,
} = {}) {
  const sessionUser = await getUserFromSession(await cookies());

  if (!sessionUser) {
    if (redirectIfNotFound) return redirect("/entrar");
    return null;
  }

  // Se só precisa dados da sessão, retorna direto
  if (sessionOnly) {
    return sessionUser;
  }

  // Sempre busca todos os dados do usuário
  const fullUser = await getUserFromDb(sessionUser.id);
  if (!fullUser) {
    if (redirectIfNotFound) return redirect("/entrar");
    return null;
  }

  return fullUser;
}

export const getCurrentUser = cache(_getCurrentUser);
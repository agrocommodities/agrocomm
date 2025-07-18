import { cookies } from "next/headers";
import { getUserFromSession } from "@/lib/session";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import type { SafeUserWithProfile, SafeUserWithProfileAndSubscription, SessionUser } from "@/types";

// Função para buscar usuário completo do banco
// async function getUserFromDb(id: number): Promise<SafeUserWithProfile | null> {
//   const result = await db.query.users.findFirst({
//     where: eq(users.id, id),
//     with: {
//       profile: true,
//     },
//     columns: {
//       password: false,
//       salt: false,
//     },
//   });

//   return result || null;
// }

// Atualize a função getUserFromDb
async function getUserFromDb(id: number, withSubscription = false) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      profile: true,
      ...(withSubscription && { subscription: true }),
    },
    columns: {
      password: false,
      salt: false,
    },
  });

  return result || null;
}

// Sobrecargas para tipos precisos
function _getCurrentUser(options: {
  withProfile: true;
  redirectIfNotFound: true;
}): Promise<SafeUserWithProfile>;

function _getCurrentUser(options: {
  withProfile: true;
  redirectIfNotFound?: false;
}): Promise<SafeUserWithProfile | null>;

function _getCurrentUser(options: {
  withProfile?: false;
  redirectIfNotFound: true;
}): Promise<SessionUser>;

function _getCurrentUser(options?: {
  withProfile?: false;
  redirectIfNotFound?: false;
}): Promise<SessionUser | null>;

// Adicione uma nova sobrecarga
function _getCurrentUser(options: {
  withProfile: true;
  withSubscription: true;
  redirectIfNotFound?: boolean;
}): Promise<SafeUserWithProfileAndSubscription>;

// Implementação
async function _getCurrentUser({
  withProfile = false,
  redirectIfNotFound = false,
} = {}) {
  const sessionUser = await getUserFromSession(await cookies());

  if (!sessionUser) {
    if (redirectIfNotFound) return redirect("/entrar");
    return null;
  }

  if (withProfile) {
    const fullUser = await getUserFromDb(sessionUser.id);
    if (!fullUser) {
      if (redirectIfNotFound) return redirect("/entrar");
      return null;
    }
    return fullUser;
  }

  return sessionUser;
}

export const getCurrentUser = cache(_getCurrentUser);
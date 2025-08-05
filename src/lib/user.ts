import { eq } from "drizzle-orm";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSession, removeUserFromSession } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";

async function getUserFromDb(id: number) {
  return await db.query.users.findFirst({
    columns: { password: false, salt: false },
    where: eq(users.id, id),
  });
}

async function _getCurrentUser(redirectIfNotFound = false) {
  const cookieStore = await cookies();
  const sessionUser = await getUserFromSession(cookieStore);

  if (!sessionUser) {
    if (redirectIfNotFound) return redirect("/entrar");
    return null;
  }

  try {
    const fullUser = await getUserFromDb(sessionUser.id);
    
    if (!fullUser) {
      console.warn(`User ID ${sessionUser.id} not found in database - clearing session`);
      
      // Remover sessão inválida automaticamente
      await removeUserFromSession(cookieStore);
      
      if (redirectIfNotFound) return redirect("/entrar");
      return null;
    }

    return fullUser;
  } catch (error) {
    console.error("Database error while fetching user:", error);
    
    // Em caso de erro de DB, também limpar a sessão
    await removeUserFromSession(cookieStore);
    
    if (redirectIfNotFound) return redirect("/entrar");
    return null;
  }
}

export const getCurrentUser = cache(_getCurrentUser);
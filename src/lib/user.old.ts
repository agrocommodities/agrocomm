import { eq } from "drizzle-orm";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";

async function getUserFromDb(id: number) {
  return await db.query.users.findFirst({
    // columns: { id: true, email: true, role: true, name: true, username: true },
    columns: { password: false, salt: false },
    where: eq(users.id, id),
  });
}

async function _getCurrentUser(redirectIfNotFound = false) {
  const sessionUser = await getUserFromSession(await cookies());

  if (!sessionUser) {
    if (redirectIfNotFound) return redirect("/entrar");
    return null;
  }

  const fullUser = await getUserFromDb(sessionUser.id);
  
  if (!fullUser) {
    console.error("User not found in database");
    if (redirectIfNotFound) return redirect("/entrar");
    return null;
  }

  return fullUser;
}

export const getCurrentUser = cache(_getCurrentUser);
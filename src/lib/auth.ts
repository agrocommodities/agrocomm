import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  permissions,
  rolePermissions,
  userPermissions,
} from "@/db/schema";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production",
);

export interface SessionPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  roleId: number | null;
  avatarUrl: string | null;
  isImpersonating?: boolean;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const session = payload as unknown as SessionPayload;
    session.isImpersonating = !!cookieStore.get("impersonating_from")?.value;
    return session;
  } catch {
    return null;
  }
}

export const SUPER_ADMIN_EMAIL = "agrocomm@agrocomm.com.br";

export async function getUserPermissions(userId: number): Promise<Set<string>> {
  const [user] = await db
    .select({ roleId: users.roleId, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Super admin always has all permissions — cannot be restricted
  if (user?.email === SUPER_ADMIN_EMAIL) {
    const allPerms = await db
      .select({ key: permissions.key })
      .from(permissions);
    return new Set(allPerms.map((p) => p.key));
  }

  const perms = new Set<string>();

  if (user?.roleId) {
    const rolePerms = await db
      .select({ key: permissions.key })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));
    for (const p of rolePerms) perms.add(p.key);
  }

  const userPerms = await db
    .select({ key: permissions.key, granted: userPermissions.granted })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(eq(userPermissions.userId, userId));

  for (const p of userPerms) {
    if (p.granted) perms.add(p.key);
    else perms.delete(p.key);
  }

  return perms;
}

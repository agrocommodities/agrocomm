import { z } from "zod";
import { SignJWT, jwtVerify } from "jose";

const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // 7 days
const COOKIE_SESSION_KEY = "session-token";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_TOKEN_SECRET!);
const sessionSchema = z.object({ id: z.int(), role: z.string() });

type UserSession = z.infer<typeof sessionSchema>;
export type Cookies = {
  set: (
    key: string,
    value: string,
    options: {
      secure?: boolean
      httpOnly?: boolean
      sameSite?: "strict" | "lax"
      expires?: number
    }
  ) => void
  get: (key: string) => { name: string; value: string } | undefined
  delete: (key: string) => void
}

export async function getUserFromSession(cookies: Pick<Cookies, "get">) {
  const sessionToken = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionToken) return null;

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET, { algorithms: ["HS256"] });
    if (!payload) return null;
    const { success, data } = sessionSchema.safeParse(payload);
    return success ? data : null;
  } catch (error) {
    console.error("Error verifying JWT:", error);
    return null;
  }
}

export async function updateUserSessionData(user: UserSession, cookies: Pick<Cookies, "get" | "set">) {
  await createUserSession(user, cookies);
}

export async function createUserSession(user: UserSession, cookies: Pick<Cookies, "set">) {
  const validatedUser = sessionSchema.parse(user);

  const token = await new SignJWT(validatedUser)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_EXPIRATION_SECONDS)
    .sign(JWT_SECRET);

  setCookie(token, cookies);
}

export async function updateUserSessionExpiration(cookies: Pick<Cookies, "get" | "set">) {
  const user = await getUserFromSession(cookies);
  if (user) await createUserSession(user, cookies);
}

export async function removeUserFromSession(cookies: Pick<Cookies, "delete">) {
  cookies.delete(COOKIE_SESSION_KEY);
}

function setCookie(token: string, cookies: Pick<Cookies, "set">) {
  cookies.set(COOKIE_SESSION_KEY, token, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000,
  });
}

// Adicionar no final do arquivo src/lib/session.ts
export async function validateAndCleanSession(cookies: Pick<Cookies, "get" | "delete">) {
  const sessionToken = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionToken) return null;

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET, { algorithms: ["HS256"] });
    if (!payload) {
      cookies.delete(COOKIE_SESSION_KEY);
      return null;
    }

    const { success, data } = sessionSchema.safeParse(payload);
    if (!success) {
      cookies.delete(COOKIE_SESSION_KEY);
      return null;
    }

    // Verificar se o usuário ainda existe no banco
    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const user = await db.query.users.findFirst({
      columns: { id: true },
      where: eq(users.id, data.id),
    });

    if (!user) {
      console.warn(`Cleaning invalid session for user ID: ${data.id}`);
      cookies.delete(COOKIE_SESSION_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error validating session:", error);
    cookies.delete(COOKIE_SESSION_KEY);
    return null;
  }
}
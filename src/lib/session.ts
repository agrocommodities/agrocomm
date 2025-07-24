import { z } from "zod";
import { jwtVerify } from "jose";
import { createToken } from "@/lib/tokens";
import type { SessionUser } from "@/types";
import { cookies as NextCookies } from "next/headers";

const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7;
const COOKIE_SESSION_KEY = "session-token";
const JWT_SECRET = getJWTSecret();

export const Roles = ["admin", "user", "guest"] as const;

const sessionSchema = z.object({
  id: z.number(),
  email: z.email(),
  role: z.enum(Roles),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type Cookies = {
  set: (
    key: string,
    value: string,
    options: {
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "strict" | "lax";
      expires?: number;
    }
  ) => void;
  get: (key: string) => { name: string; value: string } | undefined;
  delete: (key: string) => void;
};

// ✅ Melhorar a gestão do secret
function getJWTSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não está definido nas variáveis de ambiente");
  return new TextEncoder().encode(secret);
}

export async function getUserFromSession(
  cookies: Pick<Cookies, "get">
): Promise<SessionUser | null> {
  
  const sessionToken = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionToken) return null;
  console.log("Token recebido:", sessionToken);

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    console.log("Payload decodificado:", payload);

    const { success, data } = sessionSchema.safeParse(payload);
    return success ? data : null;
  } catch (error) {
    console.error("Error verifying JWT:", error);
    return null;
  }
}

export async function createSession(
  user: SessionUser,
  cookies: Pick<Cookies, "set">
) {
  const oldCookies = await NextCookies();
  if (oldCookies.get(COOKIE_SESSION_KEY)) {
    oldCookies.delete(COOKIE_SESSION_KEY);
  }
  const validatedUser = sessionSchema.parse(user);
  const token = await createToken(validatedUser);
  setCookie(token, cookies);
}

function setCookie(token: string, cookies: Pick<Cookies, "set">) {
  cookies.set(COOKIE_SESSION_KEY, token, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000,
  });
}

export async function updateUserSessionExpiration(cookies: Pick<Cookies, "get" | "set">) {
  const user = await getUserFromSession(cookies);
  if (user) await createSession(user, cookies);
}

export async function removeSession(cookies: Pick<Cookies, "delete">) {
  cookies.delete(COOKIE_SESSION_KEY);
}
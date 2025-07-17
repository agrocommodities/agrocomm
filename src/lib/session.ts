import { roles } from "@/db/schema";
import { z } from "zod";
import { SignJWT, jwtVerify } from "jose";

const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // Sete dias em segundos
const COOKIE_SESSION_KEY = "session-token";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_change_in_production");

const sessionSchema = z.object({ id: z.number(), role: z.enum(roles) });
type UserSession = z.infer<typeof sessionSchema>;

function setCookie(token: string, cookies: Pick<Cookies, "set">) {
  cookies.set(COOKIE_SESSION_KEY, token, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000,
  })
}

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

export async function getUserFromSession(cookies: Pick<Cookies, "get">) {
  const sessionToken = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionToken) return null;

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const { success, data } = sessionSchema.safeParse(payload);
    return success ? data : null;
  } catch (error) {
    console.error("Error verifying JWT:", error);
    return null;
  }
}

export async function updateUserSessionData(
  user: UserSession,
  cookies: Pick<Cookies, "get" | "set">
) {
  // Substituir a sessão atual com uma nova contendo os dados atualizados
  await createSession(user, cookies);
}

export async function createSession(
  user: UserSession,
  cookies: Pick<Cookies, "set">
) {
  const validatedUser = sessionSchema.parse(user);

  // Criar um JWT com os dados do usuário
  const token = await new SignJWT(validatedUser)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(Date.now() / 1000) + SESSION_EXPIRATION_SECONDS
    )
    .sign(JWT_SECRET);

  setCookie(token, cookies);
}

export async function updateUserSessionExpiration(
  cookies: Pick<Cookies, "get" | "set">
) {
  const user = await getUserFromSession(cookies);
  if (user) {
    await createSession(user, cookies);
  }
}

export async function removeSession(cookies: Pick<Cookies, "delete">) {
  cookies.delete(COOKIE_SESSION_KEY);
}

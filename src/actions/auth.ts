"use server";

import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { validateTurnstileToken } from "next-turnstile";
import { db } from "@/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { signSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { logAction } from "@/lib/moderation";
import { sendEmailVerificationEmail } from "@/lib/email";

type AuthState =
  | { error: string; fields?: Record<string, string> }
  | { success: true }
  | { pendingVerification: true; email: string }
  | null;
type ProfileState = { error?: string; success?: boolean } | null;

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fields = { email };

  if (!email || !password)
    return { error: "Preencha todos os campos.", fields };

  const reqHeaders = await headers();
  const ipAddress =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    reqHeaders.get("x-real-ip") ??
    undefined;
  const userAgent = reqHeaders.get("user-agent") ?? undefined;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    await logAction("login_failed", {
      details: JSON.stringify({ email }),
      ipAddress,
      userAgent,
    });
    return { error: "E-mail ou senha inválidos.", fields };
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    await logAction("login_failed", {
      userId: user.id,
      details: JSON.stringify({ email }),
      ipAddress,
      userAgent,
    });
    return { error: "E-mail ou senha inválidos.", fields };
  }

  if (!user.emailVerified) {
    return {
      error:
        "Sua conta ainda não foi ativada. Verifique seu e-mail para ativar a conta.",
      fields,
    };
  }

  const token = await signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roleId: user.roleId,
    avatarUrl: user.avatarUrl ?? null,
  });
  await setSessionCookie(token);
  await logAction("login_success", { userId: user.id, ipAddress, userAgent });
  return { success: true };
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const fields = { name, email };

  if (!name || !email || !password)
    return { error: "Preencha todos os campos.", fields };

  if (process.env.NODE_ENV !== "development") {
    const turnstileToken = formData.get("cf-turnstile-response");
    if (!turnstileToken || typeof turnstileToken !== "string") {
      return {
        error: "Verificação de segurança ausente. Tente novamente.",
        fields,
      };
    }
    const turnstileResult = await validateTurnstileToken({
      token: turnstileToken,
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
    });
    if (!turnstileResult.success) {
      return {
        error: "Falha na verificação de segurança. Tente novamente.",
        fields,
      };
    }
  }

  if (password.length < 8)
    return { error: "A senha deve ter no mínimo 8 caracteres.", fields };
  if (password !== confirm)
    return { error: "As senhas não coincidem.", fields };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) return { error: "Este e-mail já está cadastrado.", fields };

  const passwordHash = await hashPassword(password);
  const [newUser] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning({ id: users.id });

  // Generate email verification token (24h expiry)
  const verificationToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await db.insert(emailVerificationTokens).values({
    userId: newUser.id,
    token: verificationToken,
    expiresAt,
  });

  try {
    await sendEmailVerificationEmail(email, name, verificationToken);
  } catch {
    // Email sending failed but account was created
  }

  await logAction("register", {
    userId: newUser.id,
    details: JSON.stringify({ name, email }),
  });
  return { pendingVerification: true, email };
}

export async function logoutAction() {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (session) await logAction("logout", { userId: session.userId });
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return { error: "Não autenticado." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name || !email) return { error: "Nome e e-mail são obrigatórios." };

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) return { error: "Usuário não encontrado." };

  const avatarUrl = user.avatarUrl ?? null;

  if (email !== user.email) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) return { error: "Este e-mail já está cadastrado." };
  }

  const updates: {
    name: string;
    email: string;
    passwordHash?: string;
    countryId?: number | null;
    geoStateId?: number | null;
    geoCityId?: number | null;
  } = {
    name,
    email,
  };

  // Address fields
  const countryIdRaw = formData.get("countryId");
  const geoStateIdRaw = formData.get("geoStateId");
  const geoCityIdRaw = formData.get("geoCityId");
  updates.countryId = countryIdRaw ? Number(countryIdRaw) : null;
  updates.geoStateId = geoStateIdRaw ? Number(geoStateIdRaw) : null;
  updates.geoCityId = geoCityIdRaw ? Number(geoCityIdRaw) : null;

  if (newPassword) {
    if (!currentPassword)
      return { error: "Informe a senha atual para alterá-la." };
    const valid = await verifyPassword(user.passwordHash, currentPassword);
    if (!valid) return { error: "Senha atual incorreta." };
    if (newPassword.length < 8)
      return { error: "A nova senha deve ter no mínimo 8 caracteres." };
    if (newPassword !== confirmPassword)
      return { error: "As novas senhas não coincidem." };
    updates.passwordHash = await hashPassword(newPassword);
  }

  await db.update(users).set(updates).where(eq(users.id, session.userId));

  const token = await signSession({
    userId: session.userId,
    email,
    name,
    role: user.role,
    roleId: user.roleId,
    avatarUrl,
  });
  await setSessionCookie(token);

  return { success: true };
}

export type AvatarState = {
  error?: string;
  success?: boolean;
  avatarUrl?: string | null;
} | null;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export async function uploadAvatarAction(
  _prev: AvatarState,
  formData: FormData,
): Promise<AvatarState> {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return { error: "Não autenticado." };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Selecione uma imagem." };

  if (!ALLOWED_TYPES.includes(file.type))
    return { error: "Formato inválido. Use JPG, PNG ou WebP." };

  if (file.size > MAX_SIZE)
    return { error: "Imagem muito grande. Máximo 2 MB." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const dir = join(
    process.cwd(),
    "public",
    "images",
    "avatars",
    String(session.userId),
  );

  try {
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);
  } catch {
    return { error: "Erro ao salvar imagem. Tente novamente." };
  }

  const avatarUrl = `/images/avatars/${session.userId}/${filename}`;

  // Remove old avatar file if exists
  if (session.avatarUrl) {
    const oldPath = join(process.cwd(), "public", session.avatarUrl);
    await rm(oldPath, { force: true }).catch(() => {});
  }

  await db.update(users).set({ avatarUrl }).where(eq(users.id, session.userId));

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) return { error: "Usuário não encontrado." };

  const token = await signSession({
    userId: session.userId,
    email: user.email,
    name: user.name,
    role: user.role,
    roleId: user.roleId,
    avatarUrl,
  });
  await setSessionCookie(token);

  return { success: true, avatarUrl };
}

export async function resetAvatarAction(): Promise<AvatarState> {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return { error: "Não autenticado." };

  // Remove avatar directory
  if (session.avatarUrl) {
    const dir = join(
      process.cwd(),
      "public",
      "images",
      "avatars",
      String(session.userId),
    );
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }

  await db
    .update(users)
    .set({ avatarUrl: null })
    .where(eq(users.id, session.userId));

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) return { error: "Usuário não encontrado." };

  const token = await signSession({
    userId: session.userId,
    email: user.email,
    name: user.name,
    role: user.role,
    roleId: user.roleId,
    avatarUrl: null,
  });
  await setSessionCookie(token);

  return { success: true, avatarUrl: null };
}

"use server";

import { randomBytes } from "node:crypto";
import { eq, and, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/email";

type RequestState = { error?: string; success?: boolean } | null;
type ResetState =
  | { error: string; fields?: Record<string, string> }
  | { success: true }
  | null;

export async function requestPasswordReset(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) return { error: "Informe seu e-mail." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "E-mail inválido." };

  // Always return success to prevent email enumeration
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) return { success: true };

  // Rate limit: max 3 active tokens
  const now = new Date().toISOString();
  const existingTokens = await db
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      ),
    );

  if (existingTokens.length >= 3) {
    return { success: true };
  }

  // Invalidate previous unused tokens so only the latest link works
  if (existingTokens.length > 0) {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt),
        ),
      );
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 60 minutes

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  try {
    await sendPasswordResetEmail(user.email, user.name, token);
  } catch {
    // Email sending failed but token was created — don't expose the error
  }

  return { success: true };
}

export async function resetPassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) return { error: "Token de redefinição inválido." };
  if (!password) return { error: "Informe a nova senha." };
  if (password.length < 8)
    return { error: "A senha deve ter no mínimo 8 caracteres." };
  if (password !== confirm) return { error: "As senhas não coincidem." };

  const now = new Date().toISOString();

  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!resetToken) {
    // Check why the token wasn't found to give a specific error
    const [existingToken] = await db
      .select({
        usedAt: passwordResetTokens.usedAt,
        expiresAt: passwordResetTokens.expiresAt,
      })
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (!existingToken) {
      return { error: "Link de redefinição inválido. Solicite um novo." };
    }
    if (existingToken.usedAt) {
      return {
        error: "Este link já foi utilizado. Solicite um novo se necessário.",
      };
    }
    return { error: "Link expirado. Solicite um novo." };
  }

  const passwordHash = await hashPassword(password);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, resetToken.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(passwordResetTokens.id, resetToken.id));

  return { success: true };
}

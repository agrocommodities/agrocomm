"use server";

import { randomBytes } from "node:crypto";
import { eq, and, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { sendEmailVerificationEmail } from "@/lib/email";

type VerifyState = { error: string } | { success: true } | null;

type ResendState = { error: string } | { success: true } | null;

export async function verifyEmailAction(token: string): Promise<VerifyState> {
  if (!token) return { error: "Token de ativação inválido." };

  const now = new Date().toISOString();

  const [verificationToken] = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, token),
        isNull(emailVerificationTokens.usedAt),
        gt(emailVerificationTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!verificationToken) {
    const [existingToken] = await db
      .select({
        usedAt: emailVerificationTokens.usedAt,
        expiresAt: emailVerificationTokens.expiresAt,
      })
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token))
      .limit(1);

    if (!existingToken) {
      return { error: "Link de ativação inválido." };
    }
    if (existingToken.usedAt) {
      return {
        error: "Este link já foi utilizado. Sua conta pode já estar ativa.",
      };
    }
    return { error: "Link expirado. Solicite um novo e-mail de ativação." };
  }

  // Mark token as used
  await db
    .update(emailVerificationTokens)
    .set({ usedAt: now })
    .where(eq(emailVerificationTokens.id, verificationToken.id));

  // Activate user
  await db
    .update(users)
    .set({ emailVerified: 1 })
    .where(eq(users.id, verificationToken.userId));

  return { success: true };
}

export async function resendVerificationAction(
  _prev: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) return { error: "Informe seu e-mail." };

  // Always return success to prevent email enumeration
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || user.emailVerified) return { success: true };

  // Rate limit: max 3 active tokens
  const now = new Date().toISOString();
  const existingTokens = await db
    .select({ id: emailVerificationTokens.id })
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.userId, user.id),
        isNull(emailVerificationTokens.usedAt),
        gt(emailVerificationTokens.expiresAt, now),
      ),
    );

  if (existingTokens.length >= 3) return { success: true };

  // Invalidate previous unused tokens
  if (existingTokens.length > 0) {
    await db
      .update(emailVerificationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(emailVerificationTokens.userId, user.id),
          isNull(emailVerificationTokens.usedAt),
        ),
      );
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  try {
    await sendEmailVerificationEmail(user.email, user.name, token);
  } catch {
    // Email sending failed but token was created
  }

  return { success: true };
}

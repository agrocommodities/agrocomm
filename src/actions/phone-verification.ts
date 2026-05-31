"use server";

import { and, desc, eq, gt, isNotNull, isNull, ne } from "drizzle-orm";
import { randomInt, createHash } from "node:crypto";
import { db } from "@/db";
import { phoneVerificationCodes, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import {
  maskPhoneForDisplay,
  validatePhoneInput,
  type PhoneValidationResult,
} from "@/lib/phone";
import { sendWhatsAppOtpCode } from "@/lib/whatsapp";

const OTP_TTL_MINUTES = 10;
const OTP_RESEND_SECONDS = 45;
const OTP_MAX_ATTEMPTS = 5;

type RequestOtpInput = {
  countryCode: string;
  areaCode: string;
  localNumber: string;
};

type VerifyOtpInput = RequestOtpInput & {
  otpCode: string;
};

type OtpActionResult =
  | { success: true; message: string; expiresAt?: string }
  | { success: false; error: string };

function buildOtpHash(code: string): string {
  const secret = process.env.JWT_SECRET ?? "agrocomm-otp";
  return createHash("sha256").update(`${code}:${secret}`).digest("hex");
}

function nowDate() {
  return new Date();
}

function getExpiresAt(baseDate: Date): string {
  return new Date(baseDate.getTime() + OTP_TTL_MINUTES * 60_000).toISOString();
}

function getCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function getValidationResult(input: RequestOtpInput): PhoneValidationResult {
  return validatePhoneInput(
    input.countryCode,
    input.areaCode,
    input.localNumber,
  );
}

export async function requestWhatsAppPhoneOtpAction(
  input: RequestOtpInput,
): Promise<OtpActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado." };

  const validation = getValidationResult(input);
  if (!validation.ok) {
    return { success: false, error: validation.error };
  }

  const [existingOwner] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.phoneE164, validation.e164),
        ne(users.id, session.userId),
        isNotNull(users.phoneVerifiedAt),
      ),
    )
    .limit(1);

  if (existingOwner) {
    return {
      success: false,
      error: "Este telefone já está vinculado a outra conta.",
    };
  }

  const [latestPending] = await db
    .select({
      id: phoneVerificationCodes.id,
      createdAt: phoneVerificationCodes.createdAt,
    })
    .from(phoneVerificationCodes)
    .where(
      and(
        eq(phoneVerificationCodes.userId, session.userId),
        eq(phoneVerificationCodes.phoneE164, validation.e164),
        isNull(phoneVerificationCodes.verifiedAt),
        gt(phoneVerificationCodes.expiresAt, nowDate().toISOString()),
      ),
    )
    .orderBy(desc(phoneVerificationCodes.createdAt))
    .limit(1);

  if (latestPending) {
    const createdAtMs = new Date(latestPending.createdAt).getTime();
    if (!Number.isNaN(createdAtMs)) {
      const secondsFromLastSend = Math.floor((Date.now() - createdAtMs) / 1000);
      if (secondsFromLastSend < OTP_RESEND_SECONDS) {
        return {
          success: false,
          error: `Aguarde ${OTP_RESEND_SECONDS - secondsFromLastSend}s para reenviar o código.`,
        };
      }
    }
  }

  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return { success: false, error: "Usuário não encontrado." };
  }

  const otpCode = getCode();
  const createdAt = nowDate();
  const expiresAt = getExpiresAt(createdAt);

  const [created] = await db
    .insert(phoneVerificationCodes)
    .values({
      userId: session.userId,
      phoneE164: validation.e164,
      countryCode: validation.countryCode,
      nationalNumber: validation.nationalNumber,
      codeHash: buildOtpHash(otpCode),
      expiresAt,
      attempts: 0,
    })
    .returning({ id: phoneVerificationCodes.id });

  const sendResult = await sendWhatsAppOtpCode(validation.e164, otpCode);

  if (!sendResult.success) {
    await db
      .delete(phoneVerificationCodes)
      .where(eq(phoneVerificationCodes.id, created.id));

    return {
      success: false,
      error:
        sendResult.error ??
        "Não foi possível enviar o código por WhatsApp. Tente novamente.",
    };
  }

  return {
    success: true,
    message: `Código enviado para ${maskPhoneForDisplay(validation.e164)}.`,
    expiresAt,
  };
}

export async function verifyWhatsAppPhoneOtpAction(
  input: VerifyOtpInput,
): Promise<OtpActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado." };

  const validation = getValidationResult(input);
  if (!validation.ok) {
    return { success: false, error: validation.error };
  }

  const otpCode = input.otpCode.replace(/\D/g, "");
  if (otpCode.length !== 6) {
    return {
      success: false,
      error: "Código inválido. Use os 6 dígitos recebidos.",
    };
  }

  const nowIso = new Date().toISOString();
  const [pending] = await db
    .select({
      id: phoneVerificationCodes.id,
      codeHash: phoneVerificationCodes.codeHash,
      attempts: phoneVerificationCodes.attempts,
      expiresAt: phoneVerificationCodes.expiresAt,
    })
    .from(phoneVerificationCodes)
    .where(
      and(
        eq(phoneVerificationCodes.userId, session.userId),
        eq(phoneVerificationCodes.phoneE164, validation.e164),
        isNull(phoneVerificationCodes.verifiedAt),
        gt(phoneVerificationCodes.expiresAt, nowIso),
      ),
    )
    .orderBy(desc(phoneVerificationCodes.createdAt))
    .limit(1);

  if (!pending) {
    return {
      success: false,
      error:
        "Código expirado ou inexistente para este número. Solicite um novo código.",
    };
  }

  if (pending.attempts >= OTP_MAX_ATTEMPTS) {
    return {
      success: false,
      error: "Muitas tentativas inválidas. Solicite um novo código.",
    };
  }

  const providedHash = buildOtpHash(otpCode);
  if (providedHash !== pending.codeHash) {
    const nextAttempts = pending.attempts + 1;
    await db
      .update(phoneVerificationCodes)
      .set({ attempts: nextAttempts })
      .where(eq(phoneVerificationCodes.id, pending.id));

    if (nextAttempts >= OTP_MAX_ATTEMPTS) {
      return {
        success: false,
        error: "Limite de tentativas atingido. Solicite um novo código.",
      };
    }

    return {
      success: false,
      error: `Código inválido. Tentativa ${nextAttempts} de ${OTP_MAX_ATTEMPTS}.`,
    };
  }

  await db
    .update(phoneVerificationCodes)
    .set({ verifiedAt: nowIso })
    .where(eq(phoneVerificationCodes.id, pending.id));

  await db
    .update(users)
    .set({
      phoneCountryCode: validation.countryCode,
      phoneNationalNumber: validation.nationalNumber,
      phoneE164: validation.e164,
      phoneVerifiedAt: nowIso,
    })
    .where(eq(users.id, session.userId));

  return {
    success: true,
    message: "Telefone confirmado e salvo com sucesso.",
  };
}

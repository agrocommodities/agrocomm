"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signSession } from "@/lib/auth";

type AuthState = { error: string } | null;
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

  if (!email || !password) return { error: "Preencha todos os campos." };

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) return { error: "E-mail ou senha inválidos." };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "E-mail ou senha inválidos." };

  const token = await signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);
  redirect("/");
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

  if (!name || !email || !password)
    return { error: "Preencha todos os campos." };
  if (password.length < 8)
    return { error: "A senha deve ter no mínimo 8 caracteres." };
  if (password !== confirm) return { error: "As senhas não coincidem." };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) return { error: "Este e-mail já está cadastrado." };

  const passwordHash = await bcrypt.hash(password, 12);
  const [newUser] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning({ id: users.id });

  const token = await signSession({
    userId: newUser.id,
    email,
    name,
    role: "user",
  });
  await setSessionCookie(token);
  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/auth/login");
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

  if (email !== user.email) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) return { error: "Este e-mail já está cadastrado." };
  }

  const updates: { name: string; email: string; passwordHash?: string } = {
    name,
    email,
  };

  if (newPassword) {
    if (!currentPassword)
      return { error: "Informe a senha atual para alterá-la." };
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return { error: "Senha atual incorreta." };
    if (newPassword.length < 8)
      return { error: "A nova senha deve ter no mínimo 8 caracteres." };
    if (newPassword !== confirmPassword)
      return { error: "As novas senhas não coincidem." };
    updates.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  await db.update(users).set(updates).where(eq(users.id, session.userId));

  const token = await signSession({
    userId: session.userId,
    email,
    name,
    role: user.role,
  });
  await setSessionCookie(token);

  return { success: true };
}

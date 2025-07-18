"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signInSchema, signUpSchema, updateUserSchema } from "@/schemas/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { comparePasswords, generateSalt, hashPassword } from "@/lib/password";
import { cookies } from "next/headers";
import { createSession, removeSession } from "@/lib/session";

export async function getUserById(id: string) {
  const userId = parseInt(id, 10);
  
  if (isNaN(userId)) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      username: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user || null;
}

export async function signIn(unsafeData: z.infer<typeof signInSchema>) {
  const { success, data } = signInSchema.safeParse(unsafeData);
  if (!success) return "Não foi possível fazer login";

  const user = await db.query.users.findFirst({
    columns: { password: true, salt: true, id: true, email: true, role: true },
    where: eq(users.email, data.email),
  });

  if (!user) return "E-mail e/ou senha inválidos";

  const isCorrectPassword = await comparePasswords({
    hashedPassword: user.password,
    password: data.password,
    salt: user.salt || "",
  });

  if (!isCorrectPassword) return "E-mail e/ou senha inválidos";

  await createSession(user, await cookies());

  redirect("/");
}

export async function signUp(unsafeData: z.infer<typeof signUpSchema>) {
  const { success, data } = signUpSchema.safeParse(unsafeData);
  if (!success) return "Já existe uma conta com este e-mail";

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existingUser) return "Já existe uma conta com este e-mail";

  try {
    const salt = generateSalt();
    const hashedPassword = await hashPassword(data.password, salt);

    const [user] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        salt,
      })
      .returning({ id: users.id, role: users.role });

    if (user == null) return "Não foi possível criar a conta";
    await createSession(user, await cookies());
  } catch (error) {
    console.error("Error creating user:", error);
    return "Não foi possível criar a conta";
  }

  redirect("/");
}

export async function logOut() {
  await removeSession(await cookies());
  redirect("/");
}

export async function updateUser(_prevState: any,  formData: FormData) {
  const currentUser = await getCurrentUser({ withFullUser: false });
  if (!currentUser) return { error: "Não autorizado" };

  const userId = formData.get("userId") as string;
  const targetUserId = parseInt(userId, 10);
  if (isNaN(targetUserId)) return { error: "ID inválido" };

  // Verificar permissões
  if (currentUser.role !== "admin" && currentUser.id !== targetUserId) {
    return { error: "Sem permissão para editar este usuário" };
  }

  const unsafeData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as "admin" | "user" | undefined,
  };

  const { success, data } = updateUserSchema.safeParse(unsafeData);
  if (!success) return { error: "Dados inválidos" };

  try {
    const updateData: any = {
      name: data.name,
      email: data.email,
      updatedAt: new Date().toISOString(),
    };

    if (currentUser.role === "admin" && data.role) {
      updateData.role = data.role;
    }

    if (data.password && data.password.length > 0) {
      const salt = generateSalt();
      updateData.password = await hashPassword(data.password, salt);
      updateData.salt = salt;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, targetUserId));

    revalidatePath("/admin");
    revalidatePath(`/users/${userId}/edit`);
    redirect("/admin");
  } catch (error) {
    console.error("Error updating user:", error);
    return { error: "Erro ao atualizar usuário" };
  }
}

// export async function updateUser(
//   userId: string,
//   unsafeData: z.infer<typeof updateUserSchema>
// ) {
//   const currentUser = await getCurrentUser({ withFullUser: false });
//   if (!currentUser) return { error: "Não autorizado" };

//   const targetUserId = parseInt(userId, 10);
//   if (isNaN(targetUserId)) return { error: "ID inválido" };

//   // Verificar permissões
//   if (currentUser.role !== "admin" && currentUser.id !== targetUserId) {
//     return { error: "Sem permissão para editar este usuário" };
//   }

//   const { success, data } = updateUserSchema.safeParse(unsafeData);
//   if (!success) return { error: "Dados inválidos" };

//   try {
//     // Se admin editando outro usuário, pode mudar role
//     const updateData: any = {
//       name: data.name,
//       email: data.email,
//       updatedAt: new Date().toISOString(),
//     };

//     if (currentUser.role === "admin" && data.role) {
//       updateData.role = data.role;
//     }

//     // Se mudando senha
//     if (data.password) {
//       const salt = generateSalt();
//       updateData.password = await hashPassword(data.password, salt);
//       updateData.salt = salt;
//     }

//     await db
//       .update(users)
//       .set(updateData)
//       .where(eq(users.id, targetUserId));

//     revalidatePath("/admin");
//     revalidatePath(`/users/${userId}/edit`);
    
//     return { success: true };
//   } catch (error) {
//     console.error("Error updating user:", error);
//     return { error: "Erro ao atualizar usuário" };
//   }
// }

export async function deleteUser(userId: string) {
  const currentUser = await getCurrentUser({ withFullUser: false });
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Não autorizado" };
  }

  const targetUserId = parseInt(userId, 10);
  if (isNaN(targetUserId)) return { error: "ID inválido" };

  // Não permitir auto-exclusão
  if (currentUser.id === targetUserId) {
    return { error: "Você não pode excluir sua própria conta" };
  }

  try {
    await db.delete(users).where(eq(users.id, targetUserId));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { error: "Erro ao excluir usuário" };
  }
}
"use server";

import path from "path";
import { getCurrentUser } from "@/lib/user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signUpSchema, updateUserSchema } from "@/schemas/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { comparePasswords, generateSalt, hashPassword } from "@/lib/password";
import { writeFile, mkdir } from "fs/promises";

export async function uploadAvatar(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Não autorizado" };

  try {
    const file = formData.get("avatar") as File;
    if (!file || !file.size) return { error: "Nenhum arquivo selecionado" };

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return { error: "Tipo de arquivo não permitido. Use JPG, PNG ou WebP." };

    // Validar tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) return { error: "O arquivo deve ter no máximo 5MB" };

    // Criar diretório se não existir
    const uploadDir = path.join(process.cwd(), "public/uploads/avatars");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Diretório já existe, continuar
    }

    // Gerar nome único para o arquivo
    const extension = path.extname(file.name);
    const filename = `avatar-${user.id}-${Date.now()}${extension}`;
    const filepath = path.join(uploadDir, filename);

    // Converter file para buffer e salvar
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);
    await writeFile(filepath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    // Atualizar o avatar no banco
    await db
      .update(users)
      .set({
        avatar: avatarUrl,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    revalidatePath("/ajustes");
    return { success: true, avatar: avatarUrl };
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return { error: "Erro ao fazer upload do avatar" };
  }
}

export async function updateUser(_prevState: any, formData: FormData) {
  const currentUser = await getCurrentUser();
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
    // Atualizar dados do usuário
    const updateUserData: any = {
      name: data.name,
      email: data.email,
      updatedAt: new Date().toISOString(),
    };

    if (currentUser.role === "admin" && data.role) {
      updateUserData.role = data.role;
    }

    if (data.password && data.password.length > 0) {
      const salt = generateSalt();
      updateUserData.password = await hashPassword(data.password, salt);
      updateUserData.salt = salt;
    }

    await db
      .update(users)
      .set(updateUserData)
      .where(eq(users.id, targetUserId));

    revalidatePath("/admin");
    redirect("/admin");
  } catch (error) {
    console.error("Error updating user:", error);
    return { error: "Erro ao atualizar usuário" };
  }
}

export async function updateProfile(_prevState: any, formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Não autorizado" };

  const userId = parseInt(formData.get("userId") as string, 10);
  if (currentUser.id !== userId) return { error: "Você só pode editar seu próprio perfil" };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Dados do usuário
  const userData = {
    name: formData.get("name") as string,
    username: formData.get("username") as string || null,
    email: formData.get("email") as string,
    bio: formData.get("bio") as string || null,
    phone: formData.get("phone") as string || null,
    location: formData.get("location") as string || null,
    website: formData.get("website") as string || null,
  };

  // Validações básicas
  if (!userData.name || !userData.email) {
    return { error: "Nome e e-mail são obrigatórios" };
  }

  // Validar tamanho da bio
  if (userData.bio && userData.bio.length > 500) {
    return { error: "A biografia deve ter no máximo 500 caracteres" };
  }

  // Validar formato do website
  if (userData.website && !userData.website.match(/^https?:\/\/.+/)) {
    return { error: "O website deve começar com http:// ou https://" };
  }

  try {
    // Verificar email duplicado
    if (userData.email !== currentUser.email) {
      const existingEmail = await db.query.users.findFirst({
        where: eq(users.email, userData.email),
      });

      if (existingEmail && existingEmail.id !== userId) {
        return { error: "Este e-mail já está em uso" };
      }
    }

    // Verificar username duplicado
    if (userData.username) {
      const existingUsername = await db.query.users.findFirst({
        where: eq(users.username, userData.username),
      });

      if (existingUsername && existingUsername.id !== userId) {
        return { error: "Este nome de usuário já está em uso" };
      }
    }

    // Se mudando senha
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: "Preencha todos os campos de senha" };
      }

      if (newPassword !== confirmPassword) {
        return { error: "As senhas não coincidem" };
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { password: true, salt: true },
      });

      if (!user) return { error: "Usuário não encontrado" };

      const isCorrectPassword = await comparePasswords({
        hashedPassword: user.password,
        password: currentPassword,
        salt: user.salt || "",
      });

      if (!isCorrectPassword) {
        return { error: "Senha atual incorreta" };
      }

      const { success } = signUpSchema.shape.password.safeParse(newPassword);
      if (!success) {
        return { error: "A nova senha deve ter pelo menos 4 caracteres" };
      }

      const salt = generateSalt();
      const hashedPassword = await hashPassword(newPassword, salt);

      await db
        .update(users)
        .set({
          ...userData,
          password: hashedPassword,
          salt,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId));
    } else {
      // Atualizar apenas dados básicos se não estiver mudando senha
      await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId));
    }

    revalidatePath("/ajustes");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Erro ao atualizar perfil" };
  }
}

export async function deleteUser(userId: string) {
  const currentUser = await getCurrentUser();
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
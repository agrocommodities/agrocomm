"use server";

import { z } from "zod";
import path from "path";
import { getCurrentUser } from "@/lib/user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signInSchema, signUpSchema, updateUserSchema } from "@/schemas/auth";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { comparePasswords, generateSalt, hashPassword } from "@/lib/password";
import { cookies } from "next/headers";
import { createSession, removeSession } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import { sendVerificationEmail } from "@/lib/email";
import { generateVerificationToken, getTokenExpiry } from "@/lib/tokens";
import type { SessionUser } from "@/types";

export async function uploadAvatar(formData: FormData) {
  const user = await getCurrentUser({ sessionOnly: true });
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
    const uploadDir = path.join(process.cwd(), "public/uploads/avatars", user.id.toString());
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
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    // Atualizar o avatar no banco
    const existingProfile = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });

    if (existingProfile) {
      await db
        .update(profiles)
        .set({
          avatar: avatarUrl,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(profiles.userId, user.id));
    } else {
      await db.insert(profiles).values({
        userId: user.id,
        name: user.email, // Nome padrão
        avatar: avatarUrl,
      });
    }

    revalidatePath("/ajustes");
    return { success: true, avatar: avatarUrl };
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return { error: "Erro ao fazer upload do avatar" };
  }
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

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  await createSession(sessionUser, await cookies());
  redirect("/");
}

export async function signUp(unsafeData: z.infer<typeof signUpSchema> & { sendVerificationEmail?: boolean; redirectTo?: string; }) {
  const { success, data } = signUpSchema.safeParse(unsafeData);
  if (!success) return "Dados inválidos";

  const existingUser = await db.query.users.findFirst({ where: eq(users.email, data.email) });
  if (existingUser) return "Já existe uma conta com este e-mail";

  const result = await createUserAccount(data, unsafeData.sendVerificationEmail);
  if (typeof result === 'string') return result;

  if (unsafeData.redirectTo) redirect(unsafeData.redirectTo);
  else redirect("/");
}

// Função auxiliar para criar a conta (separada do redirect)
async function createUserAccount(data: z.infer<typeof signUpSchema>, sendEmail: boolean = false) {
  try {
    const salt = generateSalt();
    const hashedPassword = await hashPassword(data.password, salt);
    const verificationToken = generateVerificationToken();
    const verificationExpires = getTokenExpiry();

    const newUserData: typeof users.$inferInsert = {
      email: data.email,
      password: hashedPassword,
      salt,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires.toISOString(),
    };

    const newUser = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values(newUserData)
        .onConflictDoNothing()
        .returning({ id: users.id, email: users.email, role: users.role });

      if (!newUser) {
        tx.rollback();
        return null;
      }

      const newProfileData: typeof profiles.$inferInsert = {
        userId: newUser.id,
        name: data.name,
        avatar: null,
      };

      const [newProfile] = await tx
        .insert(profiles)
        .values(newProfileData)
        .onConflictDoNothing()
        .returning({ id: profiles.id, userId: profiles.userId, name: profiles.name, avatar: profiles.avatar });

      if (!newProfile) {
        tx.rollback();
        return null;
      }

      if (sendEmail) {
        const emailSent = sendVerificationEmail(data.email, verificationToken);

        if (!emailSent) {
          tx.rollback();
          return null;
        }
      }
      
      return newUser;
    });

    return newUser;
  } catch (error) {
    console.error("Error creating user:", error);
    return "Não foi possível criar a conta";
  }
}

export async function signUpTwo(unsafeData: z.infer<typeof signUpSchema> & { sendVerificationEmail?: boolean; redirectTo?: string; }) {
  const { success, data } = signUpSchema.safeParse(unsafeData);
  if (!success) return "Dados inválidos";

  const existingUser = await db.query.users.findFirst({ where: eq(users.email, data.email) });
  if (existingUser) return "Já existe uma conta com este e-mail";

  try {
    const salt = generateSalt();
    const hashedPassword = await hashPassword(data.password, salt);
    const verificationToken = generateVerificationToken();
    const verificationExpires = getTokenExpiry();

    const newUserData: typeof users.$inferInsert = {
      email: data.email,
      password: hashedPassword,
      salt,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires.toISOString(),
    };


    const newUser = await db.transaction(async (tx) => {
      // const [user] = await tx.select({ balance: accounts.balance }).from(accounts).where(eq(users.name, 'Dan'));

      const [newUser] = await tx
        .insert(users)
        .values(newUserData)
        .onConflictDoNothing()
        .returning({ id: users.id, email: users.email, role: users.role });

      if (!newUser) {
        tx.rollback()
        return null
      }

      const newProfileData: typeof profiles.$inferInsert = {
        userId: newUser.id,
        name: data.name,
        avatar: null,
      };

      const [newProfile] = await tx
        .insert(profiles)
        .values(newProfileData)
        .onConflictDoNothing()
        .returning({ id: profiles.id, userId: profiles.userId, name: profiles.name, avatar: profiles.avatar });

      if (!newProfile) {
        tx.rollback()
        return null
      }

      console.log("unsafeData", unsafeData);

      if (unsafeData.sendVerificationEmail) {
        const sendedEmail = await sendVerificationEmail(data.email, verificationToken);

        if (!sendedEmail) {
          tx.rollback();
          return null;
        }
      }
      
      return newUser;

      // await tx.update(accounts).set({ balance: sql`${accounts.balance} - 100.00` }).where(eq(users.name, 'Dan'));
      // await tx.update(accounts).set({ balance: sql`${accounts.balance} + 100.00` }).where(eq(users.name, 'Andrew'));
    });

    if (unsafeData.redirectTo) {
      redirect(unsafeData.redirectTo);
    } else {
      redirect("/");
    }



    // Criar profile
    // await db.insert(profiles).values({
    //   userId: newUser.id,
    //   name: data.name,
    // });

    // const sessionUser: SessionUser = {
    //   id: newUser.id,
    //   email: newUser.email,
    //   role: newUser.role,
    // };

    // Enviar email de verificação


    // Não criar sessão automaticamente - usuário precisa verificar email
    // redirect para página de confirmação será feito no componente
    // await createSession(sessionUser, await cookies());
  } catch (error) {
    console.error("Error creating user:", error);
    return "Não foi possível criar a conta";
  }
}

// export async function signUp(unsafeData: z.infer<typeof signUpSchema>) {
//   const { success, data } = signUpSchema.safeParse(unsafeData);
//   if (!success) return "Dados inválidos";

//   const existingUser = await db.query.users.findFirst({
//     where: eq(users.email, data.email),
//   });

//   if (existingUser) return "Já existe uma conta com este e-mail";

//   try {
//     const salt = generateSalt();
//     const hashedPassword = await hashPassword(data.password, salt);

//     // Criar usuário
//     const [newUser] = await db
//       .insert(users)
//       .values({
//         email: data.email,
//         password: hashedPassword,
//         salt,
//       })
//       .returning({ id: users.id, email: users.email, role: users.role });

//     if (!newUser) return "Não foi possível criar a conta";

//     // Criar profile
//     await db.insert(profiles).values({
//       userId: newUser.id,
//       name: data.name,
//     });

//     const sessionUser: SessionUser = {
//       id: newUser.id,
//       email: newUser.email,
//       role: newUser.role,
//     };

//     await createSession(sessionUser, await cookies());
//   } catch (error) {
//     console.error("Error creating user:", error);
//     return "Não foi possível criar a conta";
//   }

//   redirect("/");
// }

// export async function reSendVerificationEmail(email: string) {
//   const [user] = await db.select().from(users).where(eq(users.email, email))
//   if (user) {
//     if (user.emailVerificationToken) {
//       await sendVerificationEmail(user.email, user.emailVerificationToken);
//     } else {
//       const emailVerificationToken = generateVerificationToken();
//       const emailVerificationExpires = getTokenExpiry();
//       await db.update(users).set({ emailVerificationToken, emailVerificationExpires: emailVerificationExpires.toString() }).where(eq(users.email, email))
//       await sendVerificationEmail(user.email, emailVerificationToken);
//     }
//   }
// }

// src/actions.ts - Adicionar função de reenvio
export async function reSendVerificationEmail(email: string) {
  try {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    return await response.json();
  } catch (error) {
    return { error: 'Erro de conexão' };
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
    // Atualizar dados do usuário (email, role, password)
    const updateUserData: any = {
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

    // Atualizar ou criar profile
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, targetUserId),
    });

    if (existingProfile) {
      await db
        .update(profiles)
        .set({
          name: data.name,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(profiles.userId, targetUserId));
    } else {
      await db.insert(profiles).values({
        userId: targetUserId,
        name: data.name,
      });
    }

    revalidatePath("/admin");
    revalidatePath(`/conta/${userId}/editar`);
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

  // Dados do profile
  const profileData = {
    //avatar: formData.get("avatarFile") as string,
    name: formData.get("name") as string,
    username: formData.get("username") as string || null,
    bio: formData.get("bio") as string || null,
    phone: formData.get("phone") as string || null,
    location: formData.get("location") as string || null,
    website: formData.get("website") as string || null,
  };

  // Dados do user
  const userData = {
    email: formData.get("email") as string,
  };

  // Validações básicas
  if (!profileData.name || !userData.email) {
    return { error: "Nome e e-mail são obrigatórios" };
  }

  // Validar tamanho da bio
  if (profileData.bio && profileData.bio.length > 500) {
    return { error: "A biografia deve ter no máximo 500 caracteres" };
  }

  // Validar formato do website
  if (profileData.website && !profileData.website.match(/^https?:\/\/.+/)) {
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
    if (profileData.username) {
      const existingUsername = await db.query.profiles.findFirst({
        where: eq(profiles.username, profileData.username),
      });

      if (existingUsername && existingUsername.userId !== userId) {
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
        return { error: "A nova senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas e números" };
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
      // Atualizar apenas email se não estiver mudando senha
      await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId));
    }

    // Verificar se o profile existe
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (existingProfile) {
      // Atualizar profile existente
      await db
        .update(profiles)
        .set({
          ...profileData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(profiles.userId, userId));
    } else {
      // Criar novo profile
      await db.insert(profiles).values({
        userId,
        ...profileData,
      });
    }

    revalidatePath("/ajustes");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Erro ao atualizar perfil" };
  }
}

export async function logOut() {
  await removeSession(await cookies());
  redirect("/");
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


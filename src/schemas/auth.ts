import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const signUpSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.email("Email inválido"),
  password: z.string()
    .min(4, "Senha deve ter pelo menos 4 caracteres")
    // .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    // .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
    // .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.email("Email inválido"),
  password: z.string().min(8).optional().or(z.literal("")),
  role: z.enum(["admin", "user"]).optional(),
});
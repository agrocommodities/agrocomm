"use client";

import { useState } from "react";
import { signUp } from "@/actions";
import { z } from "zod";
import { signUpSchema } from "@/schemas/auth";
import Input from "@/components/ui/input";
import PasswordStrength from "@/components/ui/password-str";
import Password from "@/components/ui/password";
import Link from "next/link";

type FormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitError, setSubmitError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  function validateEmail(email: string): string | undefined {
    if (!email) return "Email é obrigatório";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Email inválido. Exemplo: usuario@dominio.com";
    }
    
    return undefined;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validação em tempo real para email
    if (name === "email" && emailTouched) {
      const emailError = validateEmail(value);
      setErrors({ ...errors, email: emailError });
    } else {
      setErrors({ ...errors, [name]: undefined });
    }
    
    setSubmitError(undefined);
  }

  function handleEmailBlur() {
    setEmailTouched(true);
    const emailError = validateEmail(formData.email);
    setErrors({ ...errors, email: emailError });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validar email antes de enviar
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setErrors({ ...errors, email: emailError });
      return;
    }

    const result = signUpSchema.safeParse(formData);

    if (!result.success) {
      const zErrors: typeof errors = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof FormData;
        zErrors[field] = err.message;
      });
      setErrors(zErrors);
      return;
    }

    setLoading(true);
    const serverError = await signUp(result.data);
    setLoading(false);

    if (serverError) {
      setSubmitError(serverError);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" autoComplete="nope">
      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
          {submitError}
        </div>
      )}
      <div className="space-y-2">
        <label htmlFor="name" className="block font-medium">
          Nome
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          autoComplete="new-password"
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleEmailBlur}
          autoComplete="off"
          className={errors.email ? "border-red-500" : ""}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block font-medium">
          Senha
        </label>
        <Password
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          className={errors.password ? "border-red-500" : ""}
          placeholder="Digite sua senha..."
          // showStrength={`true`}
        />
        <PasswordStrength password={formData.password} />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password}</p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Use pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.
        </p>
      </div>
      <div className="flex justify-between">
        <Link href="/entrar" className="underline">
          Já tenho conta
        </Link>
        <button type="submit" disabled={loading || !!errors.email || !!errors.password} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </div>
    </form>
  );
}
// src/components/auth/register.tsx (atualizar para aceitar email e redirect)
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { signUp } from "@/actions";
import { z } from "zod";
import { signUpSchema } from "@/schemas/auth";
import Input from "@/components/ui/input";
import PasswordStrength from "@/components/ui/password-str";
import Password from "@/components/ui/password";
import Loader from "@/components/ui/loader";
import Button from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";

type FormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailFromQuery = searchParams.get("email") || "";
  const redirectTo = searchParams.get("redirect") || "/";

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: emailFromQuery,
    password: "",
  });

  // const [formData, setFormData] = useState<FormData>({
  //   name: "",
  //   email: "",
  //   password: "",
  // });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
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

    // setLoading(true);
    // const serverError = await signUp(result.data);
    // setLoading(false);

    setLoading(true);
    const serverError = await signUp({
      ...result.data,
      sendVerificationEmail: true,
      redirectTo,
    });
    setLoading(false);

    // if (serverError) {
    //   setSubmitError(serverError);
    // }

    if (!serverError) {
      // Redirecionar para página de confirmação
      router.push("/confirmar-email");
    }
  }

  return (
    <div
      className="
        w-full border-2 border-solid border-black/[.18] dark:border-white/[.145]
        bg-black/50 rounded-lg shadow dark:border md:mt-0 max-w-2xl dark:border-gray-700
      "
    >
      <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
        <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
          Entrar
        </h1>
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
              placeholder="Seu nome completo"
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
              E-mail
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nome@empresa.com"
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
              placeholder="Digite sua senha..."
              onChange={handleChange}
              autoComplete="new-password"
              className={errors.password ? "border-red-500" : ""}
            // showStrength={`true`}
            />
            <PasswordStrength password={formData.password} />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use pelo menos 8 caracteres, incluindo letras maiúsculas,
              minúsculas, números e símbolos.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-light text-gray-500 dark:text-gray-400">
              Já tenho conta?{" "}
              <Link
                href="/entrar"
                className="font-medium text-primary-600 hover:underline dark:text-primary-500"
              >
                Entre
              </Link>
            </p>
            <Button
              type="submit"
              disabled={loading || !!errors.email || !!errors.password}
            >
              {loading ? (
                <Loader className="w-5 h-5 text-white">Cadastrando...</Loader>
              ) : (
                "Cadastrar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

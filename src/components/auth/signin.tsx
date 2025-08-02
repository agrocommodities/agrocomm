"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "@/actions/auth";
import { z } from "zod";
import { signInSchema } from "@/schemas/auth";
import { Input, Password } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FormData = z.infer<typeof signInSchema>;

export function SignInForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [submitError, setSubmitError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  function validateEmail(email: string): string | undefined {
    if (!email) return "Email é obrigatório";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return "Email inválido. Exemplo: usuario@dominio.com";

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

    const result = signInSchema.safeParse(formData);
    if (!result.success) {
      const map: typeof errors = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof FormData;
        map[field] = err.message;
      });
      setErrors(map);
      return;
    }

    setLoading(true);
    const error = await signIn(result.data);
    setLoading(false);

    if (error) setSubmitError(error);
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-8">
        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
            {submitError}
          </div>
        )}
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
            className={formData.email.length > 0 && errors.email ? "border-rose-500" : ""}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {formData.email.length > 0 && errors.email && (
            <p id="email-error" className="text-sm text-rose-500">
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
            className={errors.password ? "border-rose-500" : ""}
          />
          {errors.password && (
            <p className="text-sm text-rose-500">{errors.password}</p>
          )}
        </div>
        <div className="md:flex items-center justify-between">
          <div className="mb-5 md:mb-0 mr-0 md:mr-6">
            Ainda não tem uma conta?{" "}
            <Link href="/cadastro" className="underline">
              Cadastre-se
            </Link>
          </div>
          <Button
            type="submit"
            disabled={loading || !!errors.email || !!errors.password}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </div>
      </form>
    </div>
  );
}

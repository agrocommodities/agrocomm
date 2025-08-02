"use client";

import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import { signUp } from "@/actions/auth";
import { signUpSchema } from "@/schemas/auth";
import { Input, Password } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const [formData, setFormData] = useState<FormData>({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitError, setSubmitError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  function validateName(name: string): string | undefined {
    if (!name) return "Nome é obrigatório";
    if (!/^[a-zA-Z]+$/.test(name)) return "Nome inválido. Exemplo: usuario";
    if (name.length < 3 || name.length > 100) return "O nome deve ter entre 3 e 100 caracteres.";
    return undefined;
  }

  function validateEmail(email: string): string | undefined {
    if (!email) return "Email é obrigatório";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email inválido. Exemplo: usuario@dominio.com";
    return undefined;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "email" && emailTouched) {
      const emailError = validateEmail(value);
      setErrors({ ...errors, email: emailError });
    } else {
      setErrors({ ...errors, [name]: undefined });
    }

    setSubmitError(undefined);
  }

  function handleNameBlur() {
    setNameTouched(true);
    const nameError = validateName(formData.name);
    setErrors({ ...errors, name: nameError });
  }

  function handleEmailBlur() {
    setEmailTouched(true);
    const emailError = validateEmail(formData.email);
    setErrors({ ...errors, email: emailError });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

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

    if (serverError) setSubmitError(serverError);
  }

  return (
    <div>
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
            onBlur={handleNameBlur}
            autoComplete="new-password"
            className={errors.name ? "border-rose-500" : ""}
          />
          {formData.name.length > 0 && errors.name && (
            <p className="text-sm text-rose-500">{errors.name}</p>
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
            value={formData.email}
            onChange={handleChange}
            onBlur={handleEmailBlur}
            autoComplete="off"
            className={errors.email ? "border-rose-500" : ""}
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
            autoComplete="nope"
            className={errors.password ? "border-rose-500" : ""}
            placeholder="Digite sua senha..."
            showStrength={true}
          />
          {errors.password && (
            <p className="text-sm text-rose-500">{errors.password}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Use pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.
          </p>
        </div>
        <div className="flex justify-between">
          <Link href="/entrar" className="underline">
            Já tem conta?
          </Link>
          <Button type="submit" disabled={loading || !!errors.email || !!errors.password}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
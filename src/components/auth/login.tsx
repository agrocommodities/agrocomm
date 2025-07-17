"use client";

import { useState } from "react";
import { signIn } from "@/actions";
import { z } from "zod";
import { signInSchema } from "@/schemas/auth";
import Input from "@/components/ui/input";
import Password from "@/components/ui/password";
import Button from "@/components/ui/button";
import Loader from "@/components/ui/loader";
import Link from "next/link";

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

        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
            {submitError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-gray-900 dark:text-white"
            >
              E-mail
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              className={`${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="nome@empresa.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600">
                {errors.email}
              </p>
            )}
          </div>
          <div className="m-0">
            <label
              htmlFor="password"
              className="block text-gray-900 dark:text-white"
            >
              Senha
            </label>
            <Password
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>
          <div className="flex justify-end mb-2">
            <Link
              href="/senha"
              className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="remember"
                aria-describedby="remember"
                type="checkbox"
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor="remember"
                className="text-gray-500 dark:text-gray-300"
              >
                Lembrar de mim
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-light text-gray-500 dark:text-gray-400">
              Ainda não tem uma conta?{" "}
              <Link
                href="/cadastro"
                className="font-medium text-primary-600 hover:underline dark:text-primary-500"
              >
                Cadastre-se
              </Link>
            </p>
            <Button
              type="submit"
              disabled={loading || !!errors.email || !!errors.password}
              className="
                flex items-center justify-center cursor-pointer rounded-md 
                border-2 border-solid border-black/[.18] dark:border-white/[.145] 
                transition-colors bg-primary-600 hover:bg-primary-700 focus:outline-none 
                rounded-lg px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 
                dark:focus:ring-primary-800 disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loading ? <Loader className="w-5 h-5 text-white" /> : "Entrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { signIn } from "@/actions";
import { z } from "zod";
import { signInSchema } from "@/schemas/auth";
import Input from "@/components/ui/input";
import Password from "@/components/ui/password";
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
        border-2 border-solid border-black/[.18] dark:border-white/[.145]
        w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700
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
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              className={`
                bg-gray-50 border ${errors.email ? "border-red-500" : "border-gray-300"} 
                text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 
                block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 
                dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500
              `}
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

          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`
                bg-gray-50 border ${errors.password ? "border-red-500" : "border-gray-300"} 
                text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 
                block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 
                dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500
              `}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>
          <div className="flex items-center justify-between">
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
            <Link
              href="/senha"
              className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <button
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
            {loading ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>

          <p className="text-sm font-light text-gray-500 dark:text-gray-400">
            Ainda não tem uma conta?{" "}
            <Link
              href="/cadastro"
              className="font-medium text-primary-600 hover:underline dark:text-primary-500"
            >
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Esqueci minha senha — AgroComm" };

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <Image src="/images/logo.svg" alt="AgroComm" width={48} height={48} />
          <h1 className="text-2xl font-bold">Recuperar senha</h1>
          <p className="text-sm text-white/50">
            Enviaremos um link para redefinir sua senha
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <Result error="Link inválido ou expirado." />;
  }

  const parsed = verifyUnsubscribeToken(token);
  if (!parsed) {
    return <Result error="Link inválido ou expirado." />;
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      bulletinOptOut: users.bulletinOptOut,
    })
    .from(users)
    .where(eq(users.id, parsed.userId))
    .limit(1);

  if (!user || user.email !== parsed.email) {
    return <Result error="Link inválido ou expirado." />;
  }

  if (user.bulletinOptOut === 1) {
    return <Result already />;
  }

  await db
    .update(users)
    .set({ bulletinOptOut: 1 })
    .where(eq(users.id, user.id));

  return <Result success email={user.email} />;
}

function Result({
  success,
  already,
  error,
  email,
}: {
  success?: boolean;
  already?: boolean;
  error?: string;
  email?: string;
}) {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#2a3925] border border-white/10 rounded-2xl p-8 text-center">
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-email.png"
            alt="AgroComm"
            className="h-12 w-auto mx-auto"
          />
        </div>

        {error ? (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✕</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Link inválido</h1>
            <p className="text-white/50 text-sm">{error}</p>
          </>
        ) : already ? (
          <>
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              Já descadastrado
            </h1>
            <p className="text-white/50 text-sm">
              Você já não recebe boletins por e-mail.
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-green-400">✓</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              Descadastrado com sucesso
            </h1>
            <p className="text-white/50 text-sm mb-1">
              O endereço <span className="text-white/80">{email}</span> foi
              removido da lista de boletins.
            </p>
            <p className="text-white/40 text-xs">
              Você pode reativar os boletins a qualquer momento nas
              configurações da sua conta.
            </p>
          </>
        )}

        <Link
          href="/"
          className="mt-6 inline-block text-green-400 text-sm hover:text-green-300 transition-colors"
        >
          Voltar para o AgroComm →
        </Link>
      </div>
    </div>
  );
}

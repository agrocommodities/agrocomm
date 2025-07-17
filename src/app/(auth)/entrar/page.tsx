import { SignInForm } from "@/components/auth/login";

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ oauthError?: string }>;
}) {
  const { oauthError } = await searchParams;

  return (
    <section className="flex justify-center items-center min-h-full">
      {oauthError && <div>{oauthError}</div>}
      <div>Teste</div>
      <SignInForm />
    </section>
    
  );
}

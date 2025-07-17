import { SignInForm } from "@/components/auth/login";

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ oauthError?: string }>;
}) {
  const { oauthError } = await searchParams;

  return (
    <div>
      {oauthError && <div>{oauthError}</div>}
      <SignInForm />
    </div>
  );
}

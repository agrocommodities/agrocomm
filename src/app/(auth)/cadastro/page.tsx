import { SignUpForm } from "@/components/auth/register";

export default async function SignUp() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    {/* <div className="flex justify-center"> */}
      <SignUpForm />
    </div>
  );
}

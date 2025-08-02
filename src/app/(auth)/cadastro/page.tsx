import { SignUpForm } from "@/components/auth/signup";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="max-w-md border-3 border-black/25 p-5 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Cadastro</h1>
        <SignUpForm />
      </div>
    </div>
  );
}

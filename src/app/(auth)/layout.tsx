// src/app/(auth)/layout.tsx
export default async function AuthLayout({ children }: { children: React.ReactNode; }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div className="max-w-md border-3 border-black/25 p-5 rounded-lg shadow-lg">
        {children}
      </div>
    </div>
  );
}
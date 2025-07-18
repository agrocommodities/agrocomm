export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pt-16 pb-12 flex items-center justify-center">

        {children}

    </div>
  );
}
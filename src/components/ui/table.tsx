export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded bg-black/15 border-2 border-black/50 shadow-lg">
      <table className="min-w-full divide-y-2 divide-black/50">
        {children}
      </table>
    </div>
  );
}

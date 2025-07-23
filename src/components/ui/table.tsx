export default function Table({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border-2 border-black/80">
      <table className={`table-auto md:table-fixed w-full text-left ${className}`}>
        {children}
      </table>
    </div>
  );
}

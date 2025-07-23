export default function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="table-auto md:table-fixed w-full text-sm text-left">
        {children}
      </table>
    </div>
  );
}

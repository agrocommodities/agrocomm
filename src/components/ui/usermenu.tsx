export function UserMenu() {
  return (
    // <div className="flex items-center gap-4">
    <div className="flex flex-col md:flex-row items-center gap-2">
      <a
        className="rounded-md bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm"
        href="#"
      >
        Login
      </a>
      <a
        className="rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-teal-600"
        href="#"
      >
        Register
      </a>
    </div>
    // </div>
  );
}

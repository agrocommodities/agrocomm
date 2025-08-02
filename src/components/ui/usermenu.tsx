import Link from "next/link";

export function UserMenu() {
  const user = null; // Simulating no user logged in

  if (user) {
    return (
      <div className="flex flex-col md:flex-row items-center gap-2">
        <Link
          className="rounded-md bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm"
          href="/login"
        >
          Entrar
        </Link>
        <Link
          className="rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-teal-600"
          href="/cadastro"
        >
          Cadastro
        </Link>
      </div>
    );
  } else {
    return (
      <div className="hidden md:relative md:block">
        <button
          type="button"
          className="overflow-hidden rounded-full border border-gray-300 shadow-inner"
        >
          <span className="sr-only">Toggle dashboard menu</span>

          <img
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt=""
            className="size-10 object-cover"
          />
        </button>

        <div
          className="absolute end-0 z-10 mt-0.5 w-56 divide-y divide-gray-100 rounded-md border border-gray-100 bg-white shadow-lg"
          role="menu"
        >
          <div className="p-2">
            <a
              href="#"
              className="block rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              role="menuitem"
            >
              My profile
            </a>

            <a
              href="#"
              className="block rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              role="menuitem"
            >
              Billing summary
            </a>

            <a
              href="#"
              className="block rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              role="menuitem"
            >
              Team settings
            </a>
          </div>

          <div className="p-2">
            <form method="POST" action="#">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                role="menuitem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                  />
                </svg>
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

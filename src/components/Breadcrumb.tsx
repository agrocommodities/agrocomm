import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

function HomeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-4"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="my-4 overflow-hidden" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-white/40 overflow-hidden min-w-0">
        <li>
          <Link
            href="/"
            className="block transition-colors hover:text-white/70"
            aria-label="Home"
          >
            <HomeIcon />
          </Link>
        </li>

        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label} className="contents">
              <span className="rtl:rotate-180">
                <ChevronIcon />
              </span>
              {isLast || !item.href ? (
                <span className="block max-w-[calc(100vw-5rem)] truncate whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="block max-w-[calc(100vw-5rem)] truncate whitespace-nowrap overflow-hidden transition-colors hover:text-white/70"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

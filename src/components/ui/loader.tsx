// interface LoaderProps extends React.ComponentProps<'svg'> {}

interface LoaderProps {
  // size?: number;
  className?: string;
  children?: React.ReactNode;
}

export default function Loader({ className = "", children }: LoaderProps) {
  return (
    <>
      <svg
        className={`mr-2 h-4 w-4 animate-spin ${className}`.trim()}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
      </svg>
      {children}
    </>
  );
}

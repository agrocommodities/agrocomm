interface ButtonProps extends React.ComponentProps<'button'> {
  loading?: boolean;
}

export function Button({ children, loading = false, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`
        flex items-center justify-center cursor-pointer rounded-md 
        border-2 border-solid border-black/[.18] dark:border-white/[.145] 
        transition-colors bg-primary-600 hover:bg-primary-700 focus:outline-none 
        px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 
        dark:focus:ring-primary-800 disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
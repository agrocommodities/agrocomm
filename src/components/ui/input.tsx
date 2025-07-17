export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`
        block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6
        ${className}
      `.trim()}
      {...props}
    />
  );
}

export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`
        block w-full min-w-0 grow p-2.5 text-base dark:text-white
        placeholder:text-gray-400 focus:outline-none
        rounded-lg border-2 border-black/80 focus:border-black/80 
        bg-black/50 dark:bg-black/70 dark:placeholder-gray-400 
        ${className}
      `.trim()}
      {...props}
    />
  );
}

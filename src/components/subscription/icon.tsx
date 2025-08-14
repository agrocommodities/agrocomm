export function Icon({ icon = "" }: { icon: string }) {
  switch (icon) {
    case "check":
      return (
        // <svg
        //   xmlns="http://www.w3.org/2000/svg"
        //   className="w-5 h-5 text-green-400"
        //   viewBox="0 0 20 20"
        //   fill="currentColor"
        // >
        //   <path
        //     fillRule="evenodd"
        //     d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        //     clipRule="evenodd"
        //   />
        // </svg>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#2ec27e" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="lucide lucide-check-icon lucide-check"
        >
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      );
    default:
      return (
        // <svg
        //   xmlns="http://www.w3.org/2000/svg"
        //   className="w-5 h-5 text-red-400"
        //   viewBox="0 0 20 20"
        //   fill="currentColor"
        // >
        //   <path
        //     fillRule="evenodd"
        //     d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        //     clipRule="evenodd"
        //   />
        // </svg>

        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#e01b24" 
          strokeWidth="2" strokeLinecap="round" 
          strokeLinejoin="round" 
          className="lucide lucide-x-icon lucide-x"
        >
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      );
  }
}

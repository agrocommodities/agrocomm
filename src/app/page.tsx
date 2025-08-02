import Image from "next/image";

export default function Home() {
  return (
    <div>
      <Image
        className="h-auto max-w-full"
        src="/images/logo-site.svg"
        alt={process.env.NEXT_PUBLIC_APP_NAME!}
        width={800}
        height={200}
        priority
      />
    </div>
  );
}

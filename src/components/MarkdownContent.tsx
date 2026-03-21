"use client";

import { useEffect, useRef } from "react";
import { setMarkdownHtml } from "@/lib/markdown";

export default function MarkdownContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      setMarkdownHtml(ref.current, content);
    }
  }, [content]);

  return <div ref={ref} className={className} />;
}

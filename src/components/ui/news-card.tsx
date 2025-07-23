import Link from "next/link";
import type { News } from "@/types";

export default function NewsCard({ news }: { news: News }) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-lg">
      {news.imageUrl && (
        <img 
          src={news.imageUrl} 
          alt={news.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2">{news.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{news.summary}</p>
        <div className="flex justify-between items-center">
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            {news.source}
          </span>
          <Link 
            href={news.url}
            target="_blank"
            className="text-blue-500 hover:underline"
          >
            Leia mais
          </Link>
        </div>
      </div>
    </div>
  );
}
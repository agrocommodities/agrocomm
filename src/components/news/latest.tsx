// src/components/news/latest-news.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, ExternalLink } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  url: string;
  source: string;
  summary?: string;
  imageUrl?: string;
  publishedAt: string;
}

interface LatestNewsProps {
  variant?: "main" | "sidebar";
  limit?: number;
}

export function LatestNews({ variant = "main", limit = 10 }: LatestNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`/api/news?limit=${limit}`);
        if (!response.ok) throw new Error("Erro ao carregar notícias");
        
        const data = await response.json();
        setNews(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [limit]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateTitle = (title: string, maxLength: number) => {
    return title.length > maxLength ? title.substring(0, maxLength) + "..." : title;
  };

  if (loading) {
    return (
      <div className="bg-background/80 border-2 border-white/20 rounded-lg p-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4">
        <p className="text-red-300 text-sm">Erro ao carregar notícias: {error}</p>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="bg-background/80 border-2 border-white/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Últimas Notícias
        </h3>
        
        <div className="space-y-3">
          {news.slice(0, 5).map((item) => (
            <div key={item.id} className="group">
              <Link 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block hover:bg-white/5 p-2 rounded transition-colors"
              >
                <div className="flex items-start gap-3">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={60}
                      height={45}
                      className="rounded object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white group-hover:text-green-400 transition-colors line-clamp-2 leading-tight">
                      {truncateTitle(item.title, 100)}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-white/60">{item.source}</span>
                      <span className="text-xs text-white/40">•</span>
                      <span className="text-xs text-white/40">{formatDate(item.publishedAt)}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-white/40 group-hover:text-white/60 flex-shrink-0 mt-1" />
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        {news.length === 0 && (
          <p className="text-white/60 text-sm text-center py-4">
            Nenhuma notícia disponível
          </p>
        )}
      </div>
    );
  }

  // Variant main
  return (
    <div className="bg-background/80 border-2 border-white/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Últimas Notícias
        </h2>
        <span className="text-sm text-white/60">{news.length} notícias</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item) => (
          <article key={item.id} className="group">
            <Link 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block bg-black/20 rounded-lg p-4 hover:bg-black/30 transition-colors h-full"
            >
              {item.imageUrl && (
                <div className="mb-3">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={300}
                    height={200}
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs text-green-400 font-medium bg-green-400/20 px-2 py-1 rounded">
                  {item.source}
                </span>
                <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white/60 flex-shrink-0" />
              </div>
              
              <h3 className="text-white font-semibold mb-2 group-hover:text-green-400 transition-colors line-clamp-3">
                {item.title}
              </h3>
              
              {item.summary && (
                <p className="text-white/70 text-sm mb-3 line-clamp-2">
                  {item.summary}
                </p>
              )}
              
              <time className="text-xs text-white/50">
                {formatDate(item.publishedAt)}
              </time>
            </Link>
          </article>
        ))}
      </div>
      
      {news.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/60">Nenhuma notícia disponível no momento</p>
        </div>
      )}
    </div>
  );
}
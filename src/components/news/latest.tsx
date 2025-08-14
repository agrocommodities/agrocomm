// src/components/news/latest-news.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, ExternalLink } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

interface LatestNewsProps {
  limit?: number;
}

export function LatestNews({ limit = 5 }: LatestNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`/api/news?limit=${limit}`);
        if (response.ok) {
          const data = await response.json();
          setNews(data);
        }
      } catch (err) {
        console.error("Erro ao carregar notícias:", err);
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
    });
  };

  const truncateTitle = (title: string) => {
    return title.length > 70 ? title.substring(0, 70) + "..." : title;
  };

  if (loading) {
    return (
      <div className="bg-background/80 border-2 border-white/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Últimas Notícias
        </h3>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-white/10 rounded mb-1"></div>
              <div className="h-2 bg-white/5 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background/80 border-2 border-white/20 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Últimas Notícias
      </h3>
      
      <div className="space-y-2">
        {news.map((item) => (
          <Link 
            key={item.id}
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block hover:bg-white/5 p-2 rounded transition-colors group"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-white group-hover:text-green-400 transition-colors leading-tight mb-1">
                  {truncateTitle(item.title)}
                </h4>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-green-400 text-xs">{item.source}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/50">{formatDate(item.publishedAt)}</span>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-white/40 group-hover:text-white/60 flex-shrink-0 mt-0.5" />
            </div>
          </Link>
        ))}
      </div>
      
      {news.length === 0 && !loading && (
        <p className="text-white/60 text-xs text-center py-3">
          Nenhuma notícia disponível
        </p>
      )}
    </div>
  );
}
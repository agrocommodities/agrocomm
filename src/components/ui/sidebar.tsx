// src/components/ui/sidebar.tsx
import { LatestNews } from "@/components/news/latest";
import { LatestPrices } from "@/components/prices/latest";

interface SidebarProps {
  showNews?: boolean;
  showPrices?: boolean;
}

export function Sidebar({ showNews = true, showPrices = true }: SidebarProps) {
  return (
    <aside className="space-y-6">
      {showPrices && <LatestPrices variant="sidebar" limit={6} />}
      {showNews && <LatestNews variant="sidebar" limit={5} />}
    </aside>
  );
}
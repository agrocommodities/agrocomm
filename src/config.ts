import {
  Home,
  Beef,
  Wheat,
  Newspaper,
  HelpCircle,
  Info,
  MessageSquare,
  BarChart3,
  ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavChild {
  name: string;
  href: string;
}

export interface NavLink {
  name: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
}

export type NavLinkClient = Omit<NavLink, "icon">;

export const navLinks: NavLink[] = [
  { name: "Início", href: "/", icon: Home },
  {
    name: "Pecuária",
    href: "/cotacoes/pecuaria",
    icon: Beef,
    children: [
      { name: "Boi Gordo", href: "/cotacoes/boi-gordo" },
      { name: "Vaca Gorda", href: "/cotacoes/vaca-gorda" },
    ],
  },
  {
    name: "Grãos",
    href: "/cotacoes/graos",
    icon: Wheat,
    children: [
      { name: "Soja", href: "/cotacoes/soja" },
      { name: "Milho", href: "/cotacoes/milho" },
      { name: "Feijão", href: "/cotacoes/feijao" },
    ],
  },
  { name: "Chicago", href: "/cotacoes/chicago", icon: BarChart3 },
  { name: "Notícias", href: "/noticias", icon: Newspaper },
  { name: "Classificados", href: "/classificados", icon: ShoppingBag },
];

export const footerLinks = [
  { name: "Ajuda", href: "/ajuda", icon: HelpCircle },
  { name: "Sobre", href: "/sobre", icon: Info },
  { name: "Suporte", href: "/suporte", icon: MessageSquare },
];

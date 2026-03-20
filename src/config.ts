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

export const navLinks = [
  { name: "Início", href: "/", icon: Home },
  { name: "Pecuária", href: "/cotacoes/pecuaria", icon: Beef },
  { name: "Grãos", href: "/cotacoes/graos", icon: Wheat },
  { name: "Chicago", href: "/cotacoes/chicago", icon: BarChart3 },
  { name: "Notícias", href: "/noticias", icon: Newspaper },
  { name: "Classificados", href: "/classificados", icon: ShoppingBag },
];

export const footerLinks = [
  { name: "Ajuda", href: "/ajuda", icon: HelpCircle },
  { name: "Sobre", href: "/sobre", icon: Info },
  { name: "Suporte", href: "/suporte", icon: MessageSquare },
];

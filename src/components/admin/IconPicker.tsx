import { useState, useRef, useEffect } from "react";
import { icons, type LucideIcon } from "lucide-react";
import { Search, X } from "lucide-react";

const CURATED_ICONS = [
  "Shield",
  "ShieldCheck",
  "ShieldAlert",
  "Lock",
  "Crown",
  "Star",
  "Award",
  "Badge",
  "BadgeCheck",
  "Gem",
  "Heart",
  "Zap",
  "Flame",
  "Sparkles",
  "Sun",
  "Moon",
  "Eye",
  "EyeOff",
  "Key",
  "KeyRound",
  "Fingerprint",
  "UserCheck",
  "UserCog",
  "UserPlus",
  "Users",
  "User",
  "CircleUser",
  "Contact",
  "Headphones",
  "Megaphone",
  "Bell",
  "MessageSquare",
  "Mail",
  "AtSign",
  "Globe",
  "Flag",
  "Bookmark",
  "Tag",
  "Hash",
  "Wrench",
  "Settings",
  "Cog",
  "Hammer",
  "Paintbrush",
  "Palette",
  "Pen",
  "PenTool",
  "Code",
  "Terminal",
  "Database",
  "Server",
  "HardDrive",
  "Cpu",
  "Wifi",
  "Radio",
  "Truck",
  "Tractor",
  "Wheat",
  "Leaf",
  "TreePine",
  "Sprout",
  "Apple",
  "Beef",
  "Egg",
  "Fish",
  "Bug",
  "Bird",
  "Cat",
  "Dog",
  "Briefcase",
  "Building",
  "Building2",
  "Landmark",
  "Store",
  "Factory",
  "Warehouse",
  "Home",
  "MapPin",
  "Map",
  "Compass",
  "Navigation",
  "Rocket",
  "Plane",
  "Ship",
  "Car",
  "Bike",
  "Gauge",
  "BarChart3",
  "TrendingUp",
  "PieChart",
  "Activity",
  "Target",
  "Crosshair",
  "Swords",
  "Wand2",
  "Bot",
  "Brain",
  "Lightbulb",
  "GraduationCap",
  "BookOpen",
  "Library",
  "FileText",
  "ClipboardList",
  "Calendar",
  "Clock",
  "Timer",
  "Hourglass",
  "Gift",
  "Trophy",
  "Medal",
  "Music",
  "Camera",
  "Image",
  "Video",
  "Mic",
  "Phone",
  "Smartphone",
  "Monitor",
  "Laptop",
  "Printer",
  "Download",
  "Upload",
  "Cloud",
  "Umbrella",
  "Snowflake",
  "Droplets",
  "Wind",
  "Mountain",
  "CircleDollarSign",
  "Coins",
  "Banknote",
  "Wallet",
  "CreditCard",
  "Receipt",
  "Scale",
  "Gavel",
  "ScrollText",
  "FileCheck",
  "FolderOpen",
  "Package",
  "Box",
  "Layers",
  "LayoutGrid",
  "Grid3X3",
  "Puzzle",
  "Blocks",
  "Hexagon",
  "Pentagon",
  "Triangle",
  "Circle",
  "Square",
  "Diamond",
  "Infinity",
  "Power",
  "Bolt",
  "Anchor",
  "Glasses",
  "Handshake",
] as const;

// Filter to only icons that actually exist in lucide-react
const AVAILABLE_ICONS = CURATED_ICONS.filter((name) => name in icons);

export function RoleIconRenderer({
  iconName,
  className,
}: {
  iconName: string;
  className?: string;
}) {
  const IconComponent = icons[iconName as keyof typeof icons] as
    | LucideIcon
    | undefined;
  if (!IconComponent) {
    const Fallback = icons.Shield;
    return <Fallback className={className} />;
  }
  return <IconComponent className={className} />;
}

export default function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (iconName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = search
    ? AVAILABLE_ICONS.filter((name) =>
        name.toLowerCase().includes(search.toLowerCase()),
      )
    : AVAILABLE_ICONS;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 transition-colors text-sm"
      >
        <RoleIconRenderer iconName={value} className="w-4 h-4" />
        <span className="text-white/60">Alterar ícone</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-[#2a3326] border border-white/20 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ícone…"
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-3 grid grid-cols-8 gap-1">
            {filtered.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  setSearch("");
                }}
                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                  value === name
                    ? "bg-green-600/30 text-green-400 ring-1 ring-green-500/50"
                    : "hover:bg-white/10 text-white/60 hover:text-white"
                }`}
                title={name}
              >
                <RoleIconRenderer iconName={name} className="w-4 h-4" />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-8 text-center text-sm text-white/40 py-4">
                Nenhum ícone encontrado
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

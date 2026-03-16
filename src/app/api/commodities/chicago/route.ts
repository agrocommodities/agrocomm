import { NextResponse } from "next/server";

const COMMODITIES = [
  {
    key: "soja",
    symbol: "ZS=F",
    name: "Soja",
    unit: "USD/bushel",
    category: "graos",
  },
  {
    key: "milho",
    symbol: "ZC=F",
    name: "Milho",
    unit: "USD/bushel",
    category: "graos",
  },
  {
    key: "trigo",
    symbol: "ZW=F",
    name: "Trigo",
    unit: "USD/bushel",
    category: "graos",
  },
  {
    key: "farelo-soja",
    symbol: "ZM=F",
    name: "Farelo de Soja",
    unit: "USD/ton",
    category: "graos",
  },
  {
    key: "oleo-soja",
    symbol: "ZL=F",
    name: "Óleo de Soja",
    unit: "USD/lb",
    category: "graos",
  },
  {
    key: "boi",
    symbol: "LE=F",
    name: "Boi Gordo",
    unit: "USD/lb",
    category: "pecuaria",
  },
  {
    key: "porco",
    symbol: "HE=F",
    name: "Suíno Magro",
    unit: "USD/lb",
    category: "pecuaria",
  },
  {
    key: "boi-alimentacao",
    symbol: "GF=F",
    name: "Boi de Engorda",
    unit: "USD/lb",
    category: "pecuaria",
  },
  {
    key: "cafe",
    symbol: "KC=F",
    name: "Café Arábica",
    unit: "USD/lb",
    category: "outros",
  },
  {
    key: "acucar",
    symbol: "SB=F",
    name: "Açúcar",
    unit: "USD/lb",
    category: "outros",
  },
  {
    key: "algodao",
    symbol: "CT=F",
    name: "Algodão",
    unit: "USD/lb",
    category: "outros",
  },
];

async function fetchExchangeRate(): Promise<number | null> {
  try {
    const url =
      "https://query1.finance.yahoo.com/v8/finance/chart/BRL=X?range=1d&interval=1d";
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof rate === "number" ? Math.round(rate * 10000) / 10000 : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const results: Record<string, unknown> = {};

  const exchangeRate = await fetchExchangeRate();

  const fetches = COMMODITIES.map(async (c) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${c.symbol}?range=5d&interval=1h`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(10_000),
        next: { revalidate: 60 },
      });
      if (!res.ok) {
        results[c.key] = null;
        return;
      }
      const data = await res.json();
      const meta = data.chart?.result?.[0]?.meta;
      const closes: number[] =
        data.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(
          (v: unknown) => v != null,
        ) ?? [];

      if (meta && closes.length > 0) {
        const rawPrice = meta.regularMarketPrice ?? closes[closes.length - 1];
        const rawPrevClose =
          meta.previousClose ?? meta.chartPreviousClose ?? closes[0];
        const isUSX = meta.currency === "USX";
        const divisor = isUSX ? 100 : 1;
        const price = rawPrice / divisor;
        const prevClose = rawPrevClose / divisor;
        const change = price - prevClose;
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;

        results[c.key] = {
          name: c.name,
          unit: c.unit,
          symbol: c.symbol,
          category: c.category,
          currency: "USD",
          price: Math.round(price * 100) / 100,
          change: Math.round(change * 10000) / 10000,
          changePercent: Math.round(changePercent * 100) / 100,
          history: closes
            .slice(-24)
            .map((v: number) => Math.round((v / divisor) * 100) / 100),
          exchangeRate,
          timestamp: Date.now(),
        };
      } else {
        results[c.key] = null;
      }
    } catch {
      results[c.key] = null;
    }
  });

  await Promise.all(fetches);

  return NextResponse.json(results);
}

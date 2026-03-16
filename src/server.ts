import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const port = parseInt(process.env.PORT || "4000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: { origin: dev ? "*" : "https://agrocomm.com.br" },
  });

  io.on("connection", (socket) => {
    socket.on("subscribe:commodity", (commodity: string) => {
      socket.join(`commodity:${commodity}`);
    });

    socket.on("unsubscribe:commodity", (commodity: string) => {
      socket.leave(`commodity:${commodity}`);
    });
  });

  // Broadcast commodity price updates every 60 seconds
  const COMMODITIES = [
    { key: "soja", symbol: "ZS=F" },
    { key: "milho", symbol: "ZC=F" },
    { key: "boi", symbol: "LE=F" },
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
      });
      if (!res.ok) return null;
      const data = await res.json();
      const rate = data.chart?.result?.[0]?.meta?.regularMarketPrice;
      return typeof rate === "number" ? Math.round(rate * 10000) / 10000 : null;
    } catch {
      return null;
    }
  }

  async function fetchCommodityPrices() {
    const results: Record<
      string,
      {
        price: number;
        change: number;
        changePercent: number;
        history: number[];
        currency: string;
      } | null
    > = {};

    for (const c of COMMODITIES) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${c.symbol}?range=5d&interval=1h`;
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
          results[c.key] = null;
          continue;
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
            price: Math.round(price * 100) / 100,
            change: Math.round(change * 10000) / 10000,
            changePercent: Math.round(changePercent * 100) / 100,
            history: closes
              .slice(-24)
              .map((v: number) => Math.round((v / divisor) * 100) / 100),
            currency: "USD",
          };
        } else {
          results[c.key] = null;
        }
      } catch {
        results[c.key] = null;
      }
    }

    return results;
  }

  // Initial fetch + interval
  let latestPrices: Record<string, unknown> = {};
  let latestExchangeRate: number | null = null;

  async function broadcastPrices() {
    try {
      latestPrices = await fetchCommodityPrices();
      latestExchangeRate = await fetchExchangeRate();
      for (const c of COMMODITIES) {
        const data = latestPrices[c.key];
        if (data) {
          io.to(`commodity:${c.key}`).emit("commodity:update", {
            commodity: c.key,
            ...data,
            exchangeRate: latestExchangeRate,
            timestamp: Date.now(),
          });
        }
      }
    } catch {
      // silently ignore broadcast errors
    }
  }

  // Fetch on startup, then every 60s
  broadcastPrices();
  setInterval(broadcastPrices, 60_000);

  // Expose latest prices via a simple handler for SSR fallback
  // @ts-expect-error attaching to global for internal use
  globalThis.__agrocomm_io = io;
  // @ts-expect-error attaching to global for internal use
  globalThis.__agrocomm_prices = () => latestPrices;
  // @ts-expect-error attaching to global for internal use
  globalThis.__agrocomm_exchange_rate = () => latestExchangeRate;

  httpServer.listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`,
  );
});

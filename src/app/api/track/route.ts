import { db } from "@/db";
import { pageViews } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const path = typeof body.path === "string" ? body.path.slice(0, 500) : "/";
    const referrer =
      typeof body.referrer === "string" ? body.referrer.slice(0, 1000) : null;
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null;

    // Don't track API or admin routes
    if (path.startsWith("/api") || path.startsWith("/admin")) {
      return new Response(null, { status: 204 });
    }

    await db.insert(pageViews).values({ path, referrer, sessionId });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}

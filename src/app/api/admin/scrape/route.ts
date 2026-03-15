import { getSession } from "@/lib/auth";
import { runFullScrape } from "@/lib/scraper";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const force = body.force === true;
    const results = await runFullScrape({ force });
    return Response.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return Response.json({ error: message }, { status: 500 });
  }
}

import { getSession } from "@/lib/auth";
import { runNewsScrape } from "@/lib/scraper";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const result = await runNewsScrape();
    return Response.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return Response.json({ error: message }, { status: 500 });
  }
}

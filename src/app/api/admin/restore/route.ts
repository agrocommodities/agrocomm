import { getSession, getUserPermissions } from "@/lib/auth";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }
  const perms = await getUserPermissions(session.userId);
  if (!perms.has("admin.access")) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Arquivo não enviado" }, { status: 400 });
  }
  if (!file.name.endsWith(".zip")) {
    return Response.json(
      { error: "Apenas arquivos .zip são aceitos" },
      { status: 400 },
    );
  }

  const cwd = process.cwd();

  const dbEnv = process.env.DB_FILE_NAME ?? "file:drizzle/agrocomm.db";
  const dbRelative = dbEnv.replace(/^file:/, "");
  const dbPath = path.isAbsolute(dbRelative)
    ? dbRelative
    : path.join(/*turbopackIgnore: true*/ cwd, dbRelative);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    return Response.json({ error: "Arquivo ZIP inválido" }, { status: 400 });
  }

  const entries = zip.getEntries();
  const entryNames = entries.map((e) => e.entryName);

  const hasDb = entryNames.some((n) => n === "database/agrocomm.db");
  const hasMedia = entryNames.some((n) => n.startsWith("media/"));

  if (!hasDb && !hasMedia) {
    return Response.json(
      { error: "ZIP não contém arquivos de backup reconhecidos" },
      { status: 400 },
    );
  }

  // Make a backup of current DB before overwriting
  if (hasDb) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const backupDir = path.join(
      /*turbopackIgnore: true*/ cwd,
      "drizzle/backups",
    );
    await mkdir(backupDir, { recursive: true });
    try {
      await copyFile(
        dbPath,
        path.join(backupDir, `agrocomm-pre-restore-${timestamp}.db`),
      );
    } catch {
      // DB might not exist yet, ignore
    }
  }

  const restored: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName;

    if (name === "database/agrocomm.db") {
      const dir = path.dirname(dbPath);
      await mkdir(dir, { recursive: true });
      await writeFile(dbPath, entry.getData());
      restored.push("banco de dados");
      continue;
    }

    const mediaPrefix = "media/";
    if (name.startsWith(mediaPrefix)) {
      const relative = name.slice(mediaPrefix.length);
      const destPath = path.join(
        /*turbopackIgnore: true*/ cwd,
        "public/images",
        relative,
      );
      await mkdir(path.dirname(destPath), { recursive: true });
      await writeFile(destPath, entry.getData());
    }
  }

  if (hasMedia) {
    restored.push("mídias");
  }

  return Response.json({
    ok: true,
    message: `Restaurado com sucesso: ${restored.join(", ")}.`,
  });
}

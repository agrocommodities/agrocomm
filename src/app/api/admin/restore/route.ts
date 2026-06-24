import { getSession, getUserPermissions } from "@/lib/auth";
import { createClient } from "@libsql/client";
import { copyFile, mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";

export const maxDuration = 60;

type RestoreSummary = {
  restored: string[];
  savedSqlPath?: string;
};

function normalizeExt(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

function resolveLocalSqlitePath(cwd: string): string | null {
  const dbEnv = process.env.DB_FILE_NAME ?? "file:drizzle/agrocomm.db";

  if (/^(https?|libsql):/i.test(dbEnv)) {
    return null;
  }

  const dbRelative = dbEnv.replace(/^file:/i, "");
  return path.isAbsolute(dbRelative)
    ? dbRelative
    : path.join(/*turbopackIgnore: true*/ cwd, dbRelative);
}

async function backupCurrentDbIfExists(cwd: string, dbPath: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupDir = path.join(/*turbopackIgnore: true*/ cwd, "drizzle/backups");
  await mkdir(backupDir, { recursive: true });

  try {
    await stat(dbPath);
    await copyFile(
      dbPath,
      path.join(backupDir, `agrocomm-pre-restore-${timestamp}.db`),
    );
  } catch {
    // DB might not exist yet.
  }

  return { backupDir, timestamp };
}

function splitSqlStatements(sqlText: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sqlText.length; i++) {
    const char = sqlText[i];
    const next = sqlText[i + 1] ?? "";

    if (inLineComment) {
      current += char;
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        i++;
        inBlockComment = false;
      }
      continue;
    }

    if (!inSingle && !inDouble && char === "-" && next === "-") {
      current += char + next;
      i++;
      inLineComment = true;
      continue;
    }

    if (!inSingle && !inDouble && char === "/" && next === "*") {
      current += char + next;
      i++;
      inBlockComment = true;
      continue;
    }

    if (!inDouble && char === "'") {
      current += char;
      if (inSingle && next === "'") {
        current += next;
        i++;
        continue;
      }
      inSingle = !inSingle;
      continue;
    }

    if (!inSingle && char === '"') {
      current += char;
      if (inDouble && next === '"') {
        current += next;
        i++;
        continue;
      }
      inDouble = !inDouble;
      continue;
    }

    if (!inSingle && !inDouble && char === ";") {
      const statement = current.trim();
      if (statement.length > 0) {
        statements.push(statement);
      }
      current = "";
      continue;
    }

    current += char;
  }

  const trailing = current.trim();
  if (trailing.length > 0) {
    statements.push(trailing);
  }

  return statements;
}

async function restoreSqlIntoSqlite({
  sqlText,
  dbPath,
  backupDir,
  timestamp,
}: {
  sqlText: string;
  dbPath: string;
  backupDir: string;
  timestamp: string;
}) {
  const tempDbPath = path.join(
    backupDir,
    `agrocomm-restore-temp-${timestamp}.db`,
  );
  await rm(tempDbPath, { force: true });

  const statements = splitSqlStatements(sqlText);
  const client = createClient({ url: `file:${tempDbPath}` });

  try {
    await client.migrate(statements);
  } finally {
    client.close();
  }

  await mkdir(path.dirname(dbPath), { recursive: true });
  await copyFile(tempDbPath, dbPath);
  await rm(tempDbPath, { force: true });
}

function resolveMediaDestination(
  cwd: string,
  relativePath: string,
): string | null {
  const normalized = path.posix.normalize(relativePath);
  if (
    normalized.startsWith("../") ||
    normalized.includes("/../") ||
    normalized === ".."
  ) {
    return null;
  }

  const root = path.join(/*turbopackIgnore: true*/ cwd, "public/images");
  const destPath = path.resolve(root, normalized);

  if (!destPath.startsWith(`${root}${path.sep}`) && destPath !== root) {
    return null;
  }

  return destPath;
}

async function restoreFromZip({
  zip,
  cwd,
  dbPath,
}: {
  zip: AdmZip;
  cwd: string;
  dbPath: string | null;
}): Promise<RestoreSummary> {
  const entries = zip.getEntries();
  const entryNames = entries.map((entry) => entry.entryName);

  const hasDb = entryNames.some((name) => name === "database/agrocomm.db");
  const hasSql = entryNames.some((name) => name === "database/agrocomm.sql");
  const hasMedia = entryNames.some((name) => name.startsWith("media/"));

  if (!hasDb && !hasSql && !hasMedia) {
    throw new Error("ZIP não contém arquivos de backup reconhecidos");
  }

  if ((hasDb || hasSql) && !dbPath) {
    throw new Error(
      "Restauração de banco requer DB local SQLite (DB_FILE_NAME em file:).",
    );
  }

  let savedSqlPath: string | undefined;
  const restored = new Set<string>();

  if ((hasDb || hasSql) && dbPath) {
    const { backupDir, timestamp } = await backupCurrentDbIfExists(cwd, dbPath);

    const dbEntry = entries.find(
      (entry) => entry.entryName === "database/agrocomm.db",
    );
    const sqlEntry = entries.find(
      (entry) => entry.entryName === "database/agrocomm.sql",
    );

    if (dbEntry) {
      await mkdir(path.dirname(dbPath), { recursive: true });
      await writeFile(dbPath, dbEntry.getData());
      restored.add("banco de dados (.db)");
    } else if (sqlEntry) {
      const sqlText = sqlEntry.getData().toString("utf8");
      const savedPath = path.join(
        backupDir,
        `agrocomm-restore-${timestamp}.sql`,
      );
      await writeFile(savedPath, sqlText, "utf8");
      savedSqlPath = savedPath;
      await restoreSqlIntoSqlite({
        sqlText,
        dbPath,
        backupDir,
        timestamp,
      });
      restored.add("banco de dados (.sql)");
    }
  }

  if (hasMedia) {
    for (const entry of entries) {
      if (entry.isDirectory || !entry.entryName.startsWith("media/")) {
        continue;
      }
      const relative = entry.entryName.slice("media/".length);
      if (!relative) {
        continue;
      }
      const destination = resolveMediaDestination(cwd, relative);
      if (!destination) {
        continue;
      }
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, entry.getData());
    }
    restored.add("mídias");
  }

  return {
    restored: [...restored],
    savedSqlPath,
  };
}

async function restoreDirectFile({
  fileName,
  buffer,
  cwd,
  dbPath,
}: {
  fileName: string;
  buffer: Buffer;
  cwd: string;
  dbPath: string | null;
}): Promise<RestoreSummary> {
  const ext = normalizeExt(fileName);
  if (!dbPath) {
    throw new Error(
      "Restauração de banco requer DB local SQLite (DB_FILE_NAME em file:).",
    );
  }

  const { backupDir, timestamp } = await backupCurrentDbIfExists(cwd, dbPath);

  if (ext === ".db" || ext === ".sqlite") {
    await mkdir(path.dirname(dbPath), { recursive: true });
    await writeFile(dbPath, buffer);
    return { restored: ["banco de dados (.db)"] };
  }

  if (ext === ".sql") {
    const sqlText = buffer.toString("utf8");
    const savedSqlPath = path.join(
      backupDir,
      `agrocomm-restore-${timestamp}.sql`,
    );
    await writeFile(savedSqlPath, sqlText, "utf8");
    await restoreSqlIntoSqlite({
      sqlText,
      dbPath,
      backupDir,
      timestamp,
    });
    return {
      restored: ["banco de dados (.sql)"],
      savedSqlPath,
    };
  }

  throw new Error("Formato de arquivo não suportado");
}

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

  const ext = normalizeExt(file.name);
  const supported = new Set([".zip", ".db", ".sqlite", ".sql"]);
  if (!supported.has(ext)) {
    return Response.json(
      { error: "Formatos aceitos: .zip, .db, .sqlite, .sql" },
      { status: 400 },
    );
  }

  const cwd = process.cwd();
  const dbPath = resolveLocalSqlitePath(cwd);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    let summary: RestoreSummary;

    if (ext === ".zip") {
      let zip: AdmZip;
      try {
        zip = new AdmZip(buffer);
      } catch {
        return Response.json(
          { error: "Arquivo ZIP inválido" },
          { status: 400 },
        );
      }
      summary = await restoreFromZip({ zip, cwd, dbPath });
    } else {
      summary = await restoreDirectFile({
        fileName: file.name,
        buffer,
        cwd,
        dbPath,
      });
    }

    if (summary.restored.length === 0) {
      return Response.json(
        {
          error:
            "Nenhum conteúdo restaurável foi encontrado no arquivo enviado.",
        },
        { status: 400 },
      );
    }

    const sqlNote =
      summary.savedSqlPath &&
      summary.restored.some((item) => item.includes(".sql"))
        ? ` Arquivo SQL também salvo em ${summary.savedSqlPath} para referência em migração para Postgres.`
        : "";

    return Response.json({
      ok: true,
      message: `Restaurado com sucesso: ${summary.restored.join(", ")}.${sqlNote}`,
    });
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Erro ao restaurar backup.",
      },
      { status: 400 },
    );
  }
}

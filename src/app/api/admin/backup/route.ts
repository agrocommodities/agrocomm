import { getSession, getUserPermissions } from "@/lib/auth";
import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { Readable, PassThrough } from "node:stream";
import archiver from "archiver";

async function dirExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function addDirIfExists(
  archive: archiver.Archiver,
  dir: string,
  archivePath: string,
) {
  if (await dirExists(dir)) {
    // Only add if directory has actual files
    const entries = await readdir(dir, { recursive: true });
    const hasFiles = entries.some((e) => !e.startsWith("."));
    if (hasFiles) {
      archive.directory(dir, archivePath);
    }
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }
  const perms = await getUserPermissions(session.userId);
  if (!perms.has("admin.access")) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  const cwd = process.cwd();

  // Resolve DB path from env (strips "file:" prefix)
  const dbEnv = process.env.DB_FILE_NAME ?? "file:drizzle/agrocomm.db";
  const dbRelative = dbEnv.replace(/^file:/, "");
  const dbPath = path.isAbsolute(dbRelative)
    ? dbRelative
    : path.join(/*turbopackIgnore: true*/ cwd, dbRelative);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `agrocomm-backup-${timestamp}.zip`;

  const archive = archiver("zip", { zlib: { level: 6 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  // Database
  if (existsSync(dbPath)) {
    archive.file(dbPath, { name: "database/agrocomm.db" });
  }

  // User-uploaded media only
  const mediaDirs = [
    {
      dir: path.join(/*turbopackIgnore: true*/ cwd, "public/images/avatars"),
      archive: "media/avatars",
    },
    {
      dir: path.join(
        /*turbopackIgnore: true*/ cwd,
        "public/images/classifieds",
      ),
      archive: "media/classifieds",
    },
    {
      dir: path.join(/*turbopackIgnore: true*/ cwd, "public/images/posts"),
      archive: "media/posts",
    },
  ];

  for (const { dir, archive: archivePath } of mediaDirs) {
    await addDirIfExists(archive, dir, archivePath);
  }

  archive.finalize();

  const nodeReadable = Readable.from(passthrough);
  const webStream = new ReadableStream({
    start(controller) {
      nodeReadable.on("data", (chunk: Buffer) => {
        controller.enqueue(chunk);
      });
      nodeReadable.on("end", () => controller.close());
      nodeReadable.on("error", (err) => controller.error(err));
    },
  });

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

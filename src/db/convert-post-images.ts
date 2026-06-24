import "dotenv/config";
import type { Dirent } from "node:fs";
import { readdir, rename, stat, unlink } from "node:fs/promises";
import { extname, join } from "node:path";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { newsArticles } from "./schema";

const db = drizzle(process.env.DB_FILE_NAME!);

const POSTS_DIR = join(process.cwd(), "public", "images", "posts");
const CONVERTIBLE_EXT = new Set([".jpg", ".jpeg", ".png", ".gif"]);

async function* walk(dir: string): AsyncGenerator<string> {
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

async function updateImageUrlInDb(
  oldUrl: string,
  newUrl: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: newsArticles.id })
    .from(newsArticles)
    .where(eq(newsArticles.imageUrl, oldUrl));
  if (rows.length === 0) return true; // not referenced (e.g. orphan file); safe to convert anyway
  for (const row of rows) {
    await db
      .update(newsArticles)
      .set({ imageUrl: newUrl })
      .where(eq(newsArticles.id, row.id));
  }
  return true;
}

async function convertFile(
  filePath: string,
): Promise<"converted" | "skipped-animated" | "skipped-error"> {
  const ext = extname(filePath).toLowerCase();
  const newPath = `${filePath.slice(0, -ext.length)}.webp`;

  try {
    const image = sharp(filePath, { animated: true });
    const metadata = await image.metadata();
    const isAnimated = (metadata.pages ?? 1) > 1;
    if (isAnimated) {
      console.log(`[skip-animated] ${filePath}`);
      return "skipped-animated";
    }

    const originalSize = (await stat(filePath)).size;
    const webpBuffer = await image.webp({ quality: 80, effort: 4 }).toBuffer();

    // Verify the converted buffer is a valid, decodable image before touching anything on disk.
    const verify = await sharp(webpBuffer).metadata();
    if (!verify.width || !verify.height) {
      throw new Error("converted buffer failed verification");
    }

    const tmpPath = `${newPath}.tmp`;
    await sharp(webpBuffer).toFile(tmpPath);
    await rename(tmpPath, newPath);

    const relOld = `/images/posts${filePath.slice(POSTS_DIR.length)}`;
    const relNew = `/images/posts${newPath.slice(POSTS_DIR.length)}`;

    await updateImageUrlInDb(relOld, relNew);

    // Only delete the original once the new file exists and the DB has been updated.
    await unlink(filePath);

    const newSize = (await stat(newPath)).size;
    console.log(
      `[converted] ${filePath} -> ${newPath} (${originalSize}B -> ${newSize}B, ` +
        `${Math.round((1 - newSize / originalSize) * 100)}% smaller)`,
    );
    return "converted";
  } catch (err) {
    console.error(
      `[error] ${filePath}:`,
      err instanceof Error ? err.message : err,
    );
    return "skipped-error";
  }
}

async function main() {
  const stats = {
    converted: 0,
    skippedAnimated: 0,
    skippedError: 0,
    skippedExt: 0,
  };

  for await (const filePath of walk(POSTS_DIR)) {
    const ext = extname(filePath).toLowerCase();
    if (!CONVERTIBLE_EXT.has(ext)) {
      stats.skippedExt++;
      continue;
    }
    const result = await convertFile(filePath);
    if (result === "converted") stats.converted++;
    else if (result === "skipped-animated") stats.skippedAnimated++;
    else stats.skippedError++;
  }

  console.log("\n=== Conversão concluída ===");
  console.log(`Convertidas para webp: ${stats.converted}`);
  console.log(`Ignoradas (animadas):  ${stats.skippedAnimated}`);
  console.log(`Ignoradas (já webp):   ${stats.skippedExt}`);
  console.log(`Erros:                 ${stats.skippedError}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

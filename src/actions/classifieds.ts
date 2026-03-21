"use server";

import { db } from "@/db";
import {
  classifieds,
  classifiedImages,
  classifiedComments,
  classifiedCategories,
  notifications,
  states,
  cities,
  users,
} from "@/db/schema";
import { eq, desc, and, like, inArray, count } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { moderateText } from "@/lib/moderation";
import { logAction } from "@/lib/moderation";
import { writeFile, mkdir, unlink, readdir, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClassifiedItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  previousPrice: number | null;
  status: string;
  createdAt: string;
  userName: string;
  userId: number;
  categoryName: string;
  categorySlug: string;
  stateName: string;
  stateCode: string;
  cityName: string;
  images: { id: number; url: string; position: number }[];
  commentCount: number;
}

export interface ClassifiedDetail extends ClassifiedItem {
  categoryId: number;
  stateId: number;
  cityId: number;
  comments: {
    id: number;
    content: string;
    userName: string;
    userId: number;
    createdAt: string;
    updatedAt: string | null;
  }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Public queries ────────────────────────────────────────────────────────────

export async function getClassifiedCategories() {
  return db
    .select()
    .from(classifiedCategories)
    .orderBy(classifiedCategories.name);
}

export async function getClassifieds(
  opts: {
    categorySlug?: string;
    stateCode?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 12;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [eq(classifieds.status, "approved")];

  if (opts.categorySlug) {
    const [cat] = await db
      .select({ id: classifiedCategories.id })
      .from(classifiedCategories)
      .where(eq(classifiedCategories.slug, opts.categorySlug))
      .limit(1);
    if (cat) conditions.push(eq(classifieds.categoryId, cat.id));
  }

  if (opts.stateCode) {
    const [st] = await db
      .select({ id: states.id })
      .from(states)
      .where(eq(states.code, opts.stateCode))
      .limit(1);
    if (st) conditions.push(eq(classifieds.stateId, st.id));
  }

  if (opts.search) {
    conditions.push(like(classifieds.title, `%${opts.search}%`));
  }

  const whereClause =
    conditions.length === 1 ? conditions[0] : and(...conditions);

  // Get total
  const [{ total }] = await db
    .select({ total: count() })
    .from(classifieds)
    .where(whereClause);

  // Get items
  const rows = await db
    .select({
      id: classifieds.id,
      title: classifieds.title,
      slug: classifieds.slug,
      description: classifieds.description,
      price: classifieds.price,
      previousPrice: classifieds.previousPrice,
      status: classifieds.status,
      createdAt: classifieds.createdAt,
      userId: classifieds.userId,
      userName: users.name,
      categoryName: classifiedCategories.name,
      categorySlug: classifiedCategories.slug,
      stateName: states.name,
      stateCode: states.code,
      cityName: cities.name,
    })
    .from(classifieds)
    .innerJoin(users, eq(classifieds.userId, users.id))
    .innerJoin(
      classifiedCategories,
      eq(classifieds.categoryId, classifiedCategories.id),
    )
    .innerJoin(states, eq(classifieds.stateId, states.id))
    .innerJoin(cities, eq(classifieds.cityId, cities.id))
    .where(whereClause)
    .orderBy(desc(classifieds.createdAt))
    .limit(limit)
    .offset(offset);

  // Get images for all items
  const ids = rows.map((r) => r.id);
  const images =
    ids.length > 0
      ? await db
          .select()
          .from(classifiedImages)
          .where(inArray(classifiedImages.classifiedId, ids))
          .orderBy(classifiedImages.position)
      : [];

  // Get comment counts
  const commentCounts =
    ids.length > 0
      ? await db
          .select({
            classifiedId: classifiedComments.classifiedId,
            count: count(),
          })
          .from(classifiedComments)
          .where(inArray(classifiedComments.classifiedId, ids))
          .groupBy(classifiedComments.classifiedId)
      : [];

  const commentMap = new Map(
    commentCounts.map((c) => [c.classifiedId, c.count]),
  );

  const items: ClassifiedItem[] = rows.map((r) => ({
    ...r,
    images: images.filter((i) => i.classifiedId === r.id),
    commentCount: commentMap.get(r.id) ?? 0,
  }));

  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getClassifiedBySlug(
  slug: string,
): Promise<ClassifiedDetail | null> {
  const [row] = await db
    .select({
      id: classifieds.id,
      title: classifieds.title,
      slug: classifieds.slug,
      description: classifieds.description,
      price: classifieds.price,
      previousPrice: classifieds.previousPrice,
      status: classifieds.status,
      createdAt: classifieds.createdAt,
      userId: classifieds.userId,
      userName: users.name,
      categoryId: classifieds.categoryId,
      categoryName: classifiedCategories.name,
      categorySlug: classifiedCategories.slug,
      stateId: classifieds.stateId,
      stateName: states.name,
      stateCode: states.code,
      cityId: classifieds.cityId,
      cityName: cities.name,
    })
    .from(classifieds)
    .innerJoin(users, eq(classifieds.userId, users.id))
    .innerJoin(
      classifiedCategories,
      eq(classifieds.categoryId, classifiedCategories.id),
    )
    .innerJoin(states, eq(classifieds.stateId, states.id))
    .innerJoin(cities, eq(classifieds.cityId, cities.id))
    .where(eq(classifieds.slug, slug))
    .limit(1);

  if (!row) return null;

  // Only show approved or owner's own
  const session = await getSession();
  if (
    row.status !== "approved" &&
    (!session || (session.userId !== row.userId && session.role !== "admin"))
  ) {
    return null;
  }

  const images = await db
    .select()
    .from(classifiedImages)
    .where(eq(classifiedImages.classifiedId, row.id))
    .orderBy(classifiedImages.position);

  const comments = await db
    .select({
      id: classifiedComments.id,
      content: classifiedComments.content,
      userName: users.name,
      userId: classifiedComments.userId,
      createdAt: classifiedComments.createdAt,
      updatedAt: classifiedComments.updatedAt,
    })
    .from(classifiedComments)
    .innerJoin(users, eq(classifiedComments.userId, users.id))
    .where(eq(classifiedComments.classifiedId, row.id))
    .orderBy(desc(classifiedComments.createdAt));

  return {
    ...row,
    images,
    comments,
    commentCount: comments.length,
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createClassified(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean; slug?: string }> {
  const session = await getSession();
  if (!session) return { error: "Faça login para publicar um anúncio." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceStr = String(formData.get("price") ?? "").trim();
  const categoryId = Number(formData.get("categoryId"));
  const stateId = Number(formData.get("stateId"));
  const cityId = Number(formData.get("cityId"));

  if (
    !title ||
    !description ||
    !priceStr ||
    !categoryId ||
    !stateId ||
    !cityId
  ) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  if (title.length > 120)
    return { error: "Título muito longo (máx. 120 caracteres)." };
  if (description.length > 5000)
    return { error: "Descrição muito longa (máx. 5000 caracteres)." };

  const price = Number.parseFloat(
    priceStr.replace(/\./g, "").replace(",", "."),
  );
  if (Number.isNaN(price) || price <= 0) return { error: "Valor inválido." };

  const slug = `${slugify(title)}-${randomUUID().slice(0, 8)}`;

  // Moderate description
  const modResult = await moderateText(
    description,
    session.userId,
    `classified:new`,
  );

  const [inserted] = await db
    .insert(classifieds)
    .values({
      userId: session.userId,
      categoryId,
      title,
      slug,
      description: modResult.text,
      price,
      stateId,
      cityId,
      status: session.role === "admin" ? "approved" : "pending",
    })
    .returning({ id: classifieds.id });

  // Handle image uploads
  const files = formData.getAll("images");
  let position = 0;
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;
    if (file.size > 5 * 1024 * 1024) continue; // skip files > 5MB
    if (!file.type.startsWith("image/")) continue;

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const dir = join(
      process.cwd(),
      "public",
      "images",
      "classifieds",
      String(inserted.id),
    );
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);

    await db.insert(classifiedImages).values({
      classifiedId: inserted.id,
      url: `/images/classifieds/${inserted.id}/${filename}`,
      position: position++,
    });
  }

  await logAction("classified_created", {
    userId: session.userId,
    target: `classified:${inserted.id}`,
    details: JSON.stringify({ title, price }),
  });

  return { success: true, slug };
}

export async function addComment(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "Faça login para comentar." };

  const classifiedId = Number(formData.get("classifiedId"));
  const content = String(formData.get("content") ?? "").trim();

  if (!classifiedId || !content)
    return { error: "Comentário não pode ser vazio." };
  if (content.length > 2000)
    return { error: "Comentário muito longo (máx. 2000 caracteres)." };

  // Check classified exists and is approved
  const [cl] = await db
    .select({
      id: classifieds.id,
      userId: classifieds.userId,
      status: classifieds.status,
    })
    .from(classifieds)
    .where(eq(classifieds.id, classifiedId))
    .limit(1);
  if (!cl || cl.status !== "approved")
    return { error: "Anúncio não encontrado." };

  // Moderate content
  const modResult = await moderateText(
    content,
    session.userId,
    `comment:classified:${classifiedId}`,
  );

  if (modResult.shouldDelete) {
    // Notify user if needed
    if (modResult.shouldNotify) {
      await db.insert(notifications).values({
        userId: session.userId,
        title: "Comentário removido",
        message:
          "Seu comentário foi removido por conter informações de contato não permitidas.",
        link: `/classificados/${classifiedId}`,
      });
      emitNotification(session.userId);
    }
    return {
      error: "Comentário contém informações não permitidas e foi removido.",
    };
  }

  const [inserted] = await db
    .insert(classifiedComments)
    .values({
      classifiedId,
      userId: session.userId,
      content: modResult.text,
      originalContent: modResult.moderated ? content : null,
    })
    .returning({ id: classifiedComments.id });

  // Notify if moderated
  if (modResult.shouldNotify) {
    await db.insert(notifications).values({
      userId: session.userId,
      title: "Comentário editado",
      message:
        "Seu comentário foi editado para remover informações de contato.",
      link: `/classificados/${classifiedId}`,
    });
    emitNotification(session.userId);
  }

  await logAction("comment_created", {
    userId: session.userId,
    target: `comment:classified:${classifiedId}`,
    details: modResult.moderated
      ? JSON.stringify({ moderated: true })
      : undefined,
  });

  // Emit real-time update
  emitCommentEvent(classifiedId, "comment:new", {
    id: inserted.id,
    content: modResult.text,
    userName: session.name,
    userId: session.userId,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  });

  return { success: true };
}

export async function editComment(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "Faça login para editar." };

  const commentId = Number(formData.get("commentId"));
  const content = String(formData.get("content") ?? "").trim();

  if (!commentId || !content)
    return { error: "Comentário não pode ser vazio." };
  if (content.length > 2000)
    return { error: "Comentário muito longo (máx. 2000 caracteres)." };

  // Check comment exists and belongs to user
  const [comment] = await db
    .select({
      id: classifiedComments.id,
      userId: classifiedComments.userId,
      classifiedId: classifiedComments.classifiedId,
    })
    .from(classifiedComments)
    .where(eq(classifiedComments.id, commentId))
    .limit(1);
  if (!comment || comment.userId !== session.userId)
    return { error: "Comentário não encontrado." };

  // Moderate content
  const modResult = await moderateText(
    content,
    session.userId,
    `comment:edit:${commentId}`,
  );

  if (modResult.shouldDelete) {
    return {
      error: "Comentário contém informações não permitidas.",
    };
  }

  const now = new Date().toISOString();
  await db
    .update(classifiedComments)
    .set({
      content: modResult.text,
      originalContent: modResult.moderated ? content : undefined,
      updatedAt: now,
    })
    .where(eq(classifiedComments.id, commentId));

  await logAction("comment_edited", {
    userId: session.userId,
    target: `comment:${commentId}`,
  });

  emitCommentEvent(comment.classifiedId, "comment:updated", {
    id: commentId,
    content: modResult.text,
    userName: session.name,
    userId: session.userId,
    createdAt: "", // client already has this
    updatedAt: now,
  });

  return { success: true };
}

export async function deleteUserComment(
  commentId: number,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "Faça login." };

  const [comment] = await db
    .select({
      id: classifiedComments.id,
      userId: classifiedComments.userId,
      classifiedId: classifiedComments.classifiedId,
    })
    .from(classifiedComments)
    .where(eq(classifiedComments.id, commentId))
    .limit(1);
  if (!comment || comment.userId !== session.userId)
    return { error: "Comentário não encontrado." };

  await db
    .delete(classifiedComments)
    .where(eq(classifiedComments.id, commentId));

  await logAction("comment_deleted_by_user", {
    userId: session.userId,
    target: `comment:${commentId}`,
  });

  emitCommentEvent(comment.classifiedId, "comment:deleted", {
    id: commentId,
  });

  return { success: true };
}

export async function updateClassifiedPrice(
  classifiedId: number,
  newPrice: number,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "Faça login." };

  if (!Number.isFinite(newPrice) || newPrice <= 0)
    return { error: "Valor inválido." };

  const [cl] = await db
    .select({
      id: classifieds.id,
      userId: classifieds.userId,
      price: classifieds.price,
    })
    .from(classifieds)
    .where(eq(classifieds.id, classifiedId))
    .limit(1);
  if (!cl || cl.userId !== session.userId)
    return { error: "Anúncio não encontrado." };

  await db
    .update(classifieds)
    .set({
      previousPrice: cl.price,
      price: newPrice,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(classifieds.id, classifiedId));

  await logAction("classified_price_updated", {
    userId: session.userId,
    target: `classified:${classifiedId}`,
    details: JSON.stringify({ oldPrice: cl.price, newPrice }),
  });

  return { success: true };
}

// ── User classified management ────────────────────────────────────────────────

export async function deleteUserClassified(
  classifiedId: number,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "Faça login." };

  const [cl] = await db
    .select({
      id: classifieds.id,
      userId: classifieds.userId,
      title: classifieds.title,
    })
    .from(classifieds)
    .where(eq(classifieds.id, classifiedId))
    .limit(1);
  if (!cl || cl.userId !== session.userId)
    return { error: "Anúncio não encontrado." };

  // Delete images from db (files cascade-cleaned or kept as orphan is acceptable)
  await db
    .delete(classifiedImages)
    .where(eq(classifiedImages.classifiedId, classifiedId));
  await db
    .delete(classifiedComments)
    .where(eq(classifiedComments.classifiedId, classifiedId));
  await db.delete(classifieds).where(eq(classifieds.id, classifiedId));

  // Try to remove image directory
  try {
    const dir = join(
      process.cwd(),
      "public",
      "images",
      "classifieds",
      String(classifiedId),
    );
    const entries = await readdir(dir);
    for (const entry of entries) {
      await unlink(join(dir, entry));
    }
    await rmdir(dir);
  } catch {
    // directory may not exist
  }

  await logAction("classified_deleted_by_user", {
    userId: session.userId,
    target: `classified:${classifiedId}`,
    details: JSON.stringify({ title: cl.title }),
  });

  return { success: true };
}

export async function pauseUserClassified(
  classifiedId: number,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "Faça login." };

  const [cl] = await db
    .select({
      id: classifieds.id,
      userId: classifieds.userId,
      status: classifieds.status,
    })
    .from(classifieds)
    .where(eq(classifieds.id, classifiedId))
    .limit(1);
  if (!cl || cl.userId !== session.userId)
    return { error: "Anúncio não encontrado." };

  if (cl.status !== "approved" && cl.status !== "paused")
    return { error: "Não é possível pausar este anúncio." };

  const newStatus = cl.status === "paused" ? "approved" : "paused";

  await db
    .update(classifieds)
    .set({ status: newStatus, updatedAt: new Date().toISOString() })
    .where(eq(classifieds.id, classifiedId));

  await logAction(
    newStatus === "paused" ? "classified_paused" : "classified_unpaused",
    {
      userId: session.userId,
      target: `classified:${classifiedId}`,
    },
  );

  return { success: true };
}

export async function editUserClassified(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean; slug?: string }> {
  const session = await getSession();
  if (!session) return { error: "Faça login." };

  const classifiedId = Number(formData.get("classifiedId"));
  if (!classifiedId) return { error: "Anúncio inválido." };

  const [cl] = await db
    .select({
      id: classifieds.id,
      userId: classifieds.userId,
      slug: classifieds.slug,
      price: classifieds.price,
    })
    .from(classifieds)
    .where(eq(classifieds.id, classifiedId))
    .limit(1);
  if (!cl || cl.userId !== session.userId)
    return { error: "Anúncio não encontrado." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceStr = String(formData.get("price") ?? "").trim();
  const categoryId = Number(formData.get("categoryId"));
  const stateId = Number(formData.get("stateId"));
  const cityId = Number(formData.get("cityId"));

  if (
    !title ||
    !description ||
    !priceStr ||
    !categoryId ||
    !stateId ||
    !cityId
  ) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  if (title.length > 120)
    return { error: "Título muito longo (máx. 120 caracteres)." };
  if (description.length > 5000)
    return { error: "Descrição muito longa (máx. 5000 caracteres)." };

  const price = Number.parseFloat(
    priceStr.replace(/\./g, "").replace(",", "."),
  );
  if (Number.isNaN(price) || price <= 0) return { error: "Valor inválido." };

  // Moderate description
  const modResult = await moderateText(
    description,
    session.userId,
    `classified:edit:${classifiedId}`,
  );

  const updateData: Record<string, unknown> = {
    title,
    description: modResult.text,
    categoryId,
    stateId,
    cityId,
    updatedAt: new Date().toISOString(),
  };

  // Track price change
  if (price !== cl.price) {
    updateData.previousPrice = cl.price;
    updateData.price = price;
  }

  await db
    .update(classifieds)
    .set(updateData)
    .where(eq(classifieds.id, classifiedId));

  // Handle removed images
  const removedImageIds = formData.getAll("removedImageIds");
  for (const idStr of removedImageIds) {
    const imgId = Number(idStr);
    if (!imgId) continue;
    const [img] = await db
      .select({
        id: classifiedImages.id,
        url: classifiedImages.url,
        classifiedId: classifiedImages.classifiedId,
      })
      .from(classifiedImages)
      .where(eq(classifiedImages.id, imgId))
      .limit(1);
    if (img && img.classifiedId === classifiedId) {
      await db.delete(classifiedImages).where(eq(classifiedImages.id, imgId));
      try {
        await unlink(join(process.cwd(), "public", img.url));
      } catch {
        // file may not exist
      }
    }
  }

  // Handle new image uploads
  const existingImages = await db
    .select({ id: classifiedImages.id })
    .from(classifiedImages)
    .where(eq(classifiedImages.classifiedId, classifiedId));

  let position = existingImages.length;
  const files = formData.getAll("images");
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;
    if (position >= 6) break;
    if (file.size > 5 * 1024 * 1024) continue;
    if (!file.type.startsWith("image/")) continue;

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const dir = join(
      process.cwd(),
      "public",
      "images",
      "classifieds",
      String(classifiedId),
    );
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);

    await db.insert(classifiedImages).values({
      classifiedId,
      url: `/images/classifieds/${classifiedId}/${filename}`,
      position: position++,
    });
  }

  await logAction("classified_edited_by_user", {
    userId: session.userId,
    target: `classified:${classifiedId}`,
    details: JSON.stringify({ title, price }),
  });

  return { success: true, slug: cl.slug };
}

export async function getUserClassifieds() {
  const session = await getSession();
  if (!session) return [];

  const rows = await db
    .select({
      id: classifieds.id,
      title: classifieds.title,
      slug: classifieds.slug,
      price: classifieds.price,
      status: classifieds.status,
      createdAt: classifieds.createdAt,
      categoryName: classifiedCategories.name,
    })
    .from(classifieds)
    .innerJoin(
      classifiedCategories,
      eq(classifieds.categoryId, classifiedCategories.id),
    )
    .where(eq(classifieds.userId, session.userId))
    .orderBy(desc(classifieds.createdAt));

  return rows;
}

export async function getStatesForClassifieds() {
  return db.select().from(states).orderBy(states.name);
}

export async function getCitiesForState(stateId: number) {
  return db
    .select()
    .from(cities)
    .where(eq(cities.stateId, stateId))
    .orderBy(cities.name);
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getUserNotifications() {
  const session = await getSession();
  if (!session) return [];

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationRead(id: number) {
  const session = await getSession();
  if (!session) return;

  await db
    .update(notifications)
    .set({ read: 1 })
    .where(
      and(eq(notifications.id, id), eq(notifications.userId, session.userId)),
    );
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) return;

  await db
    .update(notifications)
    .set({ read: 1 })
    .where(
      and(eq(notifications.userId, session.userId), eq(notifications.read, 0)),
    );
}

export async function getUnreadCount() {
  const session = await getSession();
  if (!session) return 0;

  const [{ total }] = await db
    .select({ total: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, session.userId), eq(notifications.read, 0)),
    );

  return total;
}

// ── Socket.IO notification helper ─────────────────────────────────────────────

function emitNotification(userId: number) {
  try {
    // @ts-expect-error global socket.io instance
    const io = globalThis.__agrocomm_io;
    if (io) {
      io.to(`user:${userId}`).emit("notification:new");
    }
  } catch {
    // ignore
  }
}

function emitCommentEvent(
  classifiedId: number,
  event: string,
  data: Record<string, unknown>,
) {
  try {
    // @ts-expect-error global socket.io instance
    const io = globalThis.__agrocomm_io;
    if (io) {
      io.to(`classified:${classifiedId}`).emit(event, data);
    }
  } catch {
    // ignore
  }
}

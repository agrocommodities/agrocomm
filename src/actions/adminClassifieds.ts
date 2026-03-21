"use server";

import { db } from "@/db";
import {
  classifieds,
  classifiedImages,
  classifiedComments,
  classifiedCategories,
  moderationSettings,
  auditLogs,
  notifications,
  users,
  states,
  cities,
} from "@/db/schema";
import { eq, desc, and, count, like } from "drizzle-orm";
import { getSession, getUserPermissions } from "@/lib/auth";
import { logAction } from "@/lib/moderation";

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const perms = await getUserPermissions(session.userId);
  if (!perms.has("admin.access")) throw new Error("Unauthorized");
  return session;
}

// ── Classifieds management ────────────────────────────────────────────────────

export async function getAdminClassifieds(
  opts: { status?: string; search?: string; page?: number } = {},
) {
  await requireAdmin();
  const page = opts.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (opts.status && opts.status !== "all") {
    conditions.push(eq(classifieds.status, opts.status));
  }
  if (opts.search) {
    conditions.push(like(classifieds.title, `%${opts.search}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(classifieds)
    .where(whereClause);

  const rows = await db
    .select({
      id: classifieds.id,
      title: classifieds.title,
      slug: classifieds.slug,
      price: classifieds.price,
      status: classifieds.status,
      createdAt: classifieds.createdAt,
      userName: users.name,
      categoryName: classifiedCategories.name,
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

  return { items: rows, total, page, totalPages: Math.ceil(total / limit) };
}

export async function approveClassified(id: number) {
  const session = await requireAdmin();
  await db
    .update(classifieds)
    .set({ status: "approved", updatedAt: new Date().toISOString() })
    .where(eq(classifieds.id, id));

  // Notify owner
  const [cl] = await db
    .select({
      userId: classifieds.userId,
      title: classifieds.title,
      slug: classifieds.slug,
    })
    .from(classifieds)
    .where(eq(classifieds.id, id))
    .limit(1);
  if (cl) {
    await db.insert(notifications).values({
      userId: cl.userId,
      title: "Anúncio aprovado",
      message: `Seu anúncio "${cl.title}" foi aprovado e está visível.`,
      link: `/classificados/${cl.slug}`,
    });
    emitNotification(cl.userId);
  }

  await logAction("classified_approved", {
    userId: session.userId,
    target: `classified:${id}`,
  });
  return { success: true };
}

export async function rejectClassified(id: number) {
  const session = await requireAdmin();
  await db
    .update(classifieds)
    .set({ status: "rejected", updatedAt: new Date().toISOString() })
    .where(eq(classifieds.id, id));

  const [cl] = await db
    .select({ userId: classifieds.userId, title: classifieds.title })
    .from(classifieds)
    .where(eq(classifieds.id, id))
    .limit(1);
  if (cl) {
    await db.insert(notifications).values({
      userId: cl.userId,
      title: "Anúncio rejeitado",
      message: `Seu anúncio "${cl.title}" foi rejeitado.`,
    });
    emitNotification(cl.userId);
  }

  await logAction("classified_rejected", {
    userId: session.userId,
    target: `classified:${id}`,
  });
  return { success: true };
}

export async function blockClassified(id: number) {
  const session = await requireAdmin();
  await db
    .update(classifieds)
    .set({ status: "blocked", updatedAt: new Date().toISOString() })
    .where(eq(classifieds.id, id));

  const [cl] = await db
    .select({ userId: classifieds.userId, title: classifieds.title })
    .from(classifieds)
    .where(eq(classifieds.id, id))
    .limit(1);
  if (cl) {
    await db.insert(notifications).values({
      userId: cl.userId,
      title: "Anúncio bloqueado",
      message: `Seu anúncio "${cl.title}" foi bloqueado por violar as regras.`,
    });
    emitNotification(cl.userId);
  }

  await logAction("classified_blocked", {
    userId: session.userId,
    target: `classified:${id}`,
  });
  return { success: true };
}

export async function deleteClassified(id: number) {
  const session = await requireAdmin();

  const [cl] = await db
    .select({ userId: classifieds.userId, title: classifieds.title })
    .from(classifieds)
    .where(eq(classifieds.id, id))
    .limit(1);

  await db
    .delete(classifiedImages)
    .where(eq(classifiedImages.classifiedId, id));
  await db
    .delete(classifiedComments)
    .where(eq(classifiedComments.classifiedId, id));
  await db.delete(classifieds).where(eq(classifieds.id, id));

  if (cl) {
    await db.insert(notifications).values({
      userId: cl.userId,
      title: "Anúncio excluído",
      message: `Seu anúncio "${cl.title}" foi excluído por um administrador.`,
    });
    emitNotification(cl.userId);
  }

  await logAction("classified_deleted", {
    userId: session.userId,
    target: `classified:${id}`,
    details: JSON.stringify({ title: cl?.title }),
  });
  return { success: true };
}

export async function deleteComment(id: number) {
  const session = await requireAdmin();

  const [comment] = await db
    .select()
    .from(classifiedComments)
    .where(eq(classifiedComments.id, id))
    .limit(1);
  if (comment) {
    await db.delete(classifiedComments).where(eq(classifiedComments.id, id));
    await logAction("comment_deleted", {
      userId: session.userId,
      target: `comment:${id}`,
      originalText: comment.content,
    });
    emitCommentEvent(comment.classifiedId, "comment:deleted", { id });
  }

  return { success: true };
}

// ── Categories management ─────────────────────────────────────────────────────

export async function getAdminCategories() {
  await requireAdmin();
  return db
    .select()
    .from(classifiedCategories)
    .orderBy(classifiedCategories.name);
}

export async function createCategory(formData: FormData) {
  const session = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || null;

  if (!name) return { error: "Nome é obrigatório." };

  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  try {
    await db.insert(classifiedCategories).values({ name, slug, icon });
    await logAction("category_created", {
      userId: session.userId,
      details: JSON.stringify({ name }),
    });
    return { success: true };
  } catch {
    return { error: "Categoria já existe." };
  }
}

export async function updateCategory(id: number, formData: FormData) {
  const session = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || null;

  if (!name) return { error: "Nome é obrigatório." };

  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  await db
    .update(classifiedCategories)
    .set({ name, slug, icon })
    .where(eq(classifiedCategories.id, id));
  await logAction("category_updated", {
    userId: session.userId,
    details: JSON.stringify({ id, name }),
  });
  return { success: true };
}

export async function deleteCategory(id: number) {
  const session = await requireAdmin();

  // Check for classifieds using this category
  const [{ total }] = await db
    .select({ total: count() })
    .from(classifieds)
    .where(eq(classifieds.categoryId, id));
  if (total > 0)
    return { error: `Categoria tem ${total} anúncio(s). Remova-os primeiro.` };

  await db.delete(classifiedCategories).where(eq(classifiedCategories.id, id));
  await logAction("category_deleted", {
    userId: session.userId,
    details: JSON.stringify({ id }),
  });
  return { success: true };
}

// ── Moderation settings ───────────────────────────────────────────────────────

export async function getModerationSettings() {
  await requireAdmin();
  return db.select().from(moderationSettings);
}

export async function updateModerationSetting(
  key: string,
  data: { enabled?: number; action?: string; censorText?: string },
) {
  const session = await requireAdmin();
  const updates: Record<string, unknown> = {};
  if (data.enabled !== undefined) updates.enabled = data.enabled;
  if (data.action !== undefined) updates.action = data.action;
  if (data.censorText !== undefined) updates.censorText = data.censorText;

  await db
    .update(moderationSettings)
    .set(updates)
    .where(eq(moderationSettings.key, key));
  await logAction("moderation_setting_updated", {
    userId: session.userId,
    details: JSON.stringify({ key, ...data }),
  });
  return { success: true };
}

// ── Audit logs ────────────────────────────────────────────────────────────────

export async function getAuditLogs(
  opts: { action?: string; page?: number; search?: string } = {},
) {
  await requireAdmin();
  const page = opts.page ?? 1;
  const limit = 30;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (opts.action && opts.action !== "all") {
    conditions.push(eq(auditLogs.action, opts.action));
  }
  if (opts.search) {
    conditions.push(like(auditLogs.details, `%${opts.search}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(auditLogs)
    .where(whereClause);

  const rows = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      action: auditLogs.action,
      target: auditLogs.target,
      details: auditLogs.details,
      originalText: auditLogs.originalText,
      replacedText: auditLogs.replacedText,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
      userName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return { items: rows, total, page, totalPages: Math.ceil(total / limit) };
}

// ── Socket.IO helper ──────────────────────────────────────────────────────────

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

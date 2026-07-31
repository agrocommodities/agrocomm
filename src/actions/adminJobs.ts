"use server";

import { db } from "@/db";
import { jobListings, notifications, users, states, cities } from "@/db/schema";
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

// ── Job listings management ───────────────────────────────────────────────────

export async function getAdminJobListings(
  opts: { status?: string; type?: string; search?: string; page?: number } = {},
) {
  await requireAdmin();
  const page = opts.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (opts.status && opts.status !== "all") {
    conditions.push(eq(jobListings.status, opts.status));
  }
  if (opts.type && opts.type !== "all") {
    conditions.push(eq(jobListings.type, opts.type));
  }
  if (opts.search) {
    conditions.push(like(jobListings.title, `%${opts.search}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(jobListings)
    .where(whereClause);

  const rows = await db
    .select({
      id: jobListings.id,
      type: jobListings.type,
      title: jobListings.title,
      slug: jobListings.slug,
      area: jobListings.area,
      status: jobListings.status,
      createdAt: jobListings.createdAt,
      userName: users.name,
      stateName: states.name,
      stateCode: states.code,
      cityName: cities.name,
    })
    .from(jobListings)
    .innerJoin(users, eq(jobListings.userId, users.id))
    .innerJoin(states, eq(jobListings.stateId, states.id))
    .innerJoin(cities, eq(jobListings.cityId, cities.id))
    .where(whereClause)
    .orderBy(desc(jobListings.createdAt))
    .limit(limit)
    .offset(offset);

  return { items: rows, total, page, totalPages: Math.ceil(total / limit) };
}

async function notifyOwner(id: number, title: string, message: string) {
  const [job] = await db
    .select({ userId: jobListings.userId, slug: jobListings.slug })
    .from(jobListings)
    .where(eq(jobListings.id, id))
    .limit(1);
  if (!job) return;
  await db.insert(notifications).values({
    userId: job.userId,
    title,
    message,
    link: `/vagas/${job.slug}`,
  });
  emitNotification(job.userId);
}

export async function approveJobListing(id: number) {
  const session = await requireAdmin();
  await db
    .update(jobListings)
    .set({ status: "approved", updatedAt: new Date().toISOString() })
    .where(eq(jobListings.id, id));

  await notifyOwner(
    id,
    "Vaga aprovada",
    "Sua publicação foi aprovada e está visível.",
  );

  await logAction("job_approved", {
    userId: session.userId,
    target: `job:${id}`,
  });
  return { success: true };
}

export async function rejectJobListing(id: number) {
  const session = await requireAdmin();
  await db
    .update(jobListings)
    .set({ status: "rejected", updatedAt: new Date().toISOString() })
    .where(eq(jobListings.id, id));

  await notifyOwner(id, "Vaga rejeitada", "Sua publicação foi rejeitada.");

  await logAction("job_rejected", {
    userId: session.userId,
    target: `job:${id}`,
  });
  return { success: true };
}

export async function blockJobListing(id: number) {
  const session = await requireAdmin();
  await db
    .update(jobListings)
    .set({ status: "blocked", updatedAt: new Date().toISOString() })
    .where(eq(jobListings.id, id));

  await notifyOwner(
    id,
    "Vaga bloqueada",
    "Sua publicação foi bloqueada por violar as regras.",
  );

  await logAction("job_blocked", {
    userId: session.userId,
    target: `job:${id}`,
  });
  return { success: true };
}

export async function deleteJobListing(id: number) {
  const session = await requireAdmin();

  const [job] = await db
    .select({ userId: jobListings.userId, title: jobListings.title })
    .from(jobListings)
    .where(eq(jobListings.id, id))
    .limit(1);

  await db.delete(jobListings).where(eq(jobListings.id, id));

  if (job) {
    await db.insert(notifications).values({
      userId: job.userId,
      title: "Vaga excluída",
      message: `Sua publicação "${job.title}" foi excluída por um administrador.`,
    });
    emitNotification(job.userId);
  }

  await logAction("job_deleted", {
    userId: session.userId,
    target: `job:${id}`,
    details: JSON.stringify({ title: job?.title }),
  });
  return { success: true };
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

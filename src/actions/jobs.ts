"use server";

import { db } from "@/db";
import { jobListings, states, cities, users } from "@/db/schema";
import { eq, desc, and, like, count } from "drizzle-orm";
import { getSession, getUserPermissions } from "@/lib/auth";
import { moderateText, logAction } from "@/lib/moderation";
import { randomUUID } from "node:crypto";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JobListingItem {
  id: number;
  type: string;
  title: string;
  slug: string;
  area: string;
  description: string | null;
  companyName: string | null;
  contractType: string | null;
  salaryRange: string | null;
  positionsCount: number | null;
  desiredRole: string | null;
  experienceYears: number | null;
  availability: string | null;
  status: string;
  createdAt: string;
  userId: number;
  userName: string;
  stateName: string;
  stateCode: string;
  cityName: string;
}

export interface JobListingDetail extends JobListingItem {
  requirements: string | null;
  benefits: string | null;
  skills: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  stateId: number;
  cityId: number;
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

async function moderateFields(
  userId: number,
  target: string,
  fields: Record<string, string | null>,
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = value
      ? (await moderateText(value, userId, target)).text
      : null;
  }
  return result;
}

const selectColumns = {
  id: jobListings.id,
  type: jobListings.type,
  title: jobListings.title,
  slug: jobListings.slug,
  area: jobListings.area,
  description: jobListings.description,
  companyName: jobListings.companyName,
  contractType: jobListings.contractType,
  salaryRange: jobListings.salaryRange,
  positionsCount: jobListings.positionsCount,
  desiredRole: jobListings.desiredRole,
  experienceYears: jobListings.experienceYears,
  availability: jobListings.availability,
  status: jobListings.status,
  createdAt: jobListings.createdAt,
  userId: jobListings.userId,
  userName: users.name,
  stateName: states.name,
  stateCode: states.code,
  cityName: cities.name,
};

// ── Public queries ────────────────────────────────────────────────────────────

export async function getJobListings(
  opts: {
    type?: string;
    area?: string;
    stateCode?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 12;
  const offset = (page - 1) * limit;

  const conditions = [eq(jobListings.status, "approved")];

  if (opts.type === "oferta" || opts.type === "candidato") {
    conditions.push(eq(jobListings.type, opts.type));
  }

  if (opts.area) {
    conditions.push(eq(jobListings.area, opts.area));
  }

  if (opts.stateCode) {
    const [st] = await db
      .select({ id: states.id })
      .from(states)
      .where(eq(states.code, opts.stateCode))
      .limit(1);
    if (st) conditions.push(eq(jobListings.stateId, st.id));
  }

  if (opts.search) {
    conditions.push(like(jobListings.title, `%${opts.search}%`));
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(jobListings)
    .where(whereClause);

  const items: JobListingItem[] = await db
    .select(selectColumns)
    .from(jobListings)
    .innerJoin(users, eq(jobListings.userId, users.id))
    .innerJoin(states, eq(jobListings.stateId, states.id))
    .innerJoin(cities, eq(jobListings.cityId, cities.id))
    .where(whereClause)
    .orderBy(desc(jobListings.createdAt))
    .limit(limit)
    .offset(offset);

  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getJobListingBySlug(
  slug: string,
): Promise<JobListingDetail | null> {
  const [row] = await db
    .select({
      ...selectColumns,
      requirements: jobListings.requirements,
      benefits: jobListings.benefits,
      skills: jobListings.skills,
      contactPhone: jobListings.contactPhone,
      contactEmail: jobListings.contactEmail,
      stateId: jobListings.stateId,
      cityId: jobListings.cityId,
    })
    .from(jobListings)
    .innerJoin(users, eq(jobListings.userId, users.id))
    .innerJoin(states, eq(jobListings.stateId, states.id))
    .innerJoin(cities, eq(jobListings.cityId, cities.id))
    .where(eq(jobListings.slug, slug))
    .limit(1);

  if (!row) return null;

  const session = await getSession();
  if (
    row.status !== "approved" &&
    (!session ||
      (session.userId !== row.userId &&
        !(await getUserPermissions(session.userId)).has("admin.access")))
  ) {
    return null;
  }

  return row;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createJobListing(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean; slug?: string }> {
  const session = await getSession();
  if (!session) return { error: "Faça login para publicar uma vaga." };

  const type = String(formData.get("type") ?? "").trim();
  if (type !== "oferta" && type !== "candidato") {
    return { error: "Tipo de vaga inválido." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const stateId = Number(formData.get("stateId"));
  const cityId = Number(formData.get("cityId"));
  const contactPhone =
    String(formData.get("contactPhone") ?? "").trim() || null;
  const contactEmail =
    String(formData.get("contactEmail") ?? "").trim() || null;

  if (!title || !area || !stateId || !cityId) {
    return { error: "Preencha todos os campos obrigatórios." };
  }
  if (title.length > 120)
    return { error: "Título muito longo (máx. 120 caracteres)." };
  if (descriptionRaw.length > 5000)
    return { error: "Descrição muito longa (máx. 5000 caracteres)." };
  if (!contactPhone && !contactEmail) {
    return { error: "Informe um telefone ou e-mail para contato." };
  }

  const companyNameRaw = String(formData.get("companyName") ?? "").trim();
  const contractType =
    String(formData.get("contractType") ?? "").trim() || null;
  const salaryRange = String(formData.get("salaryRange") ?? "").trim() || null;
  const positionsCountRaw = formData.get("positionsCount");
  const positionsCount = positionsCountRaw ? Number(positionsCountRaw) : null;
  const requirementsRaw = String(formData.get("requirements") ?? "").trim();
  const benefitsRaw = String(formData.get("benefits") ?? "").trim();

  const desiredRoleRaw = String(formData.get("desiredRole") ?? "").trim();
  const experienceYearsRaw = formData.get("experienceYears");
  const experienceYears = experienceYearsRaw
    ? Number(experienceYearsRaw)
    : null;
  const availability =
    String(formData.get("availability") ?? "").trim() || null;
  const skillsRaw = String(formData.get("skills") ?? "").trim();

  if (type === "oferta" && !companyNameRaw) {
    return { error: "Informe o nome da empresa ou propriedade." };
  }
  if (type === "candidato" && !desiredRoleRaw) {
    return { error: "Informe o cargo pretendido." };
  }

  const target = "job:new";
  const moderated = await moderateFields(session.userId, target, {
    description: descriptionRaw || null,
    requirements: requirementsRaw || null,
    benefits: benefitsRaw || null,
    skills: skillsRaw || null,
  });

  const slug = `${slugify(title)}-${randomUUID().slice(0, 8)}`;

  const [inserted] = await db
    .insert(jobListings)
    .values({
      userId: session.userId,
      type,
      title,
      slug,
      area,
      description: moderated.description,
      stateId,
      cityId,
      contactPhone,
      contactEmail,
      companyName: type === "oferta" ? companyNameRaw : null,
      contractType: type === "oferta" ? contractType : null,
      salaryRange: type === "oferta" ? salaryRange : null,
      positionsCount: type === "oferta" ? positionsCount : null,
      requirements: type === "oferta" ? moderated.requirements : null,
      benefits: type === "oferta" ? moderated.benefits : null,
      desiredRole: type === "candidato" ? desiredRoleRaw : null,
      experienceYears: type === "candidato" ? experienceYears : null,
      availability: type === "candidato" ? availability : null,
      skills: type === "candidato" ? moderated.skills : null,
      status:
        session.role === "admin" ||
        session.role === "super-admin" ||
        session.role === "corretor"
          ? "approved"
          : "pending",
    })
    .returning({ id: jobListings.id });

  await logAction("job_created", {
    userId: session.userId,
    target: `job:${inserted.id}`,
    details: JSON.stringify({ title, type }),
  });

  return { success: true, slug };
}

export async function editUserJobListing(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean; slug?: string }> {
  const session = await getSession();
  if (!session) return { error: "Faça login." };

  const jobId = Number(formData.get("jobId"));
  if (!jobId) return { error: "Vaga inválida." };

  const [job] = await db
    .select({
      id: jobListings.id,
      userId: jobListings.userId,
      slug: jobListings.slug,
      type: jobListings.type,
    })
    .from(jobListings)
    .where(eq(jobListings.id, jobId))
    .limit(1);
  if (!job || job.userId !== session.userId)
    return { error: "Vaga não encontrada." };

  const title = String(formData.get("title") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const stateId = Number(formData.get("stateId"));
  const cityId = Number(formData.get("cityId"));
  const contactPhone =
    String(formData.get("contactPhone") ?? "").trim() || null;
  const contactEmail =
    String(formData.get("contactEmail") ?? "").trim() || null;

  if (!title || !area || !stateId || !cityId) {
    return { error: "Preencha todos os campos obrigatórios." };
  }
  if (title.length > 120)
    return { error: "Título muito longo (máx. 120 caracteres)." };
  if (descriptionRaw.length > 5000)
    return { error: "Descrição muito longa (máx. 5000 caracteres)." };
  if (!contactPhone && !contactEmail) {
    return { error: "Informe um telefone ou e-mail para contato." };
  }

  const companyNameRaw = String(formData.get("companyName") ?? "").trim();
  const contractType =
    String(formData.get("contractType") ?? "").trim() || null;
  const salaryRange = String(formData.get("salaryRange") ?? "").trim() || null;
  const positionsCountRaw = formData.get("positionsCount");
  const positionsCount = positionsCountRaw ? Number(positionsCountRaw) : null;
  const requirementsRaw = String(formData.get("requirements") ?? "").trim();
  const benefitsRaw = String(formData.get("benefits") ?? "").trim();

  const desiredRoleRaw = String(formData.get("desiredRole") ?? "").trim();
  const experienceYearsRaw = formData.get("experienceYears");
  const experienceYears = experienceYearsRaw
    ? Number(experienceYearsRaw)
    : null;
  const availability =
    String(formData.get("availability") ?? "").trim() || null;
  const skillsRaw = String(formData.get("skills") ?? "").trim();

  if (job.type === "oferta" && !companyNameRaw) {
    return { error: "Informe o nome da empresa ou propriedade." };
  }
  if (job.type === "candidato" && !desiredRoleRaw) {
    return { error: "Informe o cargo pretendido." };
  }

  const target = `job:edit:${jobId}`;
  const moderated = await moderateFields(session.userId, target, {
    description: descriptionRaw || null,
    requirements: requirementsRaw || null,
    benefits: benefitsRaw || null,
    skills: skillsRaw || null,
  });

  await db
    .update(jobListings)
    .set({
      title,
      area,
      description: moderated.description,
      stateId,
      cityId,
      contactPhone,
      contactEmail,
      companyName: job.type === "oferta" ? companyNameRaw : null,
      contractType: job.type === "oferta" ? contractType : null,
      salaryRange: job.type === "oferta" ? salaryRange : null,
      positionsCount: job.type === "oferta" ? positionsCount : null,
      requirements: job.type === "oferta" ? moderated.requirements : null,
      benefits: job.type === "oferta" ? moderated.benefits : null,
      desiredRole: job.type === "candidato" ? desiredRoleRaw : null,
      experienceYears: job.type === "candidato" ? experienceYears : null,
      availability: job.type === "candidato" ? availability : null,
      skills: job.type === "candidato" ? moderated.skills : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(jobListings.id, jobId));

  await logAction("job_edited_by_user", {
    userId: session.userId,
    target: `job:${jobId}`,
    details: JSON.stringify({ title }),
  });

  return { success: true, slug: job.slug };
}

export async function deleteUserJobListing(
  jobId: number,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "Faça login." };

  const [job] = await db
    .select({
      id: jobListings.id,
      userId: jobListings.userId,
      title: jobListings.title,
    })
    .from(jobListings)
    .where(eq(jobListings.id, jobId))
    .limit(1);
  if (!job || job.userId !== session.userId)
    return { error: "Vaga não encontrada." };

  await db.delete(jobListings).where(eq(jobListings.id, jobId));

  await logAction("job_deleted_by_user", {
    userId: session.userId,
    target: `job:${jobId}`,
    details: JSON.stringify({ title: job.title }),
  });

  return { success: true };
}

export async function pauseUserJobListing(
  jobId: number,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "Faça login." };

  const [job] = await db
    .select({
      id: jobListings.id,
      userId: jobListings.userId,
      status: jobListings.status,
    })
    .from(jobListings)
    .where(eq(jobListings.id, jobId))
    .limit(1);
  if (!job || job.userId !== session.userId)
    return { error: "Vaga não encontrada." };

  if (job.status !== "approved" && job.status !== "paused")
    return { error: "Não é possível pausar esta vaga." };

  const newStatus = job.status === "paused" ? "approved" : "paused";

  await db
    .update(jobListings)
    .set({ status: newStatus, updatedAt: new Date().toISOString() })
    .where(eq(jobListings.id, jobId));

  await logAction(newStatus === "paused" ? "job_paused" : "job_unpaused", {
    userId: session.userId,
    target: `job:${jobId}`,
  });

  return { success: true };
}

export async function getUserJobListings() {
  const session = await getSession();
  if (!session) return [];

  return db
    .select({
      id: jobListings.id,
      type: jobListings.type,
      title: jobListings.title,
      slug: jobListings.slug,
      status: jobListings.status,
      createdAt: jobListings.createdAt,
    })
    .from(jobListings)
    .where(eq(jobListings.userId, session.userId))
    .orderBy(desc(jobListings.createdAt));
}

export async function getStatesForJobs() {
  return db.select().from(states).orderBy(states.name);
}

export async function getCitiesForJobState(stateId: number) {
  return db
    .select()
    .from(cities)
    .where(eq(cities.stateId, stateId))
    .orderBy(cities.name);
}

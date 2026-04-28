"use server";

import { db } from "@/db";
import { conversations, messages, users, classifieds } from "@/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConversationSummary {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatarUrl: string | null;
  classifiedId: number | null;
  classifiedTitle: string | null;
  classifiedSlug: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  read: number;
  createdAt: string;
}

// ── Socket.IO helpers ─────────────────────────────────────────────────────────

function emitChatMessage(conversationId: number, message: Message) {
  try {
    // @ts-expect-error global socket.io instance
    const io = globalThis.__agrocomm_io;
    if (io) {
      io.to(`chat:${conversationId}`).emit("chat:message", message);
    }
  } catch {
    // ignore
  }
}

function emitUnreadCount(recipientId: number, count: number) {
  try {
    // @ts-expect-error global socket.io instance
    const io = globalThis.__agrocomm_io;
    if (io) {
      io.to(`user:${recipientId}`).emit("chat:unread", count);
    }
  } catch {
    // ignore
  }
}

async function getUnreadCountForUser(userId: number): Promise<number> {
  const userConversations = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      or(
        eq(conversations.participantAId, userId),
        eq(conversations.participantBId, userId),
      ),
    );

  if (userConversations.length === 0) return 0;

  const convIds = userConversations.map((c) => c.id);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        sql`${messages.conversationId} IN (${sql.join(
          convIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
        sql`${messages.senderId} != ${userId}`,
        eq(messages.read, 0),
      ),
    );

  return result[0]?.count ?? 0;
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function getConversations(): Promise<ConversationSummary[]> {
  const session = await getSession();
  if (!session) return [];

  const userId = session.userId;

  // Get all conversations where user is a participant
  const rows = await db
    .select({
      id: conversations.id,
      participantAId: conversations.participantAId,
      participantBId: conversations.participantBId,
      classifiedId: conversations.classifiedId,
      updatedAt: conversations.updatedAt,
      classifiedTitle: classifieds.title,
      classifiedSlug: classifieds.slug,
    })
    .from(conversations)
    .leftJoin(classifieds, eq(conversations.classifiedId, classifieds.id))
    .where(
      or(
        eq(conversations.participantAId, userId),
        eq(conversations.participantBId, userId),
      ),
    )
    .orderBy(desc(conversations.updatedAt));

  if (rows.length === 0) return [];

  // Collect other user IDs
  const otherUserIds = rows.map((r) =>
    r.participantAId === userId ? r.participantBId : r.participantAId,
  );

  // Fetch other users in one query
  const otherUsers = await db
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(
      sql`${users.id} IN (${sql.join(
        [...new Set(otherUserIds)].map((id) => sql`${id}`),
        sql`, `,
      )})`,
    );

  const userMap = new Map(otherUsers.map((u) => [u.id, u]));

  // For each conversation, get last message + unread count
  const results: ConversationSummary[] = [];

  for (const row of rows) {
    const otherUserId =
      row.participantAId === userId ? row.participantBId : row.participantAId;
    const otherUser = userMap.get(otherUserId);

    const [lastMsg] = await db
      .select({
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, row.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    const [unread] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, row.id),
          sql`${messages.senderId} != ${userId}`,
          eq(messages.read, 0),
        ),
      );

    results.push({
      id: row.id,
      otherUserId,
      otherUserName: otherUser?.name ?? "Usuário",
      otherUserAvatarUrl: otherUser?.avatarUrl ?? null,
      classifiedId: row.classifiedId,
      classifiedTitle: row.classifiedTitle ?? null,
      classifiedSlug: row.classifiedSlug ?? null,
      lastMessage: lastMsg?.content ?? null,
      lastMessageAt: lastMsg?.createdAt ?? null,
      unreadCount: unread?.count ?? 0,
      updatedAt: row.updatedAt,
    });
  }

  return results;
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const userId = session.userId;

  // Verify participant
  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.participantAId, userId),
          eq(conversations.participantBId, userId),
        ),
      ),
    )
    .limit(1);

  if (!conv) throw new Error("Conversa não encontrada");

  const rows = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      senderName: users.name,
      content: messages.content,
      read: messages.read,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  return rows;
}

export async function getOrCreateConversation(
  classifiedSlug: string,
): Promise<
  | { conversationId: number; error?: never }
  | { error: string; conversationId?: never }
> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };

  const userId = session.userId;

  // Find the classified and its owner
  const [classified] = await db
    .select({
      id: classifieds.id,
      userId: classifieds.userId,
      title: classifieds.title,
      slug: classifieds.slug,
    })
    .from(classifieds)
    .where(eq(classifieds.slug, classifiedSlug))
    .limit(1);

  if (!classified) return { error: "Anúncio não encontrado" };
  if (classified.userId === userId)
    return { error: "Você não pode negociar com seu próprio anúncio" };

  const ownerId = classified.userId;

  // Check for existing conversation (either direction)
  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.classifiedId, classified.id),
        or(
          and(
            eq(conversations.participantAId, userId),
            eq(conversations.participantBId, ownerId),
          ),
          and(
            eq(conversations.participantAId, ownerId),
            eq(conversations.participantBId, userId),
          ),
        ),
      ),
    )
    .limit(1);

  if (existing) return { conversationId: existing.id };

  // Create new conversation
  const result = await db
    .insert(conversations)
    .values({
      participantAId: userId,
      participantBId: ownerId,
      classifiedId: classified.id,
    })
    .returning({ id: conversations.id });

  return { conversationId: result[0].id };
}

export async function sendMessage(
  conversationId: number,
  content: string,
): Promise<Message> {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const userId = session.userId;
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Mensagem vazia");
  if (trimmed.length > 2000) throw new Error("Mensagem muito longa");

  // Verify participant
  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.participantAId, userId),
          eq(conversations.participantBId, userId),
        ),
      ),
    )
    .limit(1);

  if (!conv) throw new Error("Conversa não encontrada");

  const recipientId =
    conv.participantAId === userId ? conv.participantBId : conv.participantAId;

  // Insert message
  const [inserted] = await db
    .insert(messages)
    .values({ conversationId, senderId: userId, content: trimmed })
    .returning();

  // Update conversation updatedAt
  await db
    .update(conversations)
    .set({ updatedAt: sql`(datetime('now'))` })
    .where(eq(conversations.id, conversationId));

  const msg: Message = {
    id: inserted.id,
    conversationId,
    senderId: userId,
    senderName: session.name,
    content: trimmed,
    read: 0,
    createdAt: inserted.createdAt,
  };

  // Broadcast to conversation room
  emitChatMessage(conversationId, msg);

  // Notify recipient with updated unread count
  const newUnread = await getUnreadCountForUser(recipientId);
  emitUnreadCount(recipientId, newUnread);

  return msg;
}

export async function markConversationRead(
  conversationId: number,
): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const userId = session.userId;

  // Verify participant
  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.participantAId, userId),
          eq(conversations.participantBId, userId),
        ),
      ),
    )
    .limit(1);

  if (!conv) return;

  await db
    .update(messages)
    .set({ read: 1 })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        sql`${messages.senderId} != ${userId}`,
        eq(messages.read, 0),
      ),
    );
}

export async function getTotalUnread(): Promise<number> {
  const session = await getSession();
  if (!session) return 0;

  return getUnreadCountForUser(session.userId);
}

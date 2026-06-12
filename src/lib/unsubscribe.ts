import { createHmac } from "node:crypto";

const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

function sign(payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function generateUnsubscribeToken(
  userId: number,
  email: string,
): string {
  const payload = `${userId}:${email}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyUnsubscribeToken(
  token: string,
): { userId: number; email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    if (sign(payload) !== sig) return null;
    const firstColon = payload.indexOf(":");
    const userId = parseInt(payload.slice(0, firstColon), 10);
    const email = payload.slice(firstColon + 1);
    if (Number.isNaN(userId)) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

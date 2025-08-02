import { SignJWT } from "jose";

export function generateVerificationToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function getExpirationDate() {
  const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7;
  return new Date(Date.now() + SESSION_EXPIRATION_SECONDS * 1000);
}

export function getTokenExpiry(hours: number = 24): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
}

export function isTokenValid(token: string, expiry: Date): boolean {
  return token.length === 64 && new Date() < expiry;
}

export async function createToken(user : { id: number; email: string; role: string }) {
    return await new SignJWT(user)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(getExpirationDate())
      .sign(new TextEncoder().encode(process.env.JWT_SECRET || "default_secret"));
}
import crypto from "crypto";

export function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password.normalize(), salt, 64, (error, hash) => {
      if (error) reject(error);
      resolve(hash.toString("hex").normalize());
    });
  });
}

export async function comparePasswords({ password, salt, hashedPassword }: { password: string; salt: string; hashedPassword: string }) {
  try {
    const inputHashedPassword = await hashPassword(password, salt)

    if (inputHashedPassword.length !== hashedPassword.length) {
      console.error('Hash length mismatch:', { input: inputHashedPassword.length, stored: hashedPassword.length });
      return false;
    }

    return crypto.timingSafeEqual(
      new Uint8Array(Buffer.from(inputHashedPassword, "hex")), 
      new Uint8Array(Buffer.from(hashedPassword, "hex"))
    );
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function generateSalt() {
  return crypto.randomBytes(16).toString("hex").normalize()
}
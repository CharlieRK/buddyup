import { compare, hash } from "bcryptjs";
import { exceedsPasswordByteLimit, PASSWORD_MAX_BYTES } from "@/lib/auth/password-policy";

export const BCRYPT_COST = 10;

export async function hashPassword(password: string): Promise<string> {
  if (exceedsPasswordByteLimit(password)) {
    throw new RangeError(`Password must be ${PASSWORD_MAX_BYTES} bytes or fewer.`);
  }
  return hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (exceedsPasswordByteLimit(password)) return false;
  try {
    return await compare(password, passwordHash);
  } catch {
    return false;
  }
}

import { compare, hash } from "bcryptjs";

export const BCRYPT_COST = 10;
// bcrypt silently ignores bytes after the 72nd, so longer passwords are refused.
const MAX_PASSWORD_BYTES = 72;

function exceedsMaxBytes(password: string): boolean {
  return new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES;
}

export async function hashPassword(password: string): Promise<string> {
  if (exceedsMaxBytes(password)) {
    throw new RangeError(`Password must be ${MAX_PASSWORD_BYTES} bytes or fewer.`);
  }
  return hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (exceedsMaxBytes(password)) return false;
  try {
    return await compare(password, passwordHash);
  } catch {
    return false;
  }
}

export const BCRYPT_COST = 10;

// Red-stage stub (#4): fails closed. It never returns the plaintext password
// and never verifies anything as correct.
export async function hashPassword(password: string): Promise<string> {
  void password;
  return "";
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  void password;
  void hash;
  return false;
}

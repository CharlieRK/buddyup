import { hashSync } from "bcryptjs";
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const PASSWORD = "correct horse";
// 25 x "€" is 25 characters but 75 UTF-8 bytes, over bcrypt's 72-byte limit.
const TOO_LONG_MULTIBYTE = "€".repeat(25);

// Fixture built with bcryptjs directly (low cost for speed), so verifyPassword
// is checked independently of hashPassword.
const fixtureHash = hashSync(PASSWORD, 4);

describe("hashPassword", () => {
  it("returns a hash that is not the plain password (US-01 AC3)", async () => {
    const hash = await hashPassword(PASSWORD);
    expect(hash).not.toBe(PASSWORD);
    expect(hash).not.toContain(PASSWORD);
    expect(hash.length).toBeGreaterThan(0);
  });

  it("produces a bcrypt hash with cost 10 (US-01 AC3)", async () => {
    const hash = await hashPassword(PASSWORD);
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
  });

  it("salts each hash so the same password hashes differently (US-01 AC3)", async () => {
    const [first, second] = await Promise.all([hashPassword(PASSWORD), hashPassword(PASSWORD)]);
    expect(first).not.toBe(second);
  });

  it("accepts a password of exactly 72 bytes (US-01 AC3)", async () => {
    const hash = await hashPassword("a".repeat(72));
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
  });

  it("rejects a password over 72 bytes with a RangeError (US-01 AC3)", async () => {
    await expect(hashPassword("a".repeat(73))).rejects.toThrow(RangeError);
  });

  it("rejects a multibyte password under 72 characters but over 72 bytes (US-01 AC3)", async () => {
    await expect(hashPassword(TOO_LONG_MULTIBYTE)).rejects.toThrow(RangeError);
  });
});

describe("verifyPassword", () => {
  it("returns true for the correct password (US-01 AC3)", async () => {
    expect(await verifyPassword(PASSWORD, fixtureHash)).toBe(true);
  });

  it("verifies a hash produced by hashPassword (US-01 AC3)", async () => {
    const hash = await hashPassword(PASSWORD);
    expect(await verifyPassword(PASSWORD, hash)).toBe(true);
  });

  it("returns false for a wrong password (US-01 AC3)", async () => {
    expect(await verifyPassword("wrong password", fixtureHash)).toBe(false);
  });

  it("is case-sensitive (US-01 AC3)", async () => {
    expect(await verifyPassword(PASSWORD.toUpperCase(), fixtureHash)).toBe(false);
  });

  it("does not trim whitespace from the password (US-01 AC3)", async () => {
    expect(await verifyPassword(` ${PASSWORD} `, fixtureHash)).toBe(false);
    const spaced = hashSync("  pass word  ", 4);
    expect(await verifyPassword("  pass word  ", spaced)).toBe(true);
    expect(await verifyPassword("pass word", spaced)).toBe(false);
  });

  it("returns false instead of matching a truncated password over 72 bytes (US-01 AC3)", async () => {
    // Plain bcrypt would ignore everything after byte 72 and return true here.
    const hash72 = hashSync("a".repeat(72), 4);
    expect(await verifyPassword("a".repeat(73), hash72)).toBe(false);
    expect(await verifyPassword(TOO_LONG_MULTIBYTE, hashSync(TOO_LONG_MULTIBYTE, 4))).toBe(false);
  });

  it.each(["not-a-hash", "", "$2b$10$tooshort"])(
    "returns false without throwing for the malformed hash %j (US-01 AC3)",
    async (malformed) => {
      await expect(verifyPassword(PASSWORD, malformed)).resolves.toBe(false);
    },
  );
});

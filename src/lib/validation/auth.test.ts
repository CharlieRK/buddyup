import { describe, expect, it } from "vitest";
import { z } from "zod";
import { signupSchema } from "@/lib/validation/auth";

const valid = {
  name: "Alice Husky",
  email: "alice@northeastern.edu",
  password: "correct horse",
};

function fieldErrors(input: unknown) {
  const result = signupSchema.safeParse(input);
  if (result.success) return null;
  return z.flattenError(result.error).fieldErrors;
}

describe("signupSchema", () => {
  describe("fields (US-01 AC1)", () => {
    it("accepts a valid name, email, and password (US-01 AC1)", () => {
      const result = signupSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("reports errors on the right field when fields are missing (US-01 AC1)", () => {
      const errors = fieldErrors({});
      expect(errors).not.toBeNull();
      expect(errors?.name).toBeDefined();
      expect(errors?.email).toBeDefined();
      expect(errors?.password).toBeDefined();
    });

    it("rejects an empty or whitespace-only name (US-01 AC1)", () => {
      expect(fieldErrors({ ...valid, name: "" })?.name).toContain("Enter your name.");
      expect(fieldErrors({ ...valid, name: "   " })?.name).toContain("Enter your name.");
    });

    it("trims the name (US-01 AC1)", () => {
      const result = signupSchema.parse({ ...valid, name: "  Alice Husky  " });
      expect(result.name).toBe("Alice Husky");
    });
  });

  describe("email (US-01 AC2)", () => {
    it("accepts a northeastern.edu address (US-01 AC2)", () => {
      expect(signupSchema.safeParse(valid).success).toBe(true);
    });

    it("trims and lowercases the email (US-01 AC2)", () => {
      const result = signupSchema.parse({
        ...valid,
        email: "  Alice@Northeastern.EDU ",
      });
      expect(result.email).toBe("alice@northeastern.edu");
    });

    it("rejects a non-university address with a clear message (US-01 AC2)", () => {
      expect(fieldErrors({ ...valid, email: "alice@gmail.com" })?.email).toContain(
        "Use your @northeastern.edu email address.",
      );
    });

    it.each([
      "a@mail.northeastern.edu",
      "a@northeastern.edu.evil.com",
      "a@notnortheastern.edu",
      "a@northeastern.com",
    ])("rejects the subdomain or look-alike %s (US-01 AC2)", (email) => {
      expect(fieldErrors({ ...valid, email })?.email).toContain(
        "Use your @northeastern.edu email address.",
      );
    });

    it.each(["foo", "foo@", "@northeastern.edu"])(
      "rejects the malformed email %s (US-01 AC2)",
      (email) => {
        expect(fieldErrors({ ...valid, email })?.email).toContain(
          "Enter a valid email address.",
        );
      },
    );
  });

  describe("password (US-01 AC3)", () => {
    it("rejects a 7-character password (US-01 AC3)", () => {
      expect(fieldErrors({ ...valid, password: "a".repeat(7) })?.password).toContain(
        "Use at least 8 characters.",
      );
    });

    it("accepts an 8-character password (US-01 AC3)", () => {
      expect(signupSchema.safeParse({ ...valid, password: "a".repeat(8) }).success).toBe(true);
    });

    it("accepts a password of exactly 72 bytes (US-01 AC3)", () => {
      expect(signupSchema.safeParse({ ...valid, password: "a".repeat(72) }).success).toBe(true);
    });

    it("rejects a password of 73 ASCII bytes (US-01 AC3)", () => {
      expect(fieldErrors({ ...valid, password: "a".repeat(73) })?.password).toContain(
        "Use 72 bytes or fewer.",
      );
    });

    it("rejects a password under 72 characters but over 72 bytes (US-01 AC3)", () => {
      // 25 x "€" is 25 characters but 75 UTF-8 bytes; bcrypt would truncate it.
      expect(fieldErrors({ ...valid, password: "€".repeat(25) })?.password).toContain(
        "Use 72 bytes or fewer.",
      );
    });

    it("does not trim or change the password (US-01 AC3)", () => {
      const result = signupSchema.parse({ ...valid, password: "  pass word  " });
      expect(result.password).toBe("  pass word  ");
    });

    it("counts length in Unicode code points, so 4 emoji are too short and 8 are enough (US-01 AC3)", () => {
      // Zod 4 counts code points: one emoji is 1 character (2 UTF-16 units, 4 bytes).
      // Pinned so a change to the counting rule is a deliberate decision.
      expect(fieldErrors({ ...valid, password: "😀".repeat(4) })?.password).toContain(
        "Use at least 8 characters.",
      );
      expect(signupSchema.safeParse({ ...valid, password: "😀".repeat(8) }).success).toBe(true);
    });
  });
});

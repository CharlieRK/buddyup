import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Category } from "@/generated/prisma/enums";
import { createActivitySchema } from "./activity";

describe("createActivitySchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts valid input with supported categories and capacity range (US-04 AC1, AC2)", () => {
    const result = createActivitySchema.safeParse({
      title: "Algorithms study session",
      category: Category.STUDY,
      description: "Bring your practice problems.",
      startTime: "2026-11-01T19:00:00.000Z",
      location: "Snell Library",
      capacity: 5,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a start time in the past (US-04 AC3)", () => {
    const result = createActivitySchema.safeParse({
      title: "Late lunch",
      category: Category.FOOD,
      description: "",
      startTime: "2026-11-01T11:00:00.000Z",
      location: "Curry Student Center",
      capacity: 4,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.startTime).toContain(
      "Pick a time in the future.",
    );
  });

  it("rejects capacities outside the supported range (US-04 AC1)", () => {
    const result = createActivitySchema.safeParse({
      title: "Pickup tennis",
      category: Category.SPORTS,
      description: "",
      startTime: "2026-11-01T15:00:00.000Z",
      location: "South campus courts",
      capacity: 21,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.capacity).toContain(
      "Choose a capacity between 2 and 20.",
    );
  });
});

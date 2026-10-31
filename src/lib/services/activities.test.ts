import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActivityStatus, Category } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { createActivity } from "./activities";

vi.mock("@/lib/db", () => ({
  db: {
    activity: {
      create: vi.fn(),
    },
  },
}));

describe("createActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an activity for the host and counts them as the first member (US-04 AC4, AC5)", async () => {
    vi.mocked(db.activity.create).mockResolvedValue({
      id: "activity-1",
      hostId: "user-1",
      title: "Board game night",
      description: "Bring your favorite game.",
      category: Category.GAMING,
      startTime: new Date("2026-11-01T20:00:00.000Z"),
      location: "Student lounge",
      capacity: 4,
      status: ActivityStatus.OPEN,
      createdAt: new Date("2026-10-30T18:00:00.000Z"),
      updatedAt: new Date("2026-10-30T18:00:00.000Z"),
    });

    const result = await createActivity("user-1", {
      title: "Board game night",
      category: Category.GAMING,
      description: "Bring your favorite game.",
      startTime: "2026-11-01T20:00:00.000Z",
      location: "Student lounge",
      capacity: 4,
    });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: {
        hostId: "user-1",
        title: "Board game night",
        category: Category.GAMING,
        description: "Bring your favorite game.",
        startTime: new Date("2026-11-01T20:00:00.000Z"),
        location: "Student lounge",
        capacity: 4,
      },
    });
    expect(result.activity.id).toBe("activity-1");
    expect(result.spotsLeft).toBe(3);
  });
});

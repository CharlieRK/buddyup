// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActivityStatus, Category } from "@/generated/prisma/enums";
import { requireUser } from "@/lib/auth/session";
import { createActivity } from "@/lib/services/activities";
import { POST } from "./route";

vi.mock("@/lib/auth/session", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/services/activities", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/services/activities")>();

  return {
    ...actual,
    createActivity: vi.fn(),
  };
});

describe("POST /api/v1/activities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns inline field errors for invalid input (US-04 AC3)", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/v1/activities", {
        method: "POST",
        body: JSON.stringify({
          title: "",
          category: Category.SPORTS,
          description: "",
          startTime: "2026-10-30T18:00:00.000Z",
          location: "",
          capacity: 1,
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        fields: {
          title: expect.arrayContaining(["Add a title."]),
          startTime: expect.arrayContaining(["Pick a time in the future."]),
          location: expect.arrayContaining(["Add where you'll meet."]),
          capacity: expect.arrayContaining(["Choose a capacity between 2 and 20."]),
        },
      },
    });
  });

  it("creates an activity for the signed-in user (US-04 AC4, AC5)", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      id: "user-1",
      email: "demo@northeastern.edu",
      name: "Demo Student",
      role: "USER",
    });

    vi.mocked(createActivity).mockResolvedValue({
      activity: {
        id: "activity-1",
        hostId: "user-1",
        title: "Algorithms study group",
        description: "Bring old exams.",
        category: Category.STUDY,
        startTime: new Date("2026-11-02T00:00:00.000Z"),
        location: "Snell Library",
        capacity: 5,
        status: ActivityStatus.OPEN,
        createdAt: new Date("2026-10-30T18:00:00.000Z"),
        updatedAt: new Date("2026-10-30T18:00:00.000Z"),
      },
      spotsLeft: 4,
    });

    const response = await POST(
      new Request("http://localhost:3000/api/v1/activities", {
        method: "POST",
        body: JSON.stringify({
          title: "Algorithms study group",
          category: Category.STUDY,
          description: "Bring old exams.",
          startTime: "2026-11-02T00:00:00.000Z",
          location: "Snell Library",
          capacity: 5,
        }),
      }),
    );

    expect(createActivity).toHaveBeenCalledWith("user-1", {
      title: "Algorithms study group",
      category: Category.STUDY,
      description: "Bring old exams.",
      startTime: "2026-11-02T00:00:00.000Z",
      location: "Snell Library",
      capacity: 5,
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        id: "activity-1",
        spotsLeft: 4,
      },
    });
  });
});

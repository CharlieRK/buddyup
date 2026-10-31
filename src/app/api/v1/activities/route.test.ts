// @vitest-environment node

import { Role, UserStatus } from "@/generated/prisma/enums";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { afterEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    activity: {
      create: createMock,
    },
  },
}));

describe("POST /api/v1/activities", () => {
  afterEach(() => {
    createMock.mockReset();
  });

  it("returns 401 when no session cookie is present", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/v1/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Study group",
          category: "STUDY",
          description: "Bring your notes",
          startTime: new Date(Date.now() + 60 * 60_000).toISOString(),
          location: "Snell Library",
          capacity: 4,
        }),
      }) as never,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("signed in"),
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns field errors when the payload is invalid", async () => {
    const { POST } = await import("./route");
    const token = await createSessionToken({
      userId: "user_123",
      role: Role.USER,
      status: UserStatus.ACTIVE,
      email: "student@northeastern.edu",
    });

    const response = await POST(
      new Request("http://localhost/api/v1/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({
          title: "",
          category: "STUDY",
          description: "Soon",
          startTime: new Date(Date.now() - 60_000).toISOString(),
          location: "",
          capacity: 25,
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.any(String),
      fieldErrors: {
        title: expect.any(String),
        startTime: expect.any(String),
        location: expect.any(String),
        capacity: expect.any(String),
      },
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates an activity and approved host membership for an active student", async () => {
    const { POST } = await import("./route");
    const token = await createSessionToken({
      userId: "user_123",
      role: Role.USER,
      status: UserStatus.ACTIVE,
      email: "student@northeastern.edu",
    });

    const startTime = new Date(Date.now() + 2 * 60 * 60_000);

    createMock.mockResolvedValue({
      id: "activity_123",
      title: "Basketball at Marino",
      category: "SPORTS",
      description: "Bring indoor shoes.",
      startTime,
      location: "Marino Center",
      capacity: 6,
      host: {
        id: "user_123",
        name: "Chris",
      },
      joinRequests: [{ id: "join_123", userId: "user_123" }],
    });

    const response = await POST(
      new Request("http://localhost/api/v1/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({
          title: "Basketball at Marino",
          category: "SPORTS",
          description: "Bring indoor shoes.",
          startTime: startTime.toISOString(),
          location: "Marino Center",
          capacity: 6,
        }),
      }) as never,
    );

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hostId: "user_123",
          title: "Basketball at Marino",
          category: "SPORTS",
          description: "Bring indoor shoes.",
          location: "Marino Center",
          capacity: 6,
          joinRequests: {
            create: {
              userId: "user_123",
              status: "APPROVED",
            },
          },
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("Location")).toBe("/activities/activity_123");
    await expect(response.json()).resolves.toMatchObject({
      activity: {
        id: "activity_123",
        memberCount: 1,
        spotsLeft: 5,
      },
    });
  });
});

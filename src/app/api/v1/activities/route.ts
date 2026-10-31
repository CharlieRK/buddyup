import { RequestStatus, UserStatus } from "@/generated/prisma/enums";
import { getSessionUserFromRequest } from "@/lib/auth";
import {
  createActivitySchema,
  getCreateActivityFieldErrors,
} from "@/lib/activities";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await getSessionUserFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "You must be signed in to create an activity." },
      { status: 401 },
    );
  }

  if (session.status !== UserStatus.ACTIVE) {
    return NextResponse.json(
      { error: "Your account is not allowed to create activities." },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = createActivitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please correct the highlighted fields.",
        fieldErrors: getCreateActivityFieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  const activity = await prisma.activity.create({
    data: {
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      startTime: parsed.data.startTime,
      location: parsed.data.location,
      capacity: parsed.data.capacity,
      hostId: session.userId,
      joinRequests: {
        create: {
          userId: session.userId,
          status: RequestStatus.APPROVED,
        },
      },
    },
    include: {
      host: {
        select: {
          id: true,
          name: true,
        },
      },
      joinRequests: {
        where: {
          status: RequestStatus.APPROVED,
        },
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      activity: {
        id: activity.id,
        title: activity.title,
        category: activity.category,
        description: activity.description,
        startTime: activity.startTime.toISOString(),
        location: activity.location,
        capacity: activity.capacity,
        host: activity.host,
        memberCount: activity.joinRequests.length,
        spotsLeft: Math.max(activity.capacity - activity.joinRequests.length, 0),
      },
    },
    {
      status: 201,
      headers: {
        Location: `/activities/${activity.id}`,
      },
    },
  );
}

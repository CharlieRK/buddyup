import type { Activity } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { CreateActivityInput } from "@/lib/validation/activity";

export type CreateActivityResult = {
  activity: Activity;
  spotsLeft: number;
};

export async function createActivity(
  hostId: string,
  input: CreateActivityInput,
): Promise<CreateActivityResult> {
  const activity = await db.activity.create({
    data: {
      hostId,
      title: input.title,
      description: input.description,
      category: input.category,
      startTime: new Date(input.startTime),
      location: input.location,
      capacity: input.capacity,
    },
  });

  return {
    activity,
    spotsLeft: Math.max(activity.capacity - 1, 0),
  };
}

export function serializeActivity(result: CreateActivityResult) {
  return {
    id: result.activity.id,
    hostId: result.activity.hostId,
    title: result.activity.title,
    description: result.activity.description,
    category: result.activity.category,
    startTime: result.activity.startTime.toISOString(),
    location: result.activity.location,
    capacity: result.activity.capacity,
    status: result.activity.status,
    createdAt: result.activity.createdAt.toISOString(),
    updatedAt: result.activity.updatedAt.toISOString(),
    spotsLeft: result.spotsLeft,
  };
}

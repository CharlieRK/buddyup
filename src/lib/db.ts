import { randomUUID } from "node:crypto";
import type { Activity } from "@/generated/prisma/client";
import { ActivityStatus } from "@/generated/prisma/enums";

type CreateActivityData = Pick<
  Activity,
  "hostId" | "title" | "description" | "category" | "startTime" | "location" | "capacity"
>;

type InMemoryDb = {
  activity: {
    create(args: { data: CreateActivityData }): Promise<Activity>;
  };
};

const globalForDb = globalThis as {
  db?: InMemoryDb;
  activities?: Activity[];
};

const activities = globalForDb.activities ?? [];

if (!globalForDb.activities) {
  globalForDb.activities = activities;
}

export const db =
  globalForDb.db ??
  ({
    activity: {
      async create({ data }) {
        const now = new Date();
        const activity: Activity = {
          id: `activity-${randomUUID()}`,
          hostId: data.hostId,
          title: data.title,
          description: data.description,
          category: data.category,
          startTime: data.startTime,
          location: data.location,
          capacity: data.capacity,
          status: ActivityStatus.OPEN,
          createdAt: now,
          updatedAt: now,
        };

        activities.push(activity);
        return activity;
      },
    },
  } satisfies InMemoryDb);

if (process.env.NODE_ENV !== "production") {
  // TODO(#1): replace this in-memory stub with the Prisma 7 adapter-backed client.
  globalForDb.db = db;
}

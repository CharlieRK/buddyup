import { RequestStatus } from "@/generated/prisma/enums";
import { formatActivityCategory } from "@/lib/activities";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

export const instant = false;

type ActivityDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ActivityDetailPage({
  params,
}: ActivityDetailPageProps) {
  await connection();
  const { id } = await params;

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      joinRequests: {
        where: {
          status: RequestStatus.APPROVED,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!activity) {
    notFound();
  }

  const spotsLeft = Math.max(activity.capacity - activity.joinRequests.length, 0);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <Link href="/activities/new" className="text-sm font-medium text-zinc-500 hover:text-zinc-800">
          Create another activity
        </Link>

        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
                {formatActivityCategory(activity.category)}
              </p>
              <h1 className="text-4xl font-semibold tracking-tight">{activity.title}</h1>
              <p className="max-w-2xl text-base text-zinc-600">
                {activity.description || "No description provided."}
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white">
              {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
            </div>
          </div>

          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            <DetailItem label="Start time" value={formatDateTime(activity.startTime)} />
            <DetailItem label="Location" value={activity.location} />
            <DetailItem label="Capacity" value={`${activity.capacity} students`} />
            <DetailItem label="Host" value={`${activity.host.name} (${activity.host.email})`} />
          </dl>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Approved members</h2>
          <ul className="mt-4 space-y-3 text-zinc-600">
            {activity.joinRequests.map((request) => (
              <li
                key={request.id}
                className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3"
              >
                <span>{request.user.name}</span>
                {request.user.id === activity.hostId ? (
                  <span className="text-sm font-medium text-zinc-500">Host</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 px-4 py-4">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-base font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

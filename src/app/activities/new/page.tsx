import { CreateActivityForm } from "@/components/create-activity-form";
import { getCurrentSessionUser } from "@/lib/auth";
import Link from "next/link";
import { connection } from "next/server";

export const metadata = {
  title: "Create activity | BuddyUp",
};

export const instant = false;

export default async function NewActivityPage() {
  await connection();
  const session = await getCurrentSessionUser();

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-800">
            Back to home
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight">Create an activity</h1>
            <p className="max-w-2xl text-base text-zinc-600">
              Invite other students by sharing what you&apos;re doing, when it starts,
              where to meet, and how many spots are available.
            </p>
          </div>
        </div>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            {session ? (
              <CreateActivityForm />
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Sign in required</h2>
                <p className="text-zinc-600">
                  Please sign in with your student account before creating an activity.
                </p>
              </div>
            )}
          </div>

          <aside className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold">What to include</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-600">
              <li>Pick a clear title so classmates know what the plan is.</li>
              <li>Choose the category that best matches the activity.</li>
              <li>Use a future start time and a specific meeting location.</li>
              <li>Capacity must stay between 2 and 20 students.</li>
            </ul>
          </aside>
        </section>
      </div>
    </main>
  );
}

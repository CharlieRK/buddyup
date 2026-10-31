import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,420px)]">
        <section className="rounded-[2rem] bg-zinc-950 px-8 py-12 text-white shadow-xl sm:px-12">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-300">
            BuddyUp
          </p>
          <h1 className="mt-6 max-w-2xl text-5xl font-semibold tracking-tight sm:text-6xl">
            Find a buddy for any campus activity.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            Create a plan, share when and where it starts, and let other students
            join before the spots fill up.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/activities/new"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Create activity
            </Link>
          </div>
        </section>

        <aside className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Create flow status</h2>
          <div className="mt-6 space-y-4 text-sm text-zinc-600">
            <p>
              Signed-in students can open the create form, submit an activity, and
              land on a detail page for the saved result.
            </p>
            <p>
              The API validates title, category, description, start time, location,
              and capacity before saving.
            </p>
            <p>
              Students need to be signed in before the create page will allow a
              submission.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-16 sm:px-6">
      <section className="w-full max-w-4xl rounded-[28px] border border-line bg-surface p-8 sm:p-12">
        <p className="text-sm font-semibold tracking-[0.04em] text-primary">Northeastern student activities</p>
        <h1 className="mt-4 max-w-2xl font-heading text-5xl font-extrabold tracking-tight text-ink">
          Post something small, meet up fast, and fill the open spots.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          BuddyUp helps students organize pickup games, study sessions, food runs, and more from a
          simple campus-only form.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-primary"
            href="/activities/new"
          >
            Create activity
          </Link>
          <div className="rounded-xl border border-line bg-surface-2 px-5 py-3 text-sm text-muted">
            The create flow is ready to try.
          </div>
        </div>
      </section>
    </main>
  );
}

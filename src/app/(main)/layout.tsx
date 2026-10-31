import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";

export default async function MainLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const currentUser = await requireUser();

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex min-h-[68px] w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link className="font-heading text-xl font-extrabold text-ink" href="/">
            BuddyUp
          </Link>
          <nav aria-label="Main" className="flex items-center gap-3">
            <Link
              className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary"
              href="/activities/new"
            >
              Create activity
            </Link>
            <span className="rounded-full bg-surface-2 px-3 py-2 text-sm text-muted">
              {currentUser.name}
            </span>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

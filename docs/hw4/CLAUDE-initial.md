# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

BuddyUp: campus-only Next.js app where Northeastern students post small activities and others request to join. **`AGENTS.md` is the authoritative rulebook** (workflow, stack versions, layering, naming, TDD, design tokens, a11y, security). Read it before starting a task; it is not repeated here. Product context: `docs/PRD.md` (user stories, data model §8, API §9), `docs/p3/proposal.md` (scope/timeline), `docs/setup.md` (machine setup), mockups in `docs/mockups/`.

## Commands

```bash
npm run dev                      # Next dev server (Turbopack), http://localhost:3000
npm test                         # Vitest, one run (unit + component + route integration)
npx vitest run path/to/file.test.ts          # single test file
npx vitest run -t "US-04 AC3"                # single test by name
npm run test:watch
npm run test:e2e                 # Playwright, desktop + mobile (Pixel 7); starts `npm run dev` itself
npx playwright test e2e/<feature>.spec.ts --project=desktop
npm run lint
npx tsc --noEmit
npm run db:generate              # prisma generate -> src/generated/prisma
npm run db:migrate               # prisma migrate dev
npx next typegen                 # regenerate route types (PageProps<...>) if a new route's helper fails
```

"Done" check, run as one command: `npm test && npx tsc --noEmit && npm run lint` (plus `npm run test:e2e` for P0 stories). Node 24 (`.nvmrc`).

## Architecture notes that span files

- **Layering**: component/page → `/api/v1/**/route.ts` (thin: auth check → Zod parse → service → `lib/api/responses.ts` helper) → `lib/services/*` (all business rules, no `Request`/cookies) → `lib/db.ts` (the only Prisma client). Mutations go through REST, never Server Actions. Server Components may call services directly for reads.
- **Zod schemas in `lib/validation/*`** are shared by client forms and server routes.
- **Prisma 7**: config lives in `prisma7.config.ts` (not `prisma.config.ts`); the client is generated to `src/generated/prisma` (generated, never edit) and must be imported from there, not from `@prisma/client`. Needs `DATABASE_URL` (see `.env.example`; never open `.env`).
- **Next 16 with `cacheComponents` and `partialPrefetching` on** (`next.config.ts`): per-request data access must follow the Cache Components rules in `node_modules/next/dist/docs/`. `params`/`searchParams` are Promises. `agentRules: false` must stay.
- **Tailwind 4 is CSS-first**: tokens in `src/app/globals.css`, no config file; use token classes, not default palette or hex.
- **Tests**: Vitest default env is jsdom; route-handler tests need `// @vitest-environment node` at the top. Tests are colocated as `*.test.ts(x)` under `src/`; Playwright specs live in `e2e/`. Mock `@/lib/db` with `vi.mock`.
- **Auth**: Auth.js (Credentials, JWT) is planned (#4/#5). Until then `lib/auth/session.ts` is a typed stub that must still return `null` without a `session` cookie and throw `HttpError(401)` from `requireUser()`.

## Current state

Early scaffold: `src/` contains only the landing page, root layout, and globals; the Prisma schema is drafted but no migrations, services, or API routes exist yet. Work is driven by GitHub issues (#1–#20); commit failing tests before implementation (see AGENTS.md §4.1), one branch per issue, Conventional Commits referencing the issue.

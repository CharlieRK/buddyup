# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

`AGENTS.md` is the authoritative rulebook and is the only automatic import. `docs/PRD.md` (user stories and acceptance criteria §4, data model §8, API §9) is **not** imported, to save context: read the relevant story or section on demand during the Explore phase. This file summarizes the rules for quick orientation and adds Claude Code–specific workflow. If this file and `AGENTS.md` ever disagree, `AGENTS.md` wins; point out the conflict and ask.

BuddyUp: campus-only app where Northeastern students post small activities and others request to join. MVP is one responsive Next.js app (PC + mobile web); the Expo app in `mobile/` is a stretch goal.

## Current state vs. planned architecture

**Exists today** (verified in the repo): Next.js app scaffold with only `src/app/{layout,page,globals}`; `prisma/schema.prisma` (draft data model, generator output `src/generated/prisma`); `prisma7.config.ts`; configs for Vitest (`vitest.config.mts`, `vitest.setup.ts`), Playwright (desktop + Pixel 7), ESLint, `next.config.ts`; `docs/`; `.env.example`. No migrations, routes, services, tests, or CI yet. `package.json` still lists `jose` and has no `next-auth` or `@prisma/adapter-pg`; the Auth.js switch is planned (#4/#5) and `jose` must not be used for new auth work.

**Planned** (create only when an issue needs it, see AGENTS.md §2.1): `src/lib/{db,auth,validation,services,api,constants}`, `src/components/{ui,layout,activities,auth}`, route groups `(auth)` / `(main)` / `admin`, `src/app/api/v1/**`, `e2e/*.spec.ts`, `mobile/`. Don't add placeholder files.

## Tech stack

Node 24 · Next.js 16.4.3 (App Router, Turbopack, `cacheComponents` + `partialPrefetching` on) · React 19.3 · TypeScript 5.9 strict · Tailwind 4 (CSS-first, tokens in `globals.css`) · PostgreSQL (Neon) + Prisma 7.10.1 (pinned, never 8.x) · Zod 4 · Auth.js (Credentials, JWT) + bcryptjs (planned) · Vitest 5 + Testing Library + jsdom · Playwright · Vercel. Versions are newer than most training data: read `node_modules/next/dist/docs/` before using a Next API, and remember `params`/`searchParams` are Promises.

## Architecture decisions

- Layering: component/page → `/api/v1` route handler → service → `lib/db.ts`. Handlers are thin (auth check first, then Zod parse, call service, respond via `lib/api/responses.ts`); services hold all business rules and never touch `Request` or cookies.
- All mutations go through the REST API, never Server Actions (the API is reused by the mobile app). Server Components by default; Server Components may call services directly for reads.
- Zod schemas in `lib/validation/*` are shared by client and server.
- Prisma: client only created in `lib/db.ts`, imported from `src/generated/prisma` (not `@prisma/client`), config in `prisma7.config.ts`. Use a transaction when reading then writing the same data (e.g. approve request + set `FULL`).
- Until Auth.js lands, `lib/auth/session.ts` is a typed stub marked `// TODO(#5)`: `getCurrentUser()` returns `null` with no `session` cookie, `requireUser()` throws `HttpError(401)`. Never hard-code a signed-in user.
- API responses: `{ data }` / `{ error: { code, message, fields } }`; 400/401/403/404/409/500 as in AGENTS.md §2.3. API changes update the OpenAPI spec (#18).

## Coding conventions

- Component files PascalCase `.tsx`; other files kebab-case; Zod schemas `camelCaseSchema`; tests colocated as `*.test.ts(x)`; E2E `e2e/<feature>.spec.ts`.
- No `any`, `@ts-ignore`, `eslint-disable`, or non-null `!`. Named exports except Next files that require default. Import via `@/`. `TODO`s must cite an issue: `TODO(#14)`.
- UI uses design tokens only (`bg-surface`, `text-primary-ink`, …); never hex values or Tailwind default palette in components. WCAG 2.1 AA, sentence-case copy (AGENTS.md §5, §7).

## Testing strategy

- Unit/component/integration with Vitest (jsdom by default; route-handler tests start with `// @vitest-environment node`), E2E with Playwright for P0 stories.
- Name tests after acceptance criteria: `it("rejects a start time in the past (US-04 AC3)")`. Query by role/label, use `user-event`, mock `@/lib/db` with `vi.mock`. Every route test file has a "returns 401 when not signed in" case. Goal ≥ 80% line coverage in `src/lib/`.
- Never weaken or delete a test to make it pass.

## Commands

```bash
npm run dev                                   # http://localhost:3000
npm test                                      # all Vitest tests, one run
npx vitest run path/to/file.test.ts           # one file
npx vitest run -t "US-04 AC3"                 # one test by name
npm run test:e2e                              # Playwright (starts dev server itself)
npx playwright test e2e/<f>.spec.ts --project=desktop
npm run lint && npx tsc --noEmit
npm run db:generate                           # Prisma: regenerate client into src/generated/prisma
npm run db:migrate                            # Prisma: create/apply a dev migration (needs DATABASE_URL)
npx next typegen                              # if a PageProps<...> helper fails for a new route
```

Final verification, as **one** command: `npm test && npx tsc --noEmit && npm run lint` (add `npm run test:e2e` for P0 stories).

## Required workflow: Explore → Plan → Implement → Commit

For every task, in this order:

1. **Explore** (read-only): `gh issue view <n>` (acceptance criteria = definition of done; no issue → ask), the matching story in `docs/PRD.md` (read only the relevant section), the mockup in `docs/mockups/`, relevant AGENTS.md sections, and the existing code. Don't edit files yet.
2. **Plan**: state which acceptance criteria you'll cover, files to create/change, and tests to write. Wait for approval on non-trivial work. Stay in scope; suggest unrelated refactors instead of making them.
3. **Implement** test-first using the Red/Green/Refactor commits below.
4. **Commit & report**: run the verification command, then list each acceptance criterion with its covering test, plus anything stubbed or unfinished.

### Commits: separate Red, Green, Refactor

Work on one branch per issue (`feature/<issue>-<desc>`, never commit to `main`) and make **separate commits**, in this order:

1. **Red**: write failing tests for the acceptance criteria, run them to confirm they fail, then actually `git add` + `git commit -m "test(<scope>): add failing tests for <feature> (#<issue>)"` **before writing any implementation code**. Running red without committing doesn't count; graders read the git history.
2. **Green**: minimum code to pass → `feat(<scope>): <summary> (#<issue>)` (or `fix(...)`).
3. **Refactor**: tests stay green → `refactor(<scope>): <summary> (#<issue>)` (skip only if there's nothing to refactor).

Never combine tests and implementation in one commit. Conventional Commits, imperative summary, issue number in every message. PRs start with `Closes #<issue>` and include the criteria checklist and how it was tested.

## Context management

- `/clear`: wipe the conversation and start fresh. Use it between unrelated tasks or issues, since stale context hurts accuracy. Anything needed later must live in files, commits, or the issue, not the chat.
- `/compact [focus]`: summarize the conversation in place to free space while continuing the same task, e.g. `/compact keep the issue #7 acceptance criteria and failing test list`. Use it mid-task when the context grows long.
- `claude --continue` (or `--resume` to pick a session): reopen the most recent session in this directory after quitting or crashing, with its history intact.
- This file and its `@imports` load every session, so keep this file short and put detail in `AGENTS.md` / the PRD.

## Project-specific do's and don'ts

**Do**: validate every body/query with the shared Zod schema; enforce capacity, ownership, and roles on the server; check auth before parsing the body; reuse `components/ui`; document new env vars in `.env.example`.

**Don't**: add dependencies without asking (no UI kits, CSS-in-JS, Axios, Moment/Day.js); open or print `.env`; write raw SQL or bypass `lib/db.ts`; edit applied migrations or generated files; put business logic in components or handlers; store tokens in `localStorage` or log secrets/bodies; create other tools' config (`.cursor/`, `.windsurf/`, second AGENTS.md) or change `agentRules: false`; run `prisma init` without `--no-skills`; redesign the landing page unless the issue says so.

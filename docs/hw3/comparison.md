# HW3 — Before/After Rules Test: US-04 "Create an activity"

**Repo:** https://github.com/CharlieRK/buddyup · **Issue:** #7 (US-04, Sprint 1)
**Branches:** `test/no-rules` (Test A) · `test/with-rules` (Test B) · rules file: `AGENTS.md` v1 on `main`

---

## 1. Methodology

The goal was to change exactly one variable — whether the agent had `AGENTS.md` — and keep everything else the same.

| Condition | Test A (no rules) | Test B (with rules) |
|---|---|---|
| Date / time | Oct 28, 15:59–16:10 | Oct 30, 20:45–20:55 |
| Tool / mode | Cursor, Agent mode | Cursor, Agent mode |
| Model | GPT-5.4 1M Medium | GPT-5.4 1M Medium |
| Starting code | `main` at the same commit (Next.js 16 scaffold + PRD + mockups + test tooling) | Same commit + `AGENTS.md` v1 |
| Prompt | identical (below) | identical |
| Rules active | none: no AGENTS.md, no `.cursor/` rules, empty User Rules, no `~/.claude/CLAUDE.md` | `AGENTS.md` v1 only |
| Human input | "Use your best judgment." to every question; approved every command; no manual edits | same |
| Command approval | "Ask Every Time" | same |

**Prompt used in both runs (brief description only):**

> Implement the "create an activity" feature for this app: a form where a signed-in student enters a title, category, description, start time, location, and capacity, plus an API endpoint that saves it. Include tests.

**Keeping the baseline clean.** Two tools in our stack write agent rules on their own, which would have contaminated Test A:
- **Next.js 16** generates an `AGENTS.md` and re-creates it whenever an AI agent runs `next dev`. We removed it and set `agentRules: false` in `next.config.ts`.
- **Prisma** (both the 8.0 RC tagged `latest` and stable 7.10.1) installs "skills" into `.claude/`, `.cursor/`, `.agents/`, `.windsurf/`. We deleted them, removed the `postinstall` hook, and pinned Prisma 7.10.1.

Cursor's built-in skills (`~/.cursor/skills-cursor`) were present in both runs. Before Test B we restored the environment to Test A's starting state (`rm -rf node_modules src/generated .next && npm ci`), because Test A had installed packages and generated files that would otherwise have leaked into Test B.

---

## 2. Results at a glance

| Metric | Test A (no rules) | Test B (with rules) |
|---|---|---|
| Time to "done" | 11 min | 10 min |
| Commands approved | 6–7 | 19 |
| Questions asked | ~3 | 2–3 |
| Files changed / lines added | 13 / 1,307 | 22 / 1,239 |
| Read the GitHub issue's acceptance criteria | No | **Yes** (`gh issue list`, `gh issue view 7`) |
| Ran tests red before implementing (TDD) | No | **Yes** ("red test run" step) |
| Committed failing tests first | No | No |
| Unit + component tests | 5 tests in 2 files | **8 tests in 4 files** |
| E2E test (Playwright, desktop + mobile) | None | **1 spec, passing on both** |
| Tests named after acceptance criteria | 0 of 5 | **9 of 9** (e.g. "rejects a start time in the past (US-04 AC3)") |
| Acceptance criteria with at least one test (of 5) | 3 (AC3, AC4, AC5) | **5 (AC1–AC5)** |
| `npm test` / `tsc` / `lint` at the end | pass / pass / pass (lint failed once, fixed) | pass / pass / pass |
| Followed the target folder structure (Sec. 2.1) | 0 of 6 key paths | **6 of 6** |
| Added dependencies without asking | **Yes** (`pg`, `@prisma/adapter-pg`, `postinstall` script) | No |
| Used design tokens instead of raw colors | 0 token classes; 50+ `zinc-*` palette classes | **~80 token class uses**; 2 leftover `text-white` |
| Mockup fonts (Bricolage Grotesque + Atkinson Hyperlegible) | No (kept Geist) | **Yes** |
| Mockup UI elements (category chips, capacity stepper, live preview card) | 0 of 3 (`<select>`, number input) | **3 of 3** |
| `aria-*` / label attributes added | 9 | **19** (incl. `aria-describedby` on every error, `aria-pressed` on chips) |
| API error shape per Sec. 2.3 (`{ error: { code, message, fields } }`) | No (`{ error: "...", fieldErrors }`) | **Yes** (`VALIDATION_ERROR` via `lib/api/responses.ts`) |
| Unauthenticated request returns 401, with a test | **Yes** | No — auth stub always returns a demo user |
| Edited files outside the issue (landing page) | Yes | Yes |

---

## 3. Specific differences

### 3.1 Code quality and consistency with project patterns

**Architecture.** AGENTS.md Section 2 specifies thin route handlers, business rules in services, and shared Zod schemas. Test A put everything in two flat files; Test B produced the layered structure exactly.

| Concern | Test A | Test B (matches AGENTS.md) |
|---|---|---|
| Prisma client | `src/lib/prisma.ts` | `src/lib/db.ts` |
| Business logic | `src/lib/activities.ts` (schema + logic mixed) | `src/lib/services/activities.ts` |
| Validation | inside `src/lib/activities.ts` | `src/lib/validation/activity.ts` |
| Auth | `src/lib/auth.ts` | `src/lib/auth/session.ts` with `TODO(#5)` |
| Response helpers | inline `NextResponse.json` ×6 | `src/lib/api/responses.ts` (`created`, `errorResponse`) |
| Category mapping | strings in the form | `src/lib/constants/categories.ts` |

The route handler shows the difference most clearly. Test A's `route.ts` is **108 lines**, with auth, JSON parsing, validation, the Prisma write, and response shaping all in one function. Test B's is **25 lines**:

```ts
// Test B — src/app/api/v1/activities/route.ts
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Request body must be valid JSON.");
  }
  const parsed = createActivitySchema.safeParse(payload);
  if (!parsed.success) return validationErrorResponse(parsed.error);
  const currentUser = await requireUser();
  const result = await createActivity(currentUser.id, parsed.data);
  return created(serializeActivity(result));
}
```

```ts
// Test A — excerpt from a 108-line route.ts
const activity = await prisma.activity.create({
  data: {
    title: parsed.data.title,
    /* ...all fields... */
    hostId: session.userId,
    joinRequests: { create: { userId: session.userId, status: RequestStatus.APPROVED } },
  },
  include: { host: { select: { id: true, name: true } }, /* ... */ },
});
```

**Dependencies.** Without rules, the agent's first `next build` failed because Prisma 7 needs a driver adapter. It then installed `@prisma/adapter-pg` and `pg` and added a `postinstall` script, all without asking. With rules, the agent knew from Section 1 that the adapter belongs to issue #1. It added no dependencies and put the database behind `lib/db.ts` with `// TODO(#1): replace this in-memory stub with the Prisma 7 adapter-backed client.`

### 3.2 Understanding of the design and mockup intent

Test A built a reasonable generic form in Tailwind's default zinc palette: a `<select>` for category, a plain number input for capacity, the default Geist font, and a "Create activity" button. None of the mockup's signature elements appear.

Test B reproduced the mockup (`docs/mockups/06-create-activity.png`):
- **Category chips** with `aria-pressed` and per-category colors from `constants/categories.ts`
- **Capacity stepper** (− / value / +) clamped to 2–20
- **Live `ActivityPreviewCard`** next to the form, including **`SeatDots`**, the mockup's signature component
- **Design tokens** in `globals.css` (`--bg`, `--surface`, `--ink`, `--line`, `--primary`, … with dark-mode values), used as `text-ink`, `border-line`, `bg-surface-2`
- **Fonts** switched to Bricolage Grotesque (headings) and Atkinson Hyperlegible (body) via `next/font/google`
- **Copy** from Section 5.5: button "Post activity", inline errors under each field

### 3.3 Naming conventions and architecture

| Rule (AGENTS.md Sec. 3) | Test A | Test B |
|---|---|---|
| Component files PascalCase | `create-activity-form.tsx` ✗ | `CreateActivityForm.tsx`, `SeatDots.tsx`, `ActivityPreviewCard.tsx` ✓ |
| Components grouped by feature | `src/components/` (flat) ✗ | `src/components/activities/` ✓ |
| Signed-in pages under `(main)` route group | `src/app/activities/...` ✗ | `src/app/(main)/activities/...` + `(main)/layout.tsx` ✓ |
| Zod schema named `createActivitySchema` | ✓ | ✓ |
| `TODO`s reference an issue | n/a | `TODO(#5)`, `TODO(#1)` ✓ |
| Next.js route type helpers (`PageProps<...>`) | — | Started with `PageProps<"/activities/[id]">`, then replaced it with a hand-written type when typecheck failed ✗ |

### 3.4 Quality of tests generated

Test A wrote 5 tests that check behavior but aren't traceable to requirements. Category values and the capacity range had no tests, and there was no E2E test.

Test B wrote tests at **every level in the testing table** (Section 4.2), each named after an acceptance criterion:

```
✓ src/lib/validation/activity.test.ts (3)
    accepts valid input with supported categories and capacity range (US-04 AC1, AC2)
    rejects a start time in the past (US-04 AC3)
    rejects capacities outside the supported range (US-04 AC1)
✓ src/lib/services/activities.test.ts (1)
    creates an activity for the host and counts them as the first member (US-04 AC4, AC5)
✓ src/app/api/v1/activities/route.test.ts (2)
✓ src/components/activities/CreateActivityForm.test.tsx (2)
✓ e2e/create-activity.spec.ts — desktop + mobile
```

The component tests query by role (`getByRole("button", { name: "Post activity" })`), as Section 4.2 requires.

**Where Test B was weaker:** its auth stub always returns a demo user, and `requireUser()` throws a plain `Error` (which becomes a 500), so **no test covers the unauthenticated case**. Test A checked for a session cookie, returned 401/403, and tested the 401 path. The rules said to create a stub but never said the stub must still reject anonymous requests. v2 fixes that gap.

---

## 4. Was the improvement measurable?

Yes. On every dimension the rules addressed directly, Test B moved from non-compliant to compliant:

- **Requirements traceability:** 0 → 9 tests named after acceptance criteria; AC coverage 3/5 → 5/5
- **Architecture:** 0/6 → 6/6 target paths; route handler 108 → 25 lines
- **Design fidelity:** 0/3 → 3/3 mockup elements; 0 → ~80 design-token uses; correct fonts
- **Test depth:** 5 → 8 unit/component tests, plus an E2E spec on two viewports
- **Dependency discipline:** 2 unrequested packages → 0

Two costs and two gaps also showed up:
- **More approvals (6–7 → 19).** The extra commands were the workflow the rules asked for (reading the issue, a red test run, and a final test + tsc + lint + E2E pass), not trial and error. Total time didn't increase (11 → 10 min).
- **TDD commits were not made.** The agent ran tests red first but never committed, so the git history still wouldn't show "failing tests before implementation."
- **Security regressed** on the unauthenticated path (Section 3.4).
- Both runs **edited the landing page**, which US-04 doesn't ask for.

These four findings are what changed in AGENTS.md v2 (see its Changelog).

---

## 5. Evidence

- Screenshots: `docs/hw3/screenshots/test-a-*.png`, `test-b-*.png`
- Full code: compare `main...test/no-rules` and `main...test/with-rules` on GitHub
- Command output: `docs/hw3/test-a-results.txt`, `docs/hw3/test-b-results.txt`

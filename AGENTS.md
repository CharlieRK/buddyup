# AGENTS.md — BuddyUp

<!--
  WHY THIS FILE EXISTS
  This is the single source of truth that AI coding tools (Cursor, Claude Code, Antigravity, etc.)
  read before touching this repo. It turns our PRD, mockups, and team conventions into rules an
  agent can follow, so generated code fits the project instead of the agent's generic defaults.
  Humans should read it too: it doubles as our engineering handbook.
  Maintained by: Haoran Lyu (and partner, once assigned). Update it in the same PR as any change
  to the stack, architecture, or conventions. See the Changelog at the bottom.
-->

BuddyUp is a campus-only web app where Northeastern students post small activities
(pickup games, study sessions, food runs) and other students request to join.
Course: CS6983 AI Coding, Fall 2026, Project 2.

---

## 0. How to work in this repo (read first)

<!-- Why: agents do best with an explicit loop. This makes every task start from the issue's
     acceptance criteria and end with proof that they are met. -->

For every task:

1. **Find the GitHub issue** for the work (`gh issue view <number>`). Its acceptance criteria are the
   definition of "done". If there is no issue, ask before starting.
2. **Read the context** for that feature: the matching user story in `docs/PRD.md`, the mockup
   listed in the issue (`docs/mockups/*.png`, interactive version in `docs/mockups/buddyup-mockup.html`),
   and the sections of this file that apply.
3. **Before writing code, state your plan**: which acceptance criteria you'll cover, which files
   you'll create or change, and which tests you'll write.
4. **Work test-first** (Section 4): write failing tests, then implement, then refactor.
5. **Verify before saying you're done**: `npm test`, `npx tsc --noEmit`, and `npm run lint` must all pass.
6. **Report**: list each acceptance criterion and the test that covers it. Call out anything you
   could not finish or had to stub.

If something in a request conflicts with this file, point out the conflict and ask.

---

## 1. Tech stack and versions

<!-- Why: our versions are newer than most models' training data (Next 16, Prisma 7, Zod 4,
     Tailwind 4, Vitest 5). Pinning them here stops agents from writing outdated APIs. -->

| Layer | Package | Version |
|---|---|---|
| Runtime | Node.js | 24.x |
| Framework | `next` (App Router, Turbopack) | 16.4.3 |
| UI | `react` / `react-dom` | 19.3.0 |
| Language | `typescript` (strict) | 5.9.3 |
| Styling | `tailwindcss` + `@tailwindcss/turbopack` | 4.3.3 |
| Database | PostgreSQL (hosted, e.g. Neon) | — |
| ORM | `prisma` / `@prisma/client` (pinned exact) | 7.10.1 |
| Validation | `zod` | 4.6.7 |
| Auth | `jose` (JWT) + `bcryptjs` (password hashing) | 6.2.13 / 3.0.3 |
| Unit + integration tests | `vitest` + `@testing-library/react` + `jsdom` | 5.0.5 / 16.3.3 / 29.1.1 |
| E2E tests | `@playwright/test` (desktop + mobile projects) | 1.64.1 |
| Lint | `eslint` + `eslint-config-next` | 9.39.5 / 16.4.3 |
| Hosting | Vercel (preview deploy per PR) | — |
| Real-time | Managed WebSocket provider, decided in issue #12 | TBD |

### Version-specific notes

- **Next.js 16 has breaking changes from older versions.** Before using any Next.js API
  (routing, route handlers, caching, forms, metadata, fonts), read the matching guide in
  `node_modules/next/dist/docs/` and follow deprecation notices.
  - `cacheComponents` and `partialPrefetching` are **enabled** in `next.config.ts`. Dynamic data
    (cookies, headers, DB reads per request) must follow the Cache Components rules in the local docs.
  - `params` and `searchParams` are **Promises**: `const { id } = await params`.
  - Use Next's generated route type helpers (`PageProps<"/activities/[id]">`, `LayoutProps<"/">`).
- **Tailwind 4 is CSS-first.** There is no `tailwind.config.js`. Design tokens live in
  `src/app/globals.css` under `@theme` (Section 5.2).
- **Prisma 7**: config is in `prisma7.config.ts`; the schema is `prisma/schema.prisma`.
  Import the generated client from the path set in the schema's `generator` block (do not assume
  `@prisma/client` re-exports the models). Prisma 7 connects through a driver adapter
  (`@prisma/adapter-pg`), added in issue #1.
- **Zod 4**: use `z.email()`, `z.iso.datetime()`, and `z.infer<typeof schema>`; read errors with
  `z.flattenError(error)` / `error.issues`.

---

## 2. Architecture

<!-- Why: without a target structure, every agent session invents its own folders. This keeps
     features in predictable places and keeps business logic out of UI and route files. -->

### 2.1 Folder structure

```
src/
  app/
    page.tsx                      # Landing (public)
    (auth)/login/page.tsx         # Log in
    (auth)/signup/page.tsx        # Sign up
    (main)/layout.tsx             # Signed-in shell with <TopNav />
    (main)/explore/page.tsx
    (main)/activities/new/page.tsx
    (main)/activities/[id]/page.tsx
    (main)/activities/[id]/requests/page.tsx
    (main)/me/activities/page.tsx
    (main)/profile/page.tsx
    admin/page.tsx                # Admin only
    api/v1/<resource>/route.ts    # Public REST API (Section 2.3)
  components/
    ui/                           # Generic building blocks: Button, Field, Chip, SegmentedControl, Avatar, Toast
    layout/                       # TopNav, PageHeader
    activities/                   # ActivityCard, SeatDots, CreateActivityForm, ActivityPreviewCard, ...
    auth/                         # SignupForm, LoginForm
  lib/
    db.ts                         # The ONLY place that creates the Prisma client
    auth/session.ts               # getCurrentUser(), requireUser(), requireAdmin()
    auth/password.ts              # hashPassword(), verifyPassword()
    validation/<resource>.ts      # Zod schemas shared by client and server
    services/<resource>.ts        # Business logic (capacity rules, status changes) — no HTTP here
    api/responses.ts              # ok(), created(), errorResponse() helpers
    constants/categories.ts       # Category enum ↔ label ↔ color mapping
e2e/<feature>.spec.ts             # Playwright tests
prisma/schema.prisma              # Data model (PRD section 8)
docs/                             # PRD, mockups, decisions, HW write-ups
```

Create folders as features need them; don't add empty placeholder files.

### 2.2 Layering rules

```
Page / Component  ──fetch──▶  /api/v1 route handler  ──▶  service  ──▶  lib/db (Prisma)
       │                              │
       └── Server Components may call services directly for reads
```

- **Route handlers are thin**: parse input with the Zod schema → check auth → call a service →
  return a response with the helpers in `lib/api/responses.ts`.
- **Services hold the rules** (e.g., "host counts as first member", "can't approve when full")
  and take plain typed inputs. They never read `Request` or cookies.
- **All mutations go through the REST API** (`/api/v1`), not Server Actions. The API is a P2
  requirement and will be reused by future iOS/Android clients.
- **Server Components by default.** Add `"use client"` only to components that need state,
  effects, or event handlers, and keep those components small.
- Until auth (issue #5) lands: if `getCurrentUser()` doesn't exist yet, create it in
  `lib/auth/session.ts` as a typed stub and mark it `// TODO(#5): replace with JWT session`.
  Until the database (issue #1) lands: code against `lib/db.ts` anyway and mock it in tests.

### 2.3 API conventions

- Base path `/api/v1`. Endpoints and methods are listed in `docs/PRD.md` section 9.
- JSON only. Dates are ISO 8601 strings in UTC.
- Success: `{ "data": ... }` with `200` (read/update) or `201` (create).
- Error: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "title": ["..."] } } }`.
- Status codes: `400` invalid input, `401` not signed in, `403` not allowed, `404` not found,
  `409` conflict (duplicate request, activity full), `500` unexpected.
- Every new or changed endpoint updates the OpenAPI spec (issue #18) in the same PR.

---

## 3. Naming conventions and code style

<!-- Why: consistent names make AI output reviewable and make it obvious when generated code
     ignored the project's patterns. -->

| Thing | Convention | Example |
|---|---|---|
| React component files | PascalCase `.tsx` | `ActivityCard.tsx` |
| Other source files | kebab-case | `join-requests.ts`, `responses.ts` |
| Components, types, interfaces | PascalCase | `ActivityCard`, `CreateActivityInput` |
| Functions, variables | camelCase, verbs for functions | `createActivity()`, `spotsLeft` |
| Constants | UPPER_SNAKE_CASE | `MAX_CAPACITY` |
| Zod schemas | camelCase + `Schema` | `createActivitySchema` |
| Types from schemas | `z.infer` | `type CreateActivityInput = z.infer<typeof createActivitySchema>` |
| Prisma models / enums | PascalCase / UPPER_SNAKE values | `Activity`, `Category.ARTS_CULTURE` |
| Tests | same name + `.test.ts(x)`, next to the file | `activity.test.ts` |
| E2E specs | feature name + `.spec.ts` | `e2e/create-activity.spec.ts` |
| Route folders | kebab-case, plural resources | `api/v1/activities/[id]/requests` |

Code style:
- TypeScript strict; **no `any`** (use `unknown` and narrow). No non-null `!` to silence errors.
- Named exports everywhere except Next.js files that require default exports (`page.tsx`, `layout.tsx`).
- Import with the `@/` alias, not long relative paths.
- Small functions; early returns over nested `if`s.
- Comments explain *why*, not *what*. Non-obvious decisions may reference an issue: `// See #10`.
- `TODO`s must reference an issue: `// TODO(#14): ...`.

---

## 4. Testing strategy (TDD)

<!-- Why: P2 grades TDD from git history ("failing tests committed before implementation").
     Agents skip tests or write them last unless told exactly how. -->

### 4.1 The loop (required for every feature and bug fix)

1. **Red**: write tests that encode the issue's acceptance criteria. Run them and confirm they fail.
   Commit: `test(<scope>): add failing tests for <feature> (#<issue>)`.
2. **Green**: write the minimum code to pass. Commit: `feat(<scope>): <summary> (#<issue>)`.
3. **Refactor** with tests still green. Commit: `refactor(<scope>): ...` if needed.

Never weaken or delete a test to make it pass. If a test is wrong, explain why before changing it.

### 4.2 What to test where

| Level | Tool | What | Location |
|---|---|---|---|
| Unit | Vitest | Zod schemas, services, utilities | `src/**/*.test.ts` |
| Component | Vitest + Testing Library (jsdom) | Form validation messages, button states, rendering by role | `src/components/**/*.test.tsx` |
| Integration | Vitest (Node env) | Route handlers end-to-end through the service; DB mocked until #1, then a test database | `src/app/api/**/*.test.ts` with `// @vitest-environment node` at the top |
| E2E | Playwright | Happy path of every P0 user story, desktop and mobile | `e2e/*.spec.ts` |

Rules:
- **Name tests after acceptance criteria** so coverage is traceable:
  `it("rejects a start time in the past (US-04 AC3)")`.
- Query the DOM the way users do: `getByRole`, `getByLabelText`. No `getByTestId` unless there's no accessible option.
- Use `@testing-library/user-event` for interactions, not `fireEvent`.
- Mock `@/lib/db` with `vi.mock` in unit/integration tests; never hit a real database from unit tests.
- Test route handlers by importing the exported `POST`/`GET` and calling them with a `Request`.
- Coverage goal: **≥ 80% lines in `src/lib/`**, and every acceptance criterion has at least one test.

Commands: `npm test` (unit + integration), `npm run test:watch`, `npm run test:e2e`.

---

## 5. Product and design references

<!-- Why: this is the bridge from PRD/mockups to code. Agents can't "see" our design unless we
     describe the tokens, components, and flows in words they can apply. -->

### 5.1 Sources of truth

- **PRD**: `docs/PRD.md` — user stories with acceptance criteria (section 4), data model (8), API (9).
- **Mockups**: `docs/mockups/01-landing.png` … `10-admin.png`; interactive version
  `docs/mockups/buddyup-mockup.html` (open it in a browser to see states and interactions).
- **Backlog**: GitHub issues #1–#20; each feature issue names its mockup and API endpoint.

| Screen | Route | Mockup |
|---|---|---|
| Landing | `/` | `01-landing.png` |
| Log in / Sign up | `/login`, `/signup` | `02-signin.png`, `03-signup.png` |
| Explore | `/explore` | `04-explore.png` |
| Activity detail | `/activities/[id]` | `05-activity-detail.png` |
| Create activity | `/activities/new` | `06-create-activity.png` |
| My activities | `/me/activities` | `07-my-activities.png` |
| Manage requests | `/activities/[id]/requests` | `08-manage-requests.png` |
| Profile | `/profile` | `09-profile.png` |
| Admin dashboard | `/admin` | `10-admin.png` |

### 5.2 Design tokens

Define these in `src/app/globals.css` (`:root` + `@theme inline`) and use them through Tailwind
classes (`bg-surface`, `text-muted`, `border-line`, ...). **Never hard-code hex values in components.**

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F2F5FA` | `#0C1220` | Page background |
| `surface` | `#FFFFFF` | `#151E33` | Cards, panels, inputs |
| `surface-2` | `#EBF0F8` | `#1C2742` | Subtle fills, segmented controls |
| `ink` | `#14213D` | `#E9EEF8` | Primary text |
| `muted` | `#56627D` | `#A1ACC6` | Secondary text |
| `line` | `#D3DAE8` | `#2C3858` | Borders, empty seats |
| `primary` / `primary-soft` | `#2F5BEA` / `#E4EBFF` | `#7D98FF` / `#22305A` | Main actions, filled seats, tags |
| `sun` / `sun-ink` | `#FFC93C` / `#3A2A00` | `#FFD25E` / `#2A1F00` | "1 spot left", the viewer's own seat |
| `ok` / `ok-soft` | `#147A52` / `#DDF3EA` | `#4BCB94` / `#173B2E` | Live indicator, Joined/Hosting flags |
| `danger` / `danger-soft` | `#B8283F` / `#FBE3E7` | `#FF7A8F` / `#43202A` | Errors, destructive actions |

- **Fonts** (via `next/font/google`, replacing the default Geist): **Bricolage Grotesque** for
  headings (weights 700/800), **Atkinson Hyperlegible** for body text (400/700).
- **Shape**: cards and panels `rounded-[20px]` with a 1.5px `line` border and no drop shadow;
  buttons and inputs `rounded-xl`; chips and badges fully rounded.
- **Layout**: content max width 1180px, sticky top nav (68px), responsive down to 360px.
- **Dark mode** follows `prefers-color-scheme`.

### 5.3 Key components and expected behavior

- **`SeatDots`** — the signature element. One dot per spot: filled `primary` = member,
  dashed `line` outline = open, `sun` = the current user. Small (12px) on cards, large (50px
  avatars with initials) on the detail page. Has an `aria-label` like "3 of 6 spots taken".
- **Spots badge** — "N spots left"; `sun` background when exactly 1 left; "Full" in `muted` at 0.
- **`ActivityCard`** — whole card is one link to the detail page. Shows category (colored
  square + label), time, title, location, host, `SeatDots`, spots badge. Shows a "Hosting" /
  "Joined" / "Requested" flag instead of the time when it applies to the viewer.
- **Category chips** — single-select, `aria-pressed`, colors from `lib/constants/categories.ts`:
  Sports `#2F5BEA`, Study `#7A4FD6`, Food `#E07A1F`, Arts & Culture `#C2367A`, Outdoors `#178A5C`,
  Gaming `#0E8FA3`, Other `#6B7591`.
- **`CreateActivityForm`** — category chips, title, date + time, location, capacity stepper
  (− / number / +, range 2–20, default 4), optional details. Validates on submit with the shared
  Zod schema and shows errors **under each field**. A live `ActivityPreviewCard` beside the form
  updates as the user types. Submit button: "Post activity"; on success redirect to the new
  activity and show the toast "Activity posted".
- **Detail action button** (one per viewer state): "Request to join" → optional message →
  "Send request"; "Waiting for <host>" + "Withdraw request"; "You're in" + "Leave this activity";
  "Full" (disabled); host sees "Manage requests (N)".
- **TopNav** — logo, Explore, My activities (unread badge), "Create activity" button, avatar → Profile.
- **Toasts** — bottom center, `role="status"`, auto-hide after ~2.5s.

### 5.4 User flows to follow

1. **Host**: Sign up → profile → Create activity → detail page → new request appears live →
   Approve → group chat.
2. **Participant**: Log in → Explore → filter by category/date → open activity → Request to join →
   status changes to "You're in" live → group chat.
3. **Admin**: Log in as admin → `/admin` → review report → dismiss, remove activity, or suspend user.

### 5.5 Copy guidelines

- Sentence case everywhere. No ALL CAPS labels.
- Buttons say exactly what happens ("Post activity", "Send request"), and the matching toast
  repeats the verb ("Activity posted", "Request sent").
- Errors say what to fix, in the interface's voice, without apologizing:
  "Use your @northeastern.edu email address.", "Pick a time in the future.",
  "Add where you'll meet."
- Empty states invite an action: "Nothing here yet. Start one and others can join you."

---

## 6. Workflow: Scrum, branches, commits, PRs

<!-- Why: P2 grades branch-per-issue, PR reviews, and sprint tracking. Writing the conventions
     down means agents produce branch names, commits, and PR text we can use as-is. -->

- **Board**: https://github.com/users/CharlieRK/projects/1 — columns Backlog → Sprint Todo →
  In Progress → In Review → Done. Sprints are milestones "Sprint 1" (due Nov 5) and "Sprint 2" (due Nov 12).
- **One branch per issue**, created from up-to-date `main`:
  `feature/<issue>-<short-desc>`, `fix/<issue>-...`, `chore/<issue>-...`, `docs/<issue>-...`
  (e.g. `feature/7-create-activity`). Never commit directly to `main`.
- **Commits** follow Conventional Commits and reference the issue:
  `<type>(<scope>): <imperative summary> (#<issue>)` — types: `feat`, `fix`, `test`, `refactor`,
  `chore`, `docs`, `style`, `ci`. Example: `feat(activities): add create activity API (#7)`.
- **Pull requests**:
  - Title like the main commit; body starts with `Closes #<issue>`.
  - Include: summary, acceptance-criteria checklist copied from the issue, how it was tested,
    screenshots for UI changes.
  - CI must be green; at least one review from the partner before merging (once a partner is
    assigned). Squash-merge, delete the branch.
  - Move the card: In Progress when the branch starts, In Review when the PR opens.
- **Referencing issues in code**: only for non-obvious decisions (`// See #10`) and TODOs (`TODO(#14)`).

---

## 7. Do's and Don'ts

<!-- Why: concrete guardrails catch the mistakes we've already seen (tools silently adding agent
     files, prerelease upgrades) and the ones that would cost points (security, accessibility). -->

### Do
- Validate every request body and query string on the server with the shared Zod schema.
- Enforce rules on the server, even if the UI also checks them (capacity, ownership, roles).
- Use a Prisma transaction when reading and then writing the same data (e.g., approving a request
  and updating `FULL` status).
- Reuse `components/ui` building blocks before creating new ones.
- Keep secrets in `.env` (git-ignored) and document new variables in `.env.example`.
- Run `npm test`, `npx tsc --noEmit`, and `npm run lint` before declaring a task done.

### Don't
- **Don't add dependencies without asking.** Preferred libraries are the ones in Section 1.
  No UI component kits (shadcn, MUI, Chakra), no CSS-in-JS, no Axios (use `fetch`), no Moment/Day.js
  (use `Intl.DateTimeFormat`).
- **Don't upgrade Prisma to 8.x** (its `latest` tag is a release candidate). Keep versions pinned.
- **Don't create agent/tool config files** (`.cursor/`, `.claude/`, `.agents/`, `.windsurf/`,
  skills folders, a second AGENTS.md). If you ever run `prisma init`, pass `--no-skills`.
  `agentRules: false` in `next.config.ts` must stay.
- Don't use `any`, `@ts-ignore`, or `eslint-disable` to get past errors.
- Don't put business logic in components or route handlers (Section 2.2).
- Don't write raw SQL or bypass `lib/db.ts`.
- Don't edit applied migrations or generated files; create a new migration instead.
- Don't store tokens in `localStorage` or log passwords, tokens, or full request bodies.

### Security requirements
- Passwords hashed with `bcryptjs` (cost ≥ 10); never returned by any API.
- JWT signed with `jose` (HS256, secret from `JWT_SECRET`), stored in an `httpOnly`, `secure`,
  `sameSite=lax` cookie; 7-day expiry.
- Sign-up restricted to `@northeastern.edu`; suspended users can't log in.
- Every route checks authentication and authorization (owner/host/admin) before doing work.
- Generic login error ("Email or password is incorrect"); rate-limit auth endpoints.
- Limit input sizes (title ≤ 80, request message ≤ 200, chat message ≤ 1000 characters).

### Accessibility requirements (WCAG 2.1 AA)
- Semantic HTML: one `<h1>` per page, landmarks (`header`, `nav`, `main`), real `<button>` and `<a>`.
- Every input has a visible `<label>`; errors are linked with `aria-describedby` and announced.
- Visible focus ring on everything interactive (`focus-visible:` styles); full keyboard use.
- Touch targets at least 44×44px. Text contrast at least 4.5:1 (the tokens above meet this).
- Don't rely on color alone: seat dots and status badges also have text or `aria-label`s.
- Respect `prefers-reduced-motion`.

---

## 8. Definition of Done

- [ ] All acceptance criteria in the issue are met and each one has a test
- [ ] Failing tests were committed before the implementation
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint` pass; E2E covers the happy path for P0 stories
- [ ] UI matches the mockup and the accessibility requirements above
- [ ] API changes reflected in the OpenAPI spec
- [ ] PR opened with `Closes #<issue>`, CI green, reviewed

---

## Changelog

<!-- Why: HW3 asks for evidence of iteration. Each version records what changed and why. -->

- **v1 — 2026-10-29**: Initial rules from the PRD, mockups, and project setup. Includes lessons
  from setup: Next.js 16 and Prisma 7 write their own agent files unless disabled
  (`agentRules: false`, `prisma init --no-skills`), and Prisma's `latest` tag is an 8.0 RC.

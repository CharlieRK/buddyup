# BuddyUp for Project 3: Team Proposal

Nov 16, 2026 · Haoran Lyu · Status: **agreed with partner (@Sijia711) on Nov 17; waiting for professor approval**

> **Update, Nov 17:** the P3 deadline moved from Dec 16 to **Dec 8**. The timeline below is
> compressed to match.
>
> **Update, Nov 17 (scope):** the MVP is **PC web + mobile web** (one responsive Next.js app).
> A **mobile app** is a stretch goal that Haoran builds alone, started only after the web MVP
> works: an Expo (React Native) app for the core participant flow (log in, Explore, detail,
> request to join) using the same `/api/v1` API; hosting and admin stay web-only. Web work is
> split between both partners. Tasks are assigned by Haoran, not by the work-split
> table below, which is now only a suggestion.

## TL;DR

I propose we build **BuddyUp** for P3: a campus-only web app where Northeastern students post
small activities (pickup games, study sessions, food runs) and other students request to join.

- **It fits P3:** a real problem, three user roles (participant, host, admin), and the
  Next.js + PostgreSQL + Vercel stack P3 recommends.
- **It's a new idea for grading:** I planned it for HW3, but we never built or submitted it as a
  project. We built LinkShelf for P2.
- **We start ahead:** the PRD, mockups, 20 GitHub issues, a project board, and a tested rules file
  already exist, so we can spend our time on Claude Code mastery, CI/CD, and polish, which are
  120 of the 200 points.

## What's already done

All of this is in the repo on `main` and can be reused as-is or with small updates.

| Asset | Where | P3 use |
|---|---|---|
| PRD: 14 user stories with acceptance criteria, data model, API list | `docs/PRD.md` | Specs for TDD and issues |
| Interactive mockup + 10 screenshots | `docs/mockups/` | UI reference for every screen |
| 20 GitHub issues with AC checklists, labels, estimates | Issues tab | Backlog (needs re-sprinting) |
| Project board: Backlog → Sprint Todo → In Progress → In Review → Done | [Board](https://github.com/users/CharlieRK/projects/1) | Pair process |
| `AGENTS.md` v2: stack, architecture, naming, TDD, design tokens, workflow, security | Repo root | Base for `CLAUDE.md` via `@AGENTS.md` |
| Next.js 16.4.3, Tailwind 4, Prisma 7.10.1 schema, Vitest 5, Playwright | Repo root | Skeleton is ready |
| HW3 before/after test of US-04 (with and without rules) | `docs/hw3/`, branch `test/with-rules` | Reference code only, not merged |

Setup gotchas are already solved: Next.js 16 and Prisma both auto-write agent files, which we
disabled (`agentRules: false`, `prisma init --no-skills`).

## How BuddyUp meets P3

BuddyUp already covers the product requirements; the gaps are the Claude Code and CI/CD work every
team has to do anyway.

| P3 requirement | BuddyUp today | What we still do |
|---|---|---|
| Real problem, new idea | Campus activity buddy-finder; not built for any project yet | Confirm "new idea" with the professor |
| 2+ user roles | Participant, host, admin | — |
| Next.js full-stack + PostgreSQL | Next.js 16 App Router, Prisma 7 schema with 5 models | Hosted Postgres (Neon) |
| Auth (Auth.js, Clerk, or equivalent) | Planned custom JWT | **Switch to Auth.js**, keep the @northeastern.edu restriction |
| Vercel with preview deploys | Planned | Set up |
| Issues with AC as testable specs | 20 issues | Re-assign to new sprints |
| TDD for 3+ features, 70%+ coverage, unit + integration + E2E | Rules + tooling ready | Do it, committing red tests first |
| CLAUDE.md with @imports, memory, git evolution | `AGENTS.md` v2 | Build `CLAUDE.md` on top (next section) |
| Skills, hooks, MCP, agents, worktrees, writer/reviewer + C.L.E.A.R. | None yet | Next section |
| CI/CD: 8 stages | None yet | GitHub Actions workflow |
| 4+ security gates, OWASP in CLAUDE.md | Security rules in `AGENTS.md` | Gitleaks, npm audit, SAST/security agent, OWASP section |
| Blog post, 5–10 min video, README with Mermaid diagram | None yet | Last week |

## Claude Code plan (55 points)

This is the core of the grade, so each item below needs evidence in the repo, not just config.

| Feature | Plan | Evidence |
|---|---|---|
| `CLAUDE.md` + @imports | Short `CLAUDE.md` that imports `@AGENTS.md`, `@docs/architecture.md`, `@docs/testing.md`, `@docs/security.md` (OWASP Top 10) | Git history of each file |
| Auto-memory | Use `#` / memory for decisions found during work | Screenshots, memory diffs |
| Skills (2+) | `/fix-issue <n>` (read issue → red tests → implement → PR) and `/create-pr` (AI disclosure + AC checklist) | v1 → v2 commit on at least one, session screenshots |
| Hooks (2+) | PostToolUse: Prettier + ESLint on edited files. Stop: run `npm test`. PreToolUse: block edits to `.env` and applied migrations | `.claude/settings.json` |
| MCP (1+) | GitHub MCP for issues/PRs; Playwright MCP for E2E debugging | `.mcp.json`, session screenshots |
| Agents (1+) | Sub-agents `security-reviewer` and `test-writer` in `.claude/agents/` | PR comments with agent output |
| Worktrees | Two features in parallel, e.g. Explore feed and Admin dashboard | `git worktree` branches in history |
| Writer/reviewer + C.L.E.A.R. | One session writes, another reviews; review comment follows C.L.E.A.R. | 2+ PRs with review comments and AI disclosure |

## Scope

P3 spends most points on process, so I suggest a smaller feature set done well rather than all
14 stories.

**MVP (must ship):**

- Sign up / log in with Auth.js, @northeastern.edu only (US-01, US-02)
- Profile (US-03)
- Create activity (US-04), Explore feed with filters (US-05), activity detail (US-06)
- Request to join, approve/decline (US-07, US-08)
- Report + admin moderation dashboard (US-12, US-13): this is our second user role
- Public API docs with OpenAPI (US-14)

**Stretch (only if time allows):** live spot updates (US-09), group chat (US-10),
edit/cancel/leave (US-11).

**Bonus idea, +4 points (Agent SDK in the app):** a **report triage agent**. When a student
reports an activity or user, an agent reads the report, the activity, and recent messages. It
suggests a category (spam, harassment, unsafe, OK) with a reason, and the admin makes the final
call. It fits the admin role and makes a strong demo. Other bonuses: fast-check property tests on
validation (+3) and Stryker mutation testing (+3).

## Timeline

Two one-week sprints fit before the Dec 8 deadline, with the last three days kept for polish and
deliverables. If Sprint 1 slips, the bonus triage agent is the first thing to cut.

| Phase | Dates (2026) |
|---|---|
| Setup + Claude Code config | Nov 18 – Nov 20 |
| Sprint 1: core flow | Nov 21 – Nov 28 |
| Sprint 2: admin + agent | Nov 29 – Dec 4 |
| Latest idea approval | Dec 1 |
| Polish, blog, video | Dec 5 – Dec 7 |
| **P3 due** | **Dec 8** |

- **Setup:** `CLAUDE.md` with @imports, hooks, `.mcp.json`, Auth.js, Neon, Vercel, CI skeleton,
  new milestones.
- **Sprint 1 (core flow):** auth, profile, create activity, Explore, detail, join + approve; TDD on
  each, red tests committed first.
- **Sprint 2 (second role + mastery):** report + admin dashboard, triage agent, two features in
  parallel worktrees, writer/reviewer PRs, all 8 CI stages green.
- **Polish:** coverage to 70%+, README with Mermaid diagram, blog post, 5–10 min video,
  reflections, showcase form.

Thanksgiving (Nov 26) falls in Sprint 1, so we may want a lighter load that week.

## Proposed work split

Each of us owns features end to end, and we review each other's PRs. That keeps commits and
reviews balanced, which P3 checks (±10%).

| Area | Haoran | Partner |
|---|---|---|
| Features | Create activity, Explore feed, detail page | Auth.js sign-up/login, profile, join requests + approvals |
| Second role | Report triage agent (bonus) | Report + admin dashboard |
| Claude Code | `CLAUDE.md` + @imports, `/fix-issue` skill, hooks | `/create-pr` skill, `.mcp.json`, sub-agents |
| Infra | Vercel + Neon, preview deploys | GitHub Actions pipeline, security gates |
| Docs | README + Mermaid diagram, video | Blog post, sprint docs |
| Both | Reviewing each other's PRs (C.L.E.A.R.), 3+ async standups per sprint, individual reflection | same |

Happy to swap any of these. This is a starting point.

## Open questions and next steps

- [x] Do you want to build BuddyUp for P3? If you'd rather pitch something else, let's compare by
      Nov 18, 2026.
- [x] Is the work split OK, or should we swap areas? (agreed as proposed)
- [ ] Post the idea in Slack #projects for approval as soon as we agree. The hard deadline is one
      week before the deadline, so no later than Dec 1, 2026 (was Dec 9 before the deadline moved).
- [ ] Kick off Sprint 1 by Nov 20, 2026: reset milestones, add you as a collaborator with admin
      rights, and set up Claude Code on both machines.

**Draft Slack message for #projects:**

> Hi Professor, [partner] and I would like approval for our P3 idea: **BuddyUp**, a campus-only
> app where Northeastern students post small activities (pickup games, study groups, food runs)
> and others request to join. Roles: participant, host, and admin (moderation dashboard with an
> Agent SDK report-triage agent). Stack: Next.js, PostgreSQL (Prisma), Auth.js, Vercel. Note: I
> wrote the PRD and backlog for this idea during HW3, but it hasn't been built or submitted as a
> project (our P2 was LinkShelf). Does that count as a new idea for P3? Thank you!

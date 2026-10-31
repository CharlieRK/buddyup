# HW3 Reflection — Context Engineering for BuddyUp

**Haoran Lyu · CS6983 AI Coding · Fall 2026**

## How the rules file bridges the PRD and mockups to implementation

Before this assignment, my PRD and mockups lived in `docs/` and I assumed an AI agent would just "use them." The no-rules test showed that's only half true. The agent did find the PRD by itself: it used the `/api/v1/activities` path from PRD section 9. But it treated the PRD as background reading, not as a contract. It built a generic Tailwind form in the default zinc palette, with a `<select>` for category and a number input for capacity. It ignored the mockup's category chips, capacity stepper, live preview card, fonts, and the "seat dots" that are the visual identity of the app. Its five tests checked plausible behavior, but none could be traced back to an acceptance criterion.

`AGENTS.md` changed that by translating the design into things an agent can act on. A screenshot can't tell a model that `#2F5BEA` is `primary` or that buttons say "Post activity." A token table, a component list with expected behavior, and copy rules can. With the rules active, the same model and prompt produced the chips, the stepper, the preview card with `SeatDots`, the right fonts, about 80 uses of design-token classes, and tests named like "rejects a start time in the past (US-04 AC3)." The most effective line in the file was step 1 of "How to work in this repo": *find the GitHub issue and treat its acceptance criteria as the definition of done*. Because of it, the agent ran `gh issue view 7` before writing anything, and AC coverage went from 3 of 5 to 5 of 5. For me, the rules file is the bridge: the PRD says *what*, the mockups show *what it looks like*, and `AGENTS.md` says *how to turn those into code in this repo*.

## How the Scrum setup on GitHub helps AI-assisted development

I first saw the board and issues as process overhead for humans. The test changed my mind, because the agent used them directly. Each issue has a checklist of acceptance criteria, a mockup path, and an API endpoint, so it works as a self-contained prompt that I don't have to retype. The issue numbers also gave the agent a vocabulary for scope. Without rules, it hit the missing Prisma driver adapter at build time and quietly installed new packages. With rules, it recognized that work as issue #1, left a `TODO(#1)` behind a clean `lib/db.ts` interface, and stayed inside US-04. The same thing happened with auth (`TODO(#5)`). Milestones and the Sprint Todo column also make it obvious which issues are safe for an agent to pick up next. In Sprint 2, I can hand an agent "#13" instead of a paragraph of context.

## What worked, what didn't, and what I changed

**What worked:** the architecture section (0 of 6 → 6 of 6 target paths; the route handler shrank from 108 to 25 lines), the testing table (unit, component, integration, and an E2E spec on desktop and mobile), the dependency rule (2 unrequested packages → 0), and the version notes for Next 16 and Prisma 7, which saved the agent a failed build.

**What didn't:**
- **TDD commits.** The agent ran a "red" test pass, but it never committed, so the git history still doesn't prove TDD.
- **Auth.** My instruction to "create a typed stub" was too loose. The agent wrote a stub that always returns a demo user, so the 401 behavior the no-rules run had was lost and nothing tested it. A rule meant to unblock the agent ended up lowering the security bar.
- **Scope.** Both runs rewrote the landing page, which US-04 never asked for.
- **Approvals.** The rules made the agent more thorough, but it needed 19 command approvals instead of 6–7.

**What I changed in v2:** the TDD step now says to run `git commit` on the failing tests. The auth stub must return `null` without a session cookie and turn into a 401, and every route test includes an unauthenticated case. I added a "stay in scope" rule and a single chained verification command. I added a `primary-ink` token to replace `text-white`, a `next typegen` note for route types, and a rule never to open `.env`. Each change points back to something specific I saw in a test run, and the Changelog records why.

The biggest lesson came before either test ran. Next.js 16 writes its own `AGENTS.md` whenever an agent runs `next dev`, and Prisma's `init` installs agent "skills" into four tool folders. Without checking, my "no rules" baseline would have had rules in it. If I don't control the context myself, the toolchain does.

## What I would add or change for Sprint 2

1. **Re-run the US-04 test with v2** and add the results to the comparison, to check whether the four fixes actually change behavior.
2. **Split the rules.** Keep `AGENTS.md` short and move the long design and API sections into `docs/design.md` and `docs/api-conventions.md` that it links to, so the always-loaded context stays small.
3. **Enforce rules in CI** instead of only describing them: a lint rule against raw palette colors, a check that route test files include a 401 case, and a PR template with the acceptance-criteria checklist.
4. **Add real-time and chat conventions** once the provider spike (#12) is decided, plus rules for writing OpenAPI entries (#18).
5. **Share ownership** with my partner once one is assigned: we both review rule changes in PRs, so the file reflects how we actually work.

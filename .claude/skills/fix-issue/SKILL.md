---
name: fix-issue
description: Implement one BuddyUp GitHub issue end to end — read the issue, plan, check desktop web / mobile web / app coverage, write and commit failing tests, implement, verify, and report. Use when the user runs /fix-issue <number>.
argument-hint: <issue-number> [scope note]
disable-model-invocation: true
---

# /fix-issue — v1

Implement GitHub issue **#$ARGUMENTS** following `AGENTS.md`. AGENTS.md is the rulebook; this skill
is the order of operations. If they disagree, AGENTS.md wins: point out the conflict and ask.

## Steps

1. **Read the issue.** Run `gh issue view <n>`. If there is no issue, or it has no acceptance
   criteria (AC), stop and ask. If the user added a scope note (e.g. "API only"), only the AC in
   that scope count as done for this run.
2. **Explore (read only, no edits).** Read the matching user story in `docs/PRD.md`, the mockup
   named in the issue (`docs/mockups/*.png`), the AGENTS.md sections that apply, and the existing
   code you will touch.
3. **Check the three surfaces.** For each AC decide which surfaces it affects and show a table:

   | AC | Desktop web (≥1024px) | Mobile web (360–430px) | App (`mobile/`) |
   |---|---|---|---|

   The app column is `N/A (stretch)` unless the issue has the `mobile-app` label or `mobile/`
   exists. For API work, say whether the endpoint can be reused by the app as is.
4. **Plan, then wait.** List: AC → files to create/change → tests to write (unit, component,
   route, E2E). Stop and wait for the user's approval before writing anything.
5. **Branch.** From up-to-date `main`, or the base branch the user names:
   `feature/<n>-<short-desc>` (or `fix/`, `chore/`). If a file
   you need was changed recently by someone else on an unmerged branch, stop and ask.
6. **Red.** Write tests named after the AC (`it("... (US-04 AC3)")`). Run them and confirm they
   fail for the right reason. Commit only the tests:
   `test(<scope>): add failing tests for <feature> (#<n>)`.
7. **Green.** Write the minimum code to pass. Commit: `feat(<scope>): <summary> (#<n>)`.
   Refactor with tests green if needed: `refactor(<scope>): <summary> (#<n>)`.
8. **Verify** in one command: `npm test && npx tsc --noEmit && npm run lint`.
   For P0 stories with UI, add `npm run test:e2e` (runs both `desktop` and `mobile` projects).
9. **Report.**
   - AC → covering test (file and test name), marked done / partial / not done
   - The surface table from step 3, updated
   - Anything stubbed, mocked, or left for another issue
   - Then ask whether to push and open a PR. Only after a yes: push, and open a PR whose body
     starts with `Closes #<n>` (or `Part of #<n>` if the run was scoped) and copies the AC checklist.

## Constraints

- One issue per run. Stay in its scope; suggest unrelated fixes in the report instead.
- Never commit tests and implementation together. Never weaken or delete a test to pass.
- Don't add dependencies, open `.env`, or push / open a PR without asking.
- Until #1 lands, code against `@/lib/db` and mock it in tests (AGENTS.md §2.2).

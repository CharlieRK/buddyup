# HW4 Reflection — Claude Code Workflow & TDD

**Project:** BuddyUp | **Date:** November 24, 2026

## Explore → Plan → Implement → Commit

In our previous project, LinkShelf, we often asked an AI coding tool to implement a feature directly and then checked whether it worked. For this assignment, I used a more structured workflow in Claude Code. I first asked Claude to explore the BuddyUp repository and read GitHub Issue #4, the PRD, and the existing project rules. This helped me understand what was already available before making changes. For example, Zod and bcryptjs were already installed, so there was no need to add dependencies.

I then used Plan mode to review the proposed files, acceptance criteria, and test cases. I adjusted the plan to make Claude stop after each TDD stage instead of implementing everything at once. This took more planning than my previous approach, but it made the changes easier to review and helped me avoid working outside the scope of the task. I kept the work on a separate branch, `feat/auth-hw4`, so it would not interfere with my partner's development.

## Test-Driven Development

I divided the work into two parts: sign-up validation and password hashing. In the first Red stage, 14 of 21 tests failed against a minimal stub. After implementing the validation rules, one test still failed because we had incorrectly assumed that Zod counted password length using UTF-16 code units. Claude checked the library directly and found that our installed version counted Unicode code points. It asked for permission before changing the test. I approved a separate test-correction commit that checked both four and eight emoji. The corrected test was not rerun against the original stub, which is one thing I would improve next time. All 21 validation tests then passed.

For password hashing, nine of 15 tests failed in the Red stage. After implementing bcrypt hashing and verification, all 15 passed. I then asked Claude to move the duplicated 72-byte password limit and UTF-8 length check into a shared module. This made the validation and hashing rules consistent without changing the tests. The final verification passed all 36 tests, TypeScript checks, and ESLint. During verification, a missing generated Next.js route type caused a TypeScript error; running `npx next typegen` resolved it without changing unrelated source code.

## Context Management and Lessons Learned

The most useful strategy was keeping project instructions in files rather than relying on a long conversation. I used `/init` to generate `CLAUDE.md`, refined it to import `AGENTS.md`, and changed the PRD to be read only when needed. I also configured project-level tool permissions so routine commands could be allowed while sensitive operations required approval or were restricted.

I used `/context` to inspect usage, `/compact` to preserve important setup decisions, `claude --continue` to resume the session, and `/clear` to start a fresh development conversation. The recorded context reading was 99.5k tokens out of 1M; I did not collect a matched before-and-after measurement, so I cannot quantify the savings from compaction. During Explore, standalone Glob and Grep were unavailable, so Claude used Bash alternatives and file reads instead.

The main lesson is that AI-generated code still needs human review and actual execution. Small tasks, explicit rules, and separate commits made it easier to understand and verify Claude's work. I would use this workflow again for the remaining BuddyUp features. This assignment completed the validation and hashing portion of Issue #4, not the full sign-up flow; the UI, database persistence, duplicate-email handling, Auth.js session integration, and E2E tests remain future work.

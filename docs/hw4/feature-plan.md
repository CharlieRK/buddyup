# Plan: Issue #4 (US-01), sign-up validation and password hashing

## Context
Issue #4 (US-01, university email sign-up) is split into slices. This slice delivers only the pure, DB-free building blocks: the shared Zod sign-up schema and the bcrypt password helpers. They are reused later by `POST /api/v1/auth/signup`, the sign-up form, and Auth.js login (#5).

Branch: stay on `feat/auth-hw4` (user decision; AGENTS.md says `feature/4-*`, so this is a known deviation).
No new dependencies. `zod` 4.6.7 and `bcryptjs` 3.0.3 are already installed. No DB access.

## Decisions (from user)
- Email: trim, lowercase, then require the exact domain `@northeastern.edu`. Reject subdomains and look-alikes.
- Name: trim, required non-empty.
- Password: at least 8 characters, at most 72 UTF-8 bytes. Never trimmed or normalized. The byte limit is enforced in both the schema and the hashing helper.
- bcrypt cost 10.

## Acceptance criteria covered
| AC | Covered by |
|---|---|
| US-01 AC1 (name, email, password fields) | `signupSchema` shape and per-field errors |
| US-01 AC2 (`@northeastern.edu` only, clear error) | email rules and message |
| US-01 AC3 (min 8, stored bcrypt-hashed) | length rule and `hashPassword` / `verifyPassword` |

Out of scope: AC4 duplicate emails, AC5 Auth.js session and redirect, the sign-up form UI, the route handler, DB persistence, rate limiting, OpenAPI, E2E, the `jose` removal, and adding `next-auth`.

## Files
Create only these four (no existing files are modified):
- `src/lib/validation/auth.ts` exports `signupSchema`, `type SignupInput`, `PASSWORD_MIN_LENGTH` (8), `PASSWORD_MAX_BYTES` (72), `ALLOWED_EMAIL_DOMAIN`.
- `src/lib/validation/auth.test.ts`
- `src/lib/auth/password.ts` exports `hashPassword`, `verifyPassword`, `BCRYPT_COST` (10). It imports `PASSWORD_MAX_BYTES` from `@/lib/validation/auth` so the limit has one source.
- `src/lib/auth/password.test.ts`

Both tests run in the default jsdom environment, which is fine for pure functions. Use `@/` imports, named exports, no `any`, no `!`.

## Error messages (sentence case)
- name: "Enter your name."
- email malformed: "Enter a valid email address."
- email wrong domain: "Use your @northeastern.edu email address."
- password short: "Use at least 8 characters."
- password long: "Use 72 bytes or fewer." (emoji and non-ASCII use more than 1 byte per character)

## Cycle 1: signup validation
**Red** tests in `src/lib/validation/auth.test.ts`, named by AC:
- accepts a valid name, email, and password (US-01 AC1)
- rejects missing name, email, or password with errors on the right field keys via `z.flattenError` (AC1)
- rejects an empty or whitespace-only name, and trims a padded name (AC1)
- accepts `@northeastern.edu`; trims and lowercases `  Alice@Northeastern.EDU ` to `alice@northeastern.edu` (AC2)
- rejects `@gmail.com` with "Use your @northeastern.edu email address." (AC2)
- rejects `a@mail.northeastern.edu`, `a@northeastern.edu.evil.com`, `a@notnortheastern.edu`, `a@northeastern.com` (AC2)
- rejects malformed emails `foo`, `foo@`, `@northeastern.edu` (AC2)
- rejects a 7-character password and accepts exactly 8 (AC3)
- accepts exactly 72 bytes and rejects 73 ASCII bytes (AC3)
- rejects a password under 72 characters but over 72 bytes, such as 25 x "€" (3 bytes each) (AC3)
- preserves password whitespace: `"  pass word  "` stays unchanged and is not trimmed (AC3)

Steps:
1. Write the tests and run `npx vitest run src/lib/validation/auth.test.ts`. They must fail because `@/lib/validation/auth` doesn't exist.
2. `git add src/lib/validation/auth.test.ts`, then commit `test(auth): add failing tests for signup validation (#4)`.

**Green**: write the minimum in `auth.ts`:
- name: `z.string().trim().min(1, ...)`
- email: `z.string().trim().toLowerCase().pipe(z.email(...))`, then a refine with `endsWith("@northeastern.edu")` on the normalized value. A subdomain ends in `.northeastern.edu`, so it fails.
- password: `z.string().min(8, ...)` plus a refine using `new TextEncoder().encode(v).length <= 72`
- Run the test file until it passes, then commit `feat(auth): add signup validation schema (#4)`.

**Refactor** (only if useful): extract the byte-length helper and constants, and tidy messages. Tests stay green. Commit `refactor(auth): tidy signup schema constants (#4)`. Skip if there is nothing to clean up.

## Cycle 2: password hashing
**Red** tests in `src/lib/auth/password.test.ts`:
- `hashPassword` returns a string different from the input (US-01 AC3)
- the hash matches `/^\$2[aby]\$10\$/` (bcrypt, cost 10) (AC3)
- hashing the same password twice gives different hashes (salted) (AC3)
- `verifyPassword` is true for the right password and false for a wrong one (AC3)
- `verifyPassword` is case-sensitive and not whitespace-trimmed (AC3)
- `hashPassword` rejects a password over 72 bytes (a multibyte one under 72 characters) with a `RangeError` (AC3)
- `verifyPassword` returns false, not throwing, for an over-72-byte password (AC3)
- `verifyPassword` returns false for a malformed hash such as `"not-a-hash"` (AC3)

Steps:
1. Run `npx vitest run src/lib/auth/password.test.ts`. It must fail on the missing module.
2. `git add src/lib/auth/password.test.ts`, then commit `test(auth): add failing tests for password hashing (#4)`.

**Green**: write `password.ts`:
- `hashPassword`: check the byte length first and throw `RangeError` over 72, then `bcrypt.hash(password, BCRYPT_COST)`
- `verifyPassword`: return false over 72 bytes, otherwise `bcrypt.compare` wrapped so any error returns false
- Run the file until it passes, then commit `feat(auth): add bcrypt password helpers (#4)`.

**Refactor** (optional): share the byte-length helper between both modules if it is duplicated. The helper would live in `validation/auth.ts` or the helpers stay private. Commit `refactor(auth): share password byte-length check (#4)`.

## Git hygiene
- Stage explicit paths only. The untracked `docs/hw4/setup-session.txt` is not part of these commits.
- Every commit message ends with the trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Never combine tests and implementation in one commit. Never weaken a test to pass it.
- Don't run `tsc` during Red, since tests import modules that don't exist yet.

## Verification
Per cycle: `npx vitest run src/lib/validation/auth.test.ts`, then `npx vitest run src/lib/auth/password.test.ts`.

Final, as one command:
`npm test && npx tsc --noEmit && npm run lint`

E2E is not required, because this slice has no UI or route. Then `git log --oneline` to confirm the Red commits come before their Green commits. The report will list each AC against its test and note what is stubbed or out of scope.

## Security considerations
- Plain passwords are never logged, returned, or included in error messages. Zod issues carry only static messages, not the input value.
- Passwords are not trimmed or normalized, so what the user types is what gets hashed.
- The 72-byte cap is enforced in both the schema and the helpers, so a long password can't be silently truncated by bcrypt.
- The domain is matched exactly after normalization, so look-alike domains and subdomains can't pass.
- bcrypt cost 10 meets the AGENTS.md minimum. The cost is a constant, so raising it later is a one-line change.
- `verifyPassword` fails closed and never throws on bad input.
- The cost-10 hash takes about 60 ms per call in tests, which is acceptable.

## Revisions after review (these override the sections above)
1. **One stage at a time.** Run a single TDD stage, then stop and wait for approval. The order is: C1 Red, C1 Green, C1 Refactor (only if natural), C2 Red, C2 Green, C2 Refactor.
2. **Meaningful refactor, not manufactured.** The planned one is in Cycle 2. Green for `password.ts` will need the same UTF-8 byte-length check that the schema already has. Green duplicates it minimally, then the Refactor commit extracts one exported `utf8ByteLength()` helper used by both modules, with tests unchanged and green. Commit `refactor(auth): share utf8 byte-length check between schema and hashing (#4)`. If Cycle 1 Green has nothing worth cleaning, skip its refactor.
3. **Red shows behavioral failures, not a missing module.** Red commits include a minimal non-functional stub so the tests import and fail on assertions:
   - `src/lib/validation/auth.ts` stub exports the constants and `signupSchema = z.object({ name: z.string(), email: z.string(), password: z.string() })` and `type SignupInput`. It has no trimming, domain, length, or byte rules, so it accepts nearly everything.
   - The `password.ts` stub, in Cycle 2, would have `hashPassword` return the input unchanged and `verifyPassword` return `false`.
   - No real behavior is implemented before Red is committed. I'll run the tests, confirm they fail on assertions, and check that the failures are for the right reasons (some "accepts valid input" tests may pass against the stub, which is expected).
   - Red commit contains the test file and the stub, with explicit `git add` paths. Message: `test(auth): add failing tests for signup validation (#4)`, with the Co-Authored-By trailer.
4. **UTF-16 length kept and documented.** Zod `.min(8)` counts UTF-16 code units, so an emoji counts as 2. This is documented in a comment in `validation/auth.ts` and in the Green commit body. A test pins the current behavior so a future change is deliberate. The 72-byte cap bounds the other end.
5. **Issue #4 stays open.** This slice doesn't satisfy AC4 or AC5 or the UI and E2E definition of done. Commit messages use `(#4)` only, never `Closes` or `Fixes`. A future PR for this slice should say "Part of #4".

## Immediate next action after approval
Cycle 1 Red only: write `auth.test.ts` and the stub, run `npx vitest run src/lib/validation/auth.test.ts`, show the failures, commit the Red stage, then **stop** without starting Green.

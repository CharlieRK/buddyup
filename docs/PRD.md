# BuddyUp — Product Requirements Document

> Find a buddy for any campus activity.

| | |
|---|---|
| **Project** | CS6983 AI Coding — Project 2 (Full-Stack Application) |
| **Author** | Haoran Lyu |
| **Status** | Draft v1 — 2026-10-28 |
| **Timeline** | Sprint 1: Oct 31 – Nov 5, 2026 · Sprint 2: Nov 6 – Nov 12, 2026 |
| **Platform** | Responsive web app (v1); native iOS/Android clients planned later |

---

## 1. Problem Statement

University students often want to do things — play pickup basketball, study for a midterm, try a new restaurant, go to a museum, hike on the weekend — but can't find someone to go with at the right time. Existing options don't fit well:

- **Group chats** (WeChat, WhatsApp, Discord) are noisy; requests get buried within minutes.
- **Club platforms** are built for recurring, formal events, not "anyone want to play tennis at 4pm?"
- **General social apps** aren't limited to the campus, which raises safety and trust concerns.

Students need a **trusted, campus-only place** to post a small activity, find people to join, and coordinate — quickly.

## 2. Goals & Non-Goals

### Goals
1. Let a student post an activity and get join requests in minutes.
2. Make it easy to browse and filter activities happening soon.
3. Keep the community trusted: only verified university students, with reporting and moderation.
4. Show live information (spots left, request status, chat) without manual refresh.
5. Expose a documented public REST API so future iOS/Android clients can reuse the same backend.

### Non-Goals (v1)
- Native iOS/Android apps (planned post-P2; the API is designed for them).
- Payments, ticketing, or cost splitting.
- Recurring/scheduled series of activities.
- Friend lists, followers, or a social feed.
- Map view and location-based search.
- Push notifications (in-app notifications only).

## 3. Users & Roles

All users are students with a university email address. **Host** and **Participant** are roles *per activity* (the same student can host one activity and join another). **Admin** is an account-level role.

| Role | Who | What they can do |
|---|---|---|
| **Participant** | Any signed-in student | Browse and filter activities, request to join, leave, chat in activities they were approved for, report content |
| **Host** | The student who created an activity | Create, edit, and cancel their activity; approve or decline join requests; remove participants; chat |
| **Admin** | Platform moderator | Review reports, remove activities, suspend or reinstate users, view basic platform stats |

### Personas
- **Mia, 2nd-year grad student (Host):** New to the city, wants hiking and food buddies on weekends.
- **Kevin, undergrad (Participant):** Plays basketball; checks the app between classes to find a game.
- **Dana, student moderator (Admin):** Keeps the platform safe and handles reports.

## 4. User Stories & Acceptance Criteria

Priority: **P0** = must have, **P1** = should have, **P2** = nice to have. Estimates are story points (1, 2, 3, 5, 8).

### Sprint 1 — Accounts & core activity flow

**US-01 · Sign up with university email** (P0, 3 pts)
*As a student, I want to create an account with my university email so that only real students can use BuddyUp.*
- [ ] Sign-up form accepts name, email, and password
- [ ] Only emails ending in the allowed domain (e.g., `@northeastern.edu`) are accepted; others show a clear error
- [ ] Password must be at least 8 characters; it is stored hashed (bcrypt), never in plain text
- [ ] Duplicate emails are rejected with a clear error
- [ ] On success, the user is signed in and taken to profile setup

**US-02 · Log in and log out** (P0, 2 pts)
*As a student, I want to log in and out securely so that my account is protected.*
- [ ] Valid credentials sign the user in (JWT session in an httpOnly cookie)
- [ ] Invalid credentials show a generic error ("Email or password is incorrect")
- [ ] Logging out ends the session and redirects to the landing page
- [ ] Protected pages and API routes redirect/return 401 when not signed in

**US-03 · Set up my profile** (P1, 2 pts)
*As a student, I want a short profile so others know who they're meeting.*
- [ ] Profile has display name, major, graduation year, and up to 5 interest tags
- [ ] Profile can be edited later from the Profile tab
- [ ] Other users can see a student's profile from an activity page

**US-04 · Create an activity** (P0, 3 pts)
*As a host, I want to post an activity so that others can join me.*
- [ ] Form fields: title, category, description, start time, location (text), capacity (2–20)
- [ ] Categories: Sports, Study, Food, Arts & Culture, Outdoors, Gaming, Other
- [ ] Start time must be in the future; inline validation errors are shown
- [ ] On success, the host is redirected to the new activity's detail page
- [ ] The host counts as the first member (spots left = capacity − 1)

**US-05 · Browse and filter activities** (P0, 3 pts)
*As a participant, I want to see upcoming activities and filter them so that I can find something to join.*
- [ ] Feed shows upcoming, non-cancelled activities sorted by start time
- [ ] Each card shows title, category, time, location, host name, and spots left
- [ ] Can filter by category and by date (Today, This week, All)
- [ ] Empty state is shown when no activities match the filters
- [ ] Past activities do not appear in the feed

**US-06 · View activity details** (P0, 2 pts)
*As a participant, I want to see full details before I join.*
- [ ] Detail page shows all activity fields, the host's profile summary, and the approved member list
- [ ] Shows the correct action button for the viewer: "Request to join", "Requested", "Joined", "Full", or "Manage" (host)

**US-07 · Request to join an activity** (P0, 3 pts)
*As a participant, I want to request to join so that the host can let me in.*
- [ ] Participant can send a request with an optional short message (≤ 200 chars)
- [ ] Cannot request to join their own activity, a full activity, or a cancelled activity
- [ ] Cannot send a duplicate request for the same activity
- [ ] Participant can withdraw a pending request
- [ ] "My Activities" lists the participant's pending and approved activities

**US-08 · Approve or decline join requests** (P0, 3 pts)
*As a host, I want to review requests so that I control who joins.*
- [ ] Host sees pending requests with each requester's profile summary and message
- [ ] Host can approve or decline each request
- [ ] Approving is blocked when the activity is full
- [ ] When the last spot is filled, the activity status becomes FULL automatically

### Sprint 2 — Real-time, moderation & polish

**US-09 · Live spots and request status** (P0, 5 pts)
*As a participant, I want spots and my request status to update live so that I don't need to refresh.*
- [ ] Spots left updates on the feed and detail page within ~2 seconds of a change
- [ ] A requester sees their status change (approved/declined) without refreshing
- [ ] A host sees new requests appear without refreshing
- [ ] In-app notification badge shows unread updates

**US-10 · Activity group chat** (P1, 5 pts)
*As an approved member, I want to chat with the group so that we can coordinate details.*
- [ ] Only the host and approved members can read or send messages
- [ ] New messages appear for all members in real time
- [ ] Messages show sender name and timestamp; message length ≤ 1000 chars
- [ ] Chat history loads when opening the activity

**US-11 · Edit, cancel, or leave an activity** (P1, 3 pts)
*As a host, I want to edit or cancel my activity; as a participant, I want to leave one.*
- [ ] Host can edit fields except capacity below the current member count
- [ ] Host can cancel; status becomes CANCELLED and members are notified in-app
- [ ] Participant can leave an approved activity, freeing a spot
- [ ] Host can remove a participant

**US-12 · Report an activity or user** (P1, 2 pts)
*As a student, I want to report inappropriate content so that the community stays safe.*
- [ ] Report button on activity pages and profiles
- [ ] Reporter picks a reason (Spam, Harassment, Unsafe, Other) and can add details
- [ ] A user cannot report the same target twice
- [ ] Confirmation message is shown after submitting

**US-13 · Admin moderation dashboard** (P0, 5 pts)
*As an admin, I want to review reports and take action so that bad actors are removed.*
- [ ] Only admins can access `/admin` (others get 403)
- [ ] Dashboard lists open reports with target, reason, reporter, and date
- [ ] Admin can dismiss a report, remove the reported activity, or suspend the user
- [ ] Suspended users cannot log in and see a clear message
- [ ] Dashboard shows basic stats: total users, activities this week, open reports

**US-14 · Public API documentation** (P0, 2 pts)
*As a developer (including future mobile clients), I want documented API endpoints so that I can build on BuddyUp.*
- [ ] OpenAPI 3 spec covers all `/api/v1` endpoints
- [ ] Interactive docs (Swagger UI) available at `/api-docs`
- [ ] Each endpoint documents auth requirements, request body, and response codes

## 5. Functional Requirements Summary

| Area | Requirement |
|---|---|
| Auth | Email + password, university-domain restriction, JWT session (httpOnly cookie), role-based access (USER / ADMIN) |
| Activities | CRUD for hosts; feed with category/date filters; statuses OPEN → FULL / CANCELLED / COMPLETED |
| Membership | Join requests with statuses PENDING → APPROVED / DECLINED / WITHDRAWN; capacity enforced on the server |
| Real-time | Live spots, request status, new-request alerts, and group chat via a managed WebSocket service |
| Moderation | Reports, admin dashboard, user suspension |
| API | Versioned REST API under `/api/v1`, documented with OpenAPI |

## 6. Key Screens (see `docs/mockups/`)

Desktop web layout (content max width ~1180px) that stays responsive down to phone width. A sticky top navigation bar holds the logo, **Explore** and **My activities** links, a **Create activity** button, and the profile avatar. Every activity shows a row of "seat" dots (filled = joined, dashed = open spot) as the signature visual.

1. **Landing / Sign in / Sign up** — hero with value proposition and a seat-grid illustration, three-step "how it works"; centered auth cards with inline validation.
2. **Explore** — left sidebar with category and date filters; responsive grid of activity cards with seat dots and a "spots left" badge.
3. **Activity detail** — two columns: title, time, place, description, and host card on the left (with About / Group chat tabs for members); a sticky "Who's going" panel on the right with large seat avatars and the context-aware action button.
4. **Create activity** — form on the left (category chips, date/time, capacity stepper) with a live preview card on the right.
5. **My activities** — Hosting / Joined / Requested tabs over a card grid.
6. **Manage requests (host)** — requester rows with profile summary, message, and Approve / Decline.
7. **Profile** — profile card on the left; stats and hosted activities on the right.
8. **Admin dashboard** — stats row and a reports table with Dismiss / Remove / Suspend actions.

## 7. Primary User Flows

1. **Host flow:** Sign up → set profile → Create → fill form → activity detail → receive request (live) → approve → chat with group.
2. **Participant flow:** Log in → Explore → filter by category → open activity → Request to join → status changes to Joined (live) → chat.
3. **Admin flow:** Log in as admin → Admin dashboard → open report → review target → suspend user or remove activity.

## 8. Data Model (initial)

- **User** — id, email (unique), passwordHash, name, major, gradYear, interests[], role (USER | ADMIN), status (ACTIVE | SUSPENDED), createdAt
- **Activity** — id, hostId → User, title, description, category, startTime, location, capacity, status (OPEN | FULL | CANCELLED | COMPLETED), createdAt, updatedAt
- **JoinRequest** — id, activityId → Activity, userId → User, message, status (PENDING | APPROVED | DECLINED | WITHDRAWN), createdAt; unique (activityId, userId)
- **Message** — id, activityId → Activity, senderId → User, body, createdAt
- **Report** — id, reporterId → User, targetType (ACTIVITY | USER), targetId, reason, details, status (OPEN | DISMISSED | ACTIONED), resolvedById → User, createdAt

## 9. API Overview (`/api/v1`)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | — | Create account |
| POST | `/auth/login` | — | Sign in |
| POST | `/auth/logout` | User | Sign out |
| GET / PATCH | `/users/me` | User | Read / update own profile |
| GET | `/users/:id` | User | Public profile |
| GET | `/activities?category=&date=` | User | Feed |
| POST | `/activities` | User | Create activity |
| GET / PATCH / DELETE | `/activities/:id` | User / Host | Read / edit / cancel |
| POST | `/activities/:id/requests` | User | Request to join |
| GET | `/activities/:id/requests` | Host | List requests |
| PATCH | `/requests/:id` | Host / Requester | Approve, decline, or withdraw |
| DELETE | `/activities/:id/members/:userId` | Host / Self | Remove or leave |
| GET / POST | `/activities/:id/messages` | Member | Chat history / send |
| POST | `/reports` | User | Submit report |
| GET / PATCH | `/admin/reports`, `/admin/reports/:id` | Admin | Review / resolve |
| PATCH | `/admin/users/:id` | Admin | Suspend / reinstate |

## 10. Technical Approach

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript + TailwindCSS |
| Backend | Next.js Route Handlers under `/api/v1` |
| Database | PostgreSQL (hosted, e.g., Neon) with Prisma ORM |
| Auth | JWT sessions in httpOnly cookies, bcrypt password hashing |
| Real-time | Managed WebSocket service (e.g., Pusher Channels) — final choice in a Sprint 1 spike |
| Validation | Zod schemas shared by client and server |
| Testing | Vitest (unit + integration), Playwright (E2E, desktop and mobile viewports) |
| CI/CD | GitHub Actions (lint → test → security scan → build), Vercel preview deploys on PRs, auto-deploy on merge to `main` |
| API docs | OpenAPI 3 + Swagger UI |

Because all business logic sits behind the versioned REST API, future native iOS/Android apps (e.g., React Native) can reuse the backend unchanged.

## 11. Non-Functional Requirements

- **Security:** hashed passwords; server-side authorization on every route; input validation with Zod; rate limiting on auth endpoints; no secrets in the repo; dependency and code scanning in CI.
- **Accessibility:** WCAG 2.1 AA target — semantic HTML, labels on all inputs, keyboard navigation, visible focus states, color contrast ≥ 4.5:1, touch targets ≥ 44px.
- **Performance:** feed loads in under 2 seconds on a typical connection; real-time updates arrive within ~2 seconds.
- **Responsiveness:** usable from 360px phone width to desktop.

## 12. Success Metrics (for demo / evaluation)

- A new user can sign up and post an activity in under 2 minutes.
- A join request → approval round trip shows up live for both users without refresh.
- All P0 stories pass their acceptance criteria and E2E tests.

## 13. Risks & Open Questions

| Item | Notes |
|---|---|
| Partner not yet assigned | Scope is planned for a pair; if working solo, P1 stories (US-10, US-11, US-12) may move to stretch goals |
| Real-time on Vercel | Serverless functions can't hold WebSockets; use a managed service (decide in Sprint 1) |
| Email verification | v1 restricts the email domain only; sending verification emails is a stretch goal |
| Seed data for demo | Need a seed script with realistic users and activities |

## 14. Future Work

- Native iOS and Android apps (React Native / Expo) using the same `/api/v1` API
- Push notifications
- Map view and nearby activities
- Recurring activities and ratings after activities

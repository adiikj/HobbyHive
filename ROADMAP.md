# HobbyHive — Feature & Deployment Roadmap

Companion to `PLAN.md` (which covers monorepo restructuring, TS migration, and bug/security fixes). That plan gets the *existing* code clean and typed. This document covers what to build **on top of it**: the features still missing to make HobbyHive a real product, and the infrastructure needed to run it in production.

## 0. Where things actually stand

Backend has exactly one resource: `/api/v1/users/*` (register → OTP → verify → login/logout). No posts, friends, comments, likes, messages, or notifications exist as API endpoints — `Dashboard.jsx` renders **hardcoded arrays** (`stories`, `posts`, `trendingTopics`) with no fetch calls at all. So the biggest gap isn't deployment tooling, it's that the core social product (the reason someone would open the app twice) doesn't exist server-side yet.

Recommended order: **finish `PLAN.md` first** (monorepo + TS + the auth security fix), then build features on a typed foundation, then deploy. Building features on the current untyped JS is possible but you'll re-do a lot of the request/response typing anyway.

**Target database: PostgreSQL + Prisma, replacing MongoDB/Mongoose.** The social graph here (users → posts → comments/likes → follows) is inherently relational — joins across those tables are the common case, not the exception — so a relational schema with foreign keys and transactions is a better fit than documents once §1 items 3–4 (comments, follows) land. This is a deliberate migration, not a correction: today's code stays on Mongo until the rewrite happens; new schema work should target Postgres from the start. See §2 and §5 for what changes.

---

## 1. Core product features (build in this order)

Each item is "backend model + endpoints" + "frontend wired to real data, mock arrays deleted."

| # | Feature | Why this order |
|---|---|---|
| 1 | **User profiles** — bio, avatar upload, hobby tags, `/api/v1/users/:username`, edit-profile page | Everything else (posts, friends) needs a real user to attach to; also replaces the hardcoded "Welcome Aditya!" |
| 2 | **Posts** — CRUD, image upload, `Post` model (author ref, hobby tag, likes, comment count), feed endpoint (paginated) | This is the actual product loop; dashboard currently fakes this entirely |
| 3 | **Likes & comments** — join tables (`likes`, `comments`) with FKs to `users`/`posts`, optimistic UI updates | Small schema addition once Post exists |
| 4 | **Friends/follow system** — `follows` table (`follower_id`, `following_id`), request/accept/reject, friends list endpoint | Needed before a real feed (feed = posts from people you follow) and before real-time chat makes sense |
| 5 | **Feed ranking** — start with reverse-chronological from followed users; don't build a ranking algorithm yet | Premature to optimize before there's any usage data |
| 6 | **Notifications** — real notification rows (like, comment, follow, friend request) instead of the hardcoded `🔔` list; poll or push via WebSocket (see §2) | Depends on posts + friends existing first |
| 7 | **Search & discovery** — Postgres full-text/fuzzy search (`tsvector` + `pg_trgm`) over users/posts/hobby tags; "trending topics" computed from real tag counts instead of a static array | Needs real post volume to be meaningful; avoids standing up Elasticsearch just for this |
| 8 | **Direct messages / chat** — real-time via WebSocket, `conversations`/`messages` tables | Highest complexity item — do it after the rest is stable |
| 9 | **Hobby communities/groups** — dedicated spaces per hobby (like subreddits), join/leave, group feed | Bigger differentiator feature; worth doing once core loop works |
| 10 | **Events/meetups** (optional, later) — hobby-based local/virtual events, RSVP | Nice-to-have, not needed for an MVP |
| 11 | **Hobby-specific live rooms** — shared real-time spaces over the existing WebSocket layer (e.g. a collaborative drawing canvas for artists, a live jam-session queue for musicians), scoped per hobby community | More distinctive than generic 1:1 chat; build after item 8 (chat infra) and item 9 (communities) both exist |

Stop after #6 or #7 for a genuine MVP you can show people. #8–11 are what turns it into a "full," differentiated social platform rather than a generic feed clone.

---

## 2. Backend architecture additions needed to support the above

- **File/image uploads** — Cloudinary or S3 + presigned URLs for avatars and post images. `multer` for multipart handling if uploading through your own server first.
- **Real-time layer** — Socket.io (simplest with Express) for chat, live notifications, and the hobby live-rooms feature (§1 item 11 — namespace/room per hobby). Needs sticky sessions or a Redis adapter (`socket.io-redis`) once you run more than one backend instance.
- **Relational schema (Postgres + Prisma)** — `users`, `posts`, `comments`, `likes`, `follows`, `conversations`/`messages` as proper tables with FK constraints; Prisma migrations replace ad-hoc Mongoose schema edits.
- **Search (Postgres extensions)** — `pg_trgm` + `tsvector` GIN indexes for fuzzy/full-text search (§1 item 7) — no separate search service needed at this scale.
- **Pagination** — cursor-based (not offset) for feed/comments once post volume grows; index `created_at` + author.
- **Caching** — Redis for session/rate-limit counters now, feed/profile caching later if read load grows.
- **Background jobs** — a queue (BullMQ + Redis) for OTP emails and any future digest/notification emails, so a slow Gmail API call never blocks a request (this also directly fixes `PLAN.md` item 4.11 about the transporter blocking boot).
- **Input validation** — Zod schemas per route (already flagged in `PLAN.md`; extend the same pattern to every new resource as you add it, don't defer it again).
- **Rate limiting** — `express-rate-limit` on auth routes now, extend to post-creation/like/comment endpoints later to prevent spam.

---

## 3. Testing (currently: zero tests in either repo)

1. **Backend**: Vitest or Jest + Supertest for route/controller tests against a disposable Postgres instance (Docker + `testcontainers`, or Prisma's own test-DB reset pattern) so tests never touch real data.
2. **Frontend**: Vitest + React Testing Library for components; start with auth forms and the feed once it's real.
3. **E2E**: Playwright for the critical path — register → verify OTP → login → post → see it in feed. One good E2E suite catches more regressions than a large unit suite at this project's size.
4. Add this **after** TypeScript migration (typed code is dramatically cheaper to write tests against) but **before** the feature list in §1 grows large — retrofitting tests onto an untested app gets harder every sprint you delay it.

---

## 4. CI/CD

GitHub Actions, single workflow to start:
- On PR: install (pnpm, once monorepo lands) → lint → typecheck → test → build both apps.
- On merge to `main`: same checks, then trigger deploy (see §5).
- Add Dependabot (or Renovate) for dependency updates — several deps here (`googleapis`, `prisma`, `react-router`) move fast.
- Run `prisma migrate deploy` as a CI step against staging before it ever runs against production — schema drift is the easiest way to break a relational app mid-deploy.
- Pre-commit: `husky` + `lint-staged` running eslint/prettier on staged files only, so bad formatting never reaches CI.

---

## 5. Deployment architecture

Current state: frontend has a `vercel.json`; backend has none — no evidence it's deployed anywhere yet. Recommended target setup:

| Layer | Recommendation | Why |
|---|---|---|
| Frontend | **Vercel** (already set up for it) | Static Vite build, zero-config, free tier, preview deployments per PR |
| Backend API | **Render** or **Railway** (not Vercel serverless) | Once you add Socket.io (§2), you need long-lived connections — serverless functions don't hold WebSocket connections well. Render/Railway give you a persistent Node process for the same low cost as a hobby Vercel plan |
| Database | **Neon** or **Supabase** (managed Postgres, free tier) | Matches the Prisma/Postgres target in §2 |
| File storage | **Cloudinary** (free tier, handles image resizing) over raw S3 to start — simpler integration | Avoids building your own image-processing pipeline |
| Redis | **Upstash** (serverless Redis, generous free tier) | For rate-limit counters, Socket.io adapter, job queue |
| Secrets | Platform env vars (Render/Vercel dashboards) now; consider Doppler if the team grows | `PLAN.md` already flags getting secrets out of plaintext `.env` — this is where they land instead |
| Domain/DNS | Whatever registrar + point A/CNAME records at Vercel + Render | — |

**Docker**: not required for Render/Vercel (they build from source), but worth adding a `Dockerfile` per app anyway — makes local dev environment-parity easier and keeps you portable if you ever move off Render.

**Environments**: at minimum `production` + `preview` (Vercel gives PR previews for free; point preview frontend builds at a separate "staging" backend + a separate Atlas database so testing never touches real user data).

---

## 6. Observability (currently: `console.log` only, including logging plaintext passwords/OTPs — flagged as a security bug in `PLAN.md` §4.9, fix that first)

- **Error tracking**: Sentry (free tier) on both frontend and backend — catches production errors you'd otherwise never see.
- **Structured logging**: replace `console.log` with `pino` (fast, structured JSON logs) on the backend — plays well with Render/Railway's log viewers.
- **Uptime**: a free monitor (UptimeRobot, Better Stack) pinging a `/health` endpoint — add that endpoint if it doesn't exist yet.
- **Product analytics** (once real users exist): PostHog (generous free tier, self-hostable later) for signup funnel/feature usage.

---

## 7. Security hardening beyond `PLAN.md`

`PLAN.md` §4 already covers the httpOnly cookie fix, rate limiting, Zod validation, and CORS. Add on top, once deploying for real:
- `helmet` middleware for standard security headers.
- CSRF protection if you ever add cookie-based state-changing forms outside the JSON API.
- Content-Security-Policy header once you know your CDN/image domains.
- File upload validation (mime-type + size limits) before wiring Cloudinary — don't trust the client's `Content-Type`.

---

## 8. Suggested milestone sequence

1. **Finish `PLAN.md`** — monorepo, TS, security/bug fixes. *(prerequisite, not optional)*
2. **MVP feature slice** — §1 items 1–4 (profiles, posts, likes/comments, friends) + basic tests (§3) + CI (§4).
3. **First deploy** — §5 stack, staging + production environments, Sentry wired up (§6).
4. **Real-time layer** — notifications + chat (§1 items 6, 8) once the deploy target supports persistent connections.
5. **Discovery & communities** — full-text search, trending, hobby groups (§1 items 7, 9) once there's enough content for these to matter.
6. **Differentiator** — hobby-specific live rooms (§1 item 11), once chat infra (step 4) and communities (step 5) both exist to build them on top of.
7. **Polish/scale** — caching, background jobs, event system, revisit hosting if traffic outgrows free tiers.

Don't skip ahead to step 4–7 before step 2–3 land — a chat feature or a live room on top of an app with no real posts or friends yet has nothing to be "real-time" about.

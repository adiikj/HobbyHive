# HobbyHive Improvement & Monorepo Migration Plan

Status: **proposal — no code has been touched yet.** This document is the plan only; implementation starts after you approve it.

## 1. What HobbyHive is today

A MERN-stack social app for hobby communities:

- **`HobbyHive-backend/`** — Express 4 + Mongoose 8 REST API. Auth flow: register → email OTP (via Gmail OAuth2/nodemailer) → verify → login (JWT access + refresh tokens in cookies) → logout. One resource so far (`/api/v1/users/*`).
- **`HobbyHive-frontend/`** — Vite + React 18 + Redux Toolkit + Tailwind + React Router 7. Landing page, sign in/up with OTP, a dashboard that currently renders **hard-coded mock data** (no real posts/friends/feed wired to the backend yet).

Both are separate git repos with separate GitHub remotes (`Adiijha/HobbyHive-backend`, `Adiijha/HobbyHive-frontend`), both clean and pushed. No tests, no CI, no shared tooling, JavaScript throughout (no types).

## 2. Decisions already made (from your answers)

| Question | Decision |
|---|---|
| Package manager / build orchestration | **pnpm workspaces + Turborepo** |
| Git history | **Preserved** — both repos' commit history merged into the new monorepo via `git-filter-repo` (fallback: `git subtree`) |
| Scope beyond restructuring | **Fix the bugs & security issues found during review** |
| TypeScript | **Migrate both apps now**, incrementally |
| Explicitly *not* in this pass | CI/CD pipelines, an automated test suite, pre-commit hook tooling (husky/lint-staged) — noted as future work in §7, not built now |

## 3. Target repo layout

```
HobbyHive/                       (single new git repo, root)
├── apps/
│   ├── backend/                 (was HobbyHive-backend, history preserved)
│   │   ├── src/
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── frontend/                (was HobbyHive-frontend, history preserved)
│       ├── src/
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   └── config/                  (new — shared, only what TS migration needs)
│       ├── eslint/               base eslint config both apps extend
│       └── typescript/           base tsconfig.json both apps extend
├── pnpm-workspace.yaml
├── turbo.json
├── package.json                 (root — workspace scripts: dev/build/lint via turbo)
├── .gitignore
└── .env.example                 (per-app, documents required vars without values)
```

`packages/config` is kept intentionally small — just what's needed so both apps share one ESLint ruleset and one base `tsconfig.json` instead of duplicating them. It is not a general "shared component library"; there's no product reason for one yet.

## 4. Execution phases

### Phase 1 — Scaffold the monorepo, preserve history
1. `git init` a new repo at the `HobbyHive/` root.
2. Use `git-filter-repo` to rewrite each existing repo's history so every path is prefixed (`src/…` → `apps/backend/src/…`, and same for frontend), producing two repos whose histories are already monorepo-shaped.
   - Fallback if `git-filter-repo` isn't available locally: `git subtree add --prefix=apps/backend <backend-repo> main` / same for frontend. Preserves history but adds merge commits instead of a linear log.
3. Merge both rewritten histories into the new repo with `git merge --allow-unrelated-histories`.
4. Add `pnpm-workspace.yaml`, root `package.json` (workspaces + turbo scripts), `turbo.json` (pipeline: `dev`, `build`, `lint`), consolidated root `.gitignore`.
5. Verify: `pnpm install` at root resolves both apps' dependencies; `pnpm --filter backend dev` and `pnpm --filter frontend dev` both still boot exactly as they do today.

**Checkpoint:** app behavior is unchanged, only the repo shape changed. Nothing below starts until this boots clean.

### Phase 2 — Shared baseline config
- `packages/config/typescript`: one base `tsconfig.json` (strict mode on) that `apps/backend` and `apps/frontend` extend with their own `moduleResolution`/`jsx` overrides.
- `packages/config/eslint`: one base config; each app extends it and adds its own env-specific rules (Node vs browser/React).
- This is scoped narrowly to unblock the TypeScript migration — not a general tooling overhaul.

### Phase 3 — TypeScript migration (incremental, backend first)
**Backend**, leaf-to-core order to minimize churn per commit:
1. `utils/` (`ApiError`, `ApiResponse`, `asyncHandler`) → trivial, no external types needed.
2. `models/` — type Mongoose schemas with interfaces (`IUser`, `IPendingUser`), type the instance methods (`generateAccessToken`, etc.).
3. `middlewares/` — type `Request`/`Response`/`NextFunction` via `@types/express`, extend `Express.Request` with `user`.
4. `controllers/` and `routes/`.
5. `app.js` → `app.ts`, `index.js` → `index.ts`. Add `tsx` for dev (`tsx watch src/index.ts`) and `tsc` for prod build.

**Frontend**, same leaf-to-core idea:
1. `redux/` (`store.ts`, `authSlice.ts`) — type `RootState`/`AppDispatch`.
2. `api/api.js` → `api.ts` — type request/response shapes matching the (now-typed) backend contracts.
3. Leaf components (`routes/AuthRoute`, `routes/ProtectedRoute`, `layout/*`) → `.tsx`.
4. Remaining components (auth forms, dashboard, landing page) → `.tsx`, typing props explicitly.
5. Vite already supports TS natively — no build config changes needed beyond `tsconfig.json`.

Each file conversion is its own small commit so any regression is easy to bisect.

### Phase 4 — Bug & security fixes
These were found while reading the code in this session. Ordered by severity.

1. **Critical — the `accessToken` cookie's `httpOnly` protection is currently defeated.** The server sets it `httpOnly: true` on login (`user.controller.js:89-95`), but the frontend *also* writes a same-named, non-`httpOnly` cookie right after login (`SignIn.jsx:43`, `Cookies.set("accessToken", ...)`), and the browser doesn't dedupe cookies by the `httpOnly` flag — same name/domain/path means the client-set cookie coexists with or overwrites the server one. Net effect: the token is JS-readable regardless of the server's `httpOnly` flag, which is the opposite of the intended protection. **Fix:** stop sending the token in the JSON response body and stop client-side `Cookies.set`/`localStorage.setItem` entirely; rely solely on the server-set `httpOnly` cookie, and add a lightweight `/api/v1/users/me` bootstrap call on app load to hydrate Redux auth state (since JS can no longer read the cookie directly to check "am I logged in").
2. **Bug** — `auth.middleware.js:11`: `new ApiError(401, "Unauthorized")` is constructed but never `throw`n, so a missing token falls through to `jwt.verify(null, …)` instead of failing cleanly.
3. **Bug** — cookie options mismatch: login sets `sameSite: "none", secure: false` (`user.controller.js:90-95`); logout clears with `sameSite: "strict", secure: true` (`user.controller.js:120-124`). Mismatched attributes mean `clearCookie` can silently fail to remove the login cookie in some browsers. Fix: define cookie options once, share between login/logout.
4. **Bug** — `pendingUser.models.js:36`: schema option is `{ timestamp: true }` (typo) instead of `{ timestamps: true }` — timestamps are silently never added.
5. **Bug** — `index.js:12`: `app.on("error", () => { console.log('Error:', error) ...})` references `error` that isn't in scope (should be `(error) => {...}`) — would throw `ReferenceError` if this handler ever actually fired.
6. **Security** — no rate limiting on `/login`, `/register`, `/verify-otp`. The OTP is a 6-digit code valid for 10 minutes with no attempt cap, so it's brute-forceable. Add `express-rate-limit` on these three routes.
7. **Security** — no request validation beyond truthy checks; add schema validation (Zod) for email format, username charset, password strength on register/login bodies.
8. **Security/config** — `vercel.json` sets `Access-Control-Allow-Origin: *` while the backend does credentialed CORS (`cors: { credentials: true }`) — these two policies conflict; the wildcard header should be removed from `vercel.json` and CORS left entirely to the backend.
9. **Hygiene** — remove the `console.log` calls that print plaintext passwords and OTPs (`user.controller.js:56,74-76,228-231`, `user.models.js:47`) — real credentials/OTPs currently land in server logs.
10. **Hygiene** — `ApiResponse.js:6` has a typo (`this.sucess`) — should be `success`; check nothing already depends on the misspelled field before renaming.
11. **Architecture** — the OAuth2/nodemailer transporter is initialized at module load time with a top-level `await` and no try/catch (`user.controller.js:13-19`); a transient Google API failure currently prevents the whole backend from booting. Move this into a lazily-initialized function so email delivery failures don't take down the server.
12. **Secrets hygiene** — confirmed `HobbyHive-backend/.env` was never committed to git (checked full history on both repos), so no rotation is required. Still, move the real Mongo Atlas/Google OAuth credentials out of a plaintext local `.env` into a proper secrets manager (or at minimum a `.env.example` with placeholder values checked in) before this ever goes further than local dev.

### Phase 5 — Cleanup
- Repoint the local remote to a new GitHub repo for the monorepo (you'll need to create it — I won't create GitHub repos on your behalf).
- Archive (don't delete) `Adiijha/HobbyHive-backend` and `Adiijha/HobbyHive-frontend` on GitHub once the monorepo is confirmed working, so history stays reachable.

## 5. What each phase leaves working

After every phase, both apps should still run via `pnpm --filter backend dev` / `pnpm --filter frontend dev` exactly as they do today — this is a restructuring + fix effort, not a rewrite. No feature behavior changes except the auth token-storage fix in Phase 4.1, which is a required security fix, not a feature change, but will require a `/me` endpoint that doesn't exist yet.

## 6. Order of operations

Phase 1 (monorepo shell) → Phase 2 (shared config) → Phase 3 (TypeScript) → Phase 4 (bug/security fixes, done as part of touching each file during the TS pass where practical) → Phase 5 (cleanup/remote repoint). Phases 3 and 4 will in practice interleave file-by-file, since converting a file to TS is a natural place to fix a bug in that same file — each commit should still do one or the other, not both silently.

## 7. Explicitly deferred (not part of this plan, revisit later)

- **CI/CD** (GitHub Actions to lint/build on PRs) — not requested this round.
- **Automated tests** (Vitest/Jest/Supertest) — not requested this round; recommended as the very next initiative once TS migration lands, since typed code is much cheaper to test.
- **Pre-commit hooks** (husky + lint-staged) — not requested this round.
- **Dashboard feature completion** (real posts/friends data instead of mock arrays) — out of scope; this plan is about structure, types, and correctness of what already exists.

## 8. Risks

- **`git-filter-repo` availability**: needs to be installed separately (`pip install git-filter-repo` or `brew install git-filter-repo`); if unavailable, falls back to `git subtree` which preserves history but with extra merge commits.
- **TypeScript migration surface**: touches nearly every file; doing it file-by-file with small commits (per Phase 3 ordering) keeps each change bisectable and reviewable rather than one giant diff.
- **Auth fix (Phase 4.1) requires a new `/me` endpoint** that doesn't exist today — small but real new backend work, called out explicitly so it isn't a surprise mid-migration.

---

Once you approve this plan (or want changes to it), I'll start with Phase 1.

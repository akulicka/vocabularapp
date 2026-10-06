# VocabularApp

Personal Arabic vocabulary trainer: register, keep a tagged English–Arabic dictionary (with noun/verb grammar fields), and quiz yourself by typing the Arabic **root** for an English prompt.

TypeScript monorepo — React SPA, Express API, MySQL, shared Zod contracts.

## Features

- Email/password register and login (Argon2, JWT in an httpOnly cookie)
- Optional Mailgun email verification (off by default)
- Dictionary CRUD: English, Arabic (tashkeel), root, part of speech
- Noun extras: type, gender, broken plural
- Verb extras: form I–X, irregularity class, tense
- Tags on words; quizzes are filtered by selected tags
- On-screen Arabic keyboard during quizzes
- Profile avatar upload to Google Cloud Storage
- Quiz results persisted (history API exists; no history page yet)

Dictionary entries are **global**, not per-user. Anyone logged in sees the same word list.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, Vite 6, MUI, React Router 7, TanStack Query, Axios |
| Backend | Express 4, Sequelize 6, MySQL, Zod 4, Vitest |
| Shared | `@vocabularapp/shared-types` — TypeScript types + Zod schemas |
| Infra | npm workspaces, Docker Compose, nginx (SPA), GitHub Actions, Railway |

Node **22**.

## Repo layout

```
vocabularapp/
  shared/               # types + Zod; build this before the other packages
  backend/
    src/                # Express app, routes, services
    db/                 # Sequelize models, migrations, seeders
  frontend/
    src/Pages/          # Login, Register, VerifyEmail, Dictionary, Quiz
    src/Components/     # WordForm, QuizModal, Nav, tags/chips
  compose.yaml          # MySQL + API + nginx SPA
  .env.example          # local CLI env
```

## Local development

```bash
npm install
npm run build:shared
cp .env.example .env
```

Fill at least:

```
DB_PORT=3306
DB_USER=root
DB_PASSWORD=...
DB_NAME=vocabular
HOST_DOMAIN=http://localhost:5173
TOKEN_SECRET=...long random string...
```

Do **not** set `DB_HOST` in `.env` if you use the WSL scripts — they point at the Windows host via the default route.

Create the database, then migrate:

```bash
cd backend
npm run migrate          # native MySQL
# npm run wsl:migrate    # WSL + MySQL on Windows
```

Seed vocabulary (pick **one**; both seeders share IDs). Prefer the with-roots file — quizzes score against `root`:

```bash
npx sequelize-cli db:seed --seed 20250412071121-seed_1_withroots.cjs
```

Run API and SPA in two terminals:

```bash
cd backend && npm run dev        # or npm run wsl:dev
cd frontend && npm run dev
```

| | URL |
| --- | --- |
| SPA | http://localhost:5173 |
| API | http://localhost:3000 (`GET /health` → 200) |

Register a new user in the UI. The seed `system` user is only `createdBy` for seeded words, not a documented login.

### Auth cookies on localhost

Session cookies are `Secure` + `SameSite=Strict`. Browsers will not store them on plain `http://localhost`, so login can succeed and then immediately bounce you out. Use HTTPS locally, or treat this as a known local-dev limitation.

## Docker Compose

`compose.yaml` brings up MySQL (`3307→3306`), backend (`3000`), and nginx SPA (`80`). Compose overrides `DB_HOST=db`, `DB_PORT=3306`, and `HOST_DOMAIN=http://localhost` on the API.

`.env.example` is for the native CLI. Compose also interpolates paths for MySQL data, TLS files, and GCS credentials (`MYSQL_DIR`, `LOCAL_CERT_DIR`, `IMAGE_BUCKET`, `MAILGUN_*`, `BUILD_ARG`, etc.).

```bash
docker compose up --build
```

SPA: http://localhost · API health: http://localhost:3000/health

The backend image runs migrations on start.

## Environment

### Root `.env` (API)

| Variable | Used for |
| --- | --- |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL. Compose forces host `db` and port `3306`. |
| `HOST_DOMAIN` | CORS origin **and** links in verification emails. Must be the SPA origin, not the API. |
| `TOKEN_SECRET` | JWT signing |
| `COOKIE_DOMAIN` | Leave unset locally. Prod: `.vocabularapp.ca` |
| `VERIFY_EMAIL` | `false` skips verification and treats users as verified |
| `MAILGUN_KEY` / `MAILGUN_DOMAIN` | Verification emails |
| `IMAGE_BUCKET` / `STORAGE_CLOUD_PROJECT` / `GOOGLE_APPLICATION_CREDENTIALS` | GCS avatars |
| `BEHIND_TLS_PROXY` | TLS is terminated at nginx/Railway; Node serves HTTP |
| `PORT` | API listen port, default `3000` |

### Frontend (Vite)

| File | `VITE_API_BASE_URL` |
| --- | --- |
| `frontend/.env.development` | `http://localhost:3000/` |
| `frontend/.env.staging` | `https://api.preview.vocabularapp.ca/` |
| `frontend/.env.production` | `https://api.vocabularapp.ca/` |

## How it works

**Auth.** `POST /verify` checks credentials. If unverified, the SPA sends a Mailgun link. `POST /login` sets `smartposting_token` (httpOnly JWT, 60 minutes) and `smartposting_session` (readable flag). Protected routes use `verifycookie`. Cookie names still reflect an older deploy domain.

**Dictionary.** Logged-in `/`. Nouns and verbs store extra rows; particles do not. Parts of speech: `NOUN` | `VERB` | `PARTICLE`.

**Quiz.** Logged-in `/quiz`. Pick tags → up to 10 matching words. Prompt is the English gloss; answer is the Arabic root. Client timer default 2 minutes; server session token lives 10 minutes. Submit writes `quiz_results`. Scoring currently trusts the client `isCorrect` flag.

## HTTP API

Auth is mounted at `/` (not `/auth`).

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | no | Liveness |
| POST | `/verify` | no | Check credentials |
| POST | `/login` | no | Set cookies |
| POST | `/logout` | no | Clear cookies |
| POST | `/register` | no | Create user |
| GET | `/user` | yes | Current user |
| GET/POST | `/user/img` | yes | Avatar |
| POST | `/token/create-verify-token` | no | Email a verify link |
| POST | `/token/validate-verify-token` | no | Consume verify link |
| GET/POST/PUT/DELETE | `/words` | yes | Word CRUD |
| GET/POST/PUT/DELETE | `/words/tag(s)` | yes | Tag CRUD |
| POST | `/quiz/start` | yes | New quiz session |
| POST | `/quiz/submit` | yes | Score + persist |
| GET | `/quiz/results/:resultId` | yes | One result |
| GET | `/quiz/history` | yes | Paginated history |

Request bodies are validated with Zod from `shared/schemas`.

## Data model

```
users ──< tokens          (verify + in-progress quiz sessions; quiz payload is JSON)
users ──< quiz_results
users ──< words           (createdBy)
words ──  nouns           (1:1, optional)
words ──  verbs           (1:1, optional)
words >─< tags            (tagwords)
```

Migrations: `backend/db/migrations`. Sequelize CLI: `backend/.sequelizerc`.

## Scripts

```bash
npm run build          # shared → backend → frontend
npm run lint
npm run type-check
npm run test:unit      # backend Vitest
npm run ci             # GitHub Actions
```

Backend: `dev`, `wsl:dev`, `migrate`, `wsl:migrate`, `test:unit`.  
Frontend: `dev`, `build`, Vite modes `development` / `staging` / `production`.

Husky pre-commit runs lint-staged in shared, frontend, then backend. CI (`.github/workflows/ci.yml`) uses Node 22 on `main` / `staging`.

## Branching

`main` is production. `staging` is a preview of the next production deploy.

1. Branch off **`main`**
2. Open a PR into **`staging`**, test there
3. Promote with a PR **`staging` → `main`**
4. Fast-forward `staging` to `main` so the tips match again

Branch off `staging` only when stacking on unpromoted work.

GitHub merge commits live only on `main`, so a compare can show `staging` “behind” with **0 files changed**. That is history, not a pending code diff.

## Deploy

- Frontend image: Vite build → nginx SPA (`try_files`). Port from `$PORT`.
- Backend image: build shared, migrate, then start. TLS is at the proxy (`BEHIND_TLS_PROXY`).
- CORS `origin` is `HOST_DOMAIN` with `credentials: true`.
- Production SPA `https://www.vocabularapp.ca`, API `https://api.vocabularapp.ca`.

## What I’d do next

- Server-side quiz scoring against `word.root` (do not trust client `isCorrect`)
- `Secure` cookies only when the request is HTTPS, so local HTTP login works
- Quiz history UI (the API is already there)
- One documented Compose `.env` that matches `compose.yaml`

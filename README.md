# 🏆 Centralized Sports Management & Performance Analytics Platform

A full-stack, production-grade sports administration platform for colleges, sports academies, and tournament organizers. Built with React, Node.js/Express, MongoDB, Redis, Socket.IO, and Docker.

---

## 🗂 Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Quick Start (Docker)](#quick-start-docker)
4. [Quick Start (Local Dev)](#quick-start-local-dev)
5. [Administrator & Demo Accounts](#administrator--demo-accounts)
6. [Architecture](#architecture)
7. [API Overview](#api-overview)
8. [Security](#security)
9. [Testing](#testing)
10. [Project Structure](#project-structure)

---

## ✨ Features

| Area | Details |
|------|---------|
| **Authentication** | JWT access tokens + rotating refresh tokens, httpOnly cookies, CSRF protection, invite-only signup |
| **Role-Based Access** | Admin, Organizer, Coach, Athlete, Scorer — server-enforced per-operation |
| **Tournament Formats** | Round-robin, Single-elimination, Double round-robin, Group+Knockout |
| **Fixture Engine** | Idempotent automatic fixture generation with seeding |
| **Scheduling Engine** | Atomic venue booking with team-clash detection |
| **Live Scoring** | Real-time WebSocket scoring, append-only audit trail, event reversals |
| **Analytics** | Standings, rankings, player stats, top scorers, team performance |
| **Public Scoreboard** | Dark-theme live scoreboard with Socket.IO updates & QR code sharing |
| **CSV Exports** | Formula-injection-safe standings exports |
| **Notifications** | In-app notifications with real-time push |
| **Audit Logs** | Tamper-evident admin audit trail |
| **Rate Limiting** | Redis-backed per-account and per-IP lockout after 5 failed logins |
| **Search** | Full-text search across tournaments, teams, and players |

---

## 🛠 Tech Stack

**Frontend:** React 18, TypeScript (strict), Vite, React Router 6, TanStack Query, React Hook Form, Zod, Recharts, Socket.IO Client, Lucide React, CSS Modules

**Backend:** Node.js, Express, TypeScript, Mongoose, Zod validation, bcrypt, JWT, Redis, Socket.IO, Supertest

**Database / Infra:** MongoDB (standalone), Redis, Docker, Docker Compose, Nginx

---

## 🐳 Quick Start (Docker)

### Prerequisites
- Docker Desktop ≥ 24
- Docker Compose ≥ 2.20

```bash
# 1. Clone & enter the project
git clone <repo-url>
cd sports-management-platform

# 2. Copy environment config
cp .env.example .env
# Edit .env — set unique secrets (generate each with: openssl rand -hex 32)

# 3. Start all services
docker compose up --build -d

# 4. Seed initial demo data (if not already seeded)
docker compose exec server node dist/utils/seed.js

# 5. Open the application
# Frontend Client: http://localhost:3000 (or http://localhost:3001 if port 3000 is occupied)
# Direct Backend API: http://localhost:5001/api/v1/health
```

---

## 💻 Quick Start (Local Dev)

### Prerequisites
- Node.js ≥ 20
- MongoDB ≥ 7 (running locally or via Atlas)
- Redis ≥ 7 (running locally — or skip, the server uses an in-memory fallback in dev)

```bash
# 1. Install dependencies
npm install           # installs root workspace deps
cd server && npm install && cd ..
cd client && npm install && cd ..

# 2. Configure environment
cp .env.example .env
# Set MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, and COOKIE_SECRET.

# 3. Start backend dev server
cd server
npm run dev

# 4. Start frontend dev server (new terminal)
cd client
npm run dev
# → http://localhost:5173

# 5. Seed demo data
cd server
npm run seed
```

---

## 🔑 Administrator & Demo Accounts

Configure a unique `ADMIN_PASSWORD` before creating an administrator. The setup command accepts credentials through environment variables or command-line arguments, and stores only a bcrypt hash.

```env
ADMIN_NAME="Platform Administrator"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="<set-a-unique-password>"
```

To initialize sample accounts, set `ADMIN_PASSWORD` and each `DEMO_*_PASSWORD` in your local `.env` file. The example file leaves these values empty; do not reuse passwords across environments.

```bash
npm run setup:admin
```

Sample accounts use generic names and `example.com` addresses. Do not use sample credentials for a deployed environment.

---

## 🏗 Architecture

```
┌─────────────────────┐     HTTPS / WS      ┌──────────────────────┐
│   React SPA (Vite)  │ ◄──────────────────► │  Express REST API    │
│   Port 5173 / 80    │                      │  Port 4000           │
└─────────────────────┘                      └──────┬───────────────┘
                                                    │
                              ┌─────────────────────┼──────────────────┐
                              ▼                     ▼                  ▼
                         MongoDB 7            Redis 7           Socket.IO
                         (data store)         (sessions,        (real-time
                                              rate-limits,       scoring)
                                              caching)
```

### Authentication Flow

```
Login → JWT access token (15 min, httpOnly cookie)
     → Refresh token (7d or 30d "keep me signed in", httpOnly cookie)
     → Refresh token hash stored in Redis with family tracking
     → Silent refresh on 401 (coordinated, no duplicate requests)
     → Reuse detection → entire family revoked
```

---

## 📡 API Overview

All endpoints under `/api/v1/`.

| Group | Prefix | Key Endpoints |
|-------|--------|---------------|
| Auth | `/auth` | `POST /login`, `POST /logout`, `POST /refresh`, `GET /me`, `POST /forgot-password`, `POST /reset-password`, `POST /invitations` |
| Users (Admin) | `/users` | CRUD, status management, session revocation |
| Sports | `/sports` | CRUD (Admin only) |
| Tournaments | `/tournaments` | CRUD, fixture generation, standings, CSV export, QR code |
| Teams | `/teams` | CRUD, roster management, player add/remove, analytics |
| Matches | `/matches` | List, schedule, assign scorer, status transitions |
| Scoring | `/matches/:id/events` | Append event, reverse event |
| Registrations | `/registrations` | Submit, review (approve/reject) |
| Venues | `/venues` | CRUD, availability, bookings |
| Resources | `/resources` | CRUD, reservations |
| Notifications | `/notifications` | List, mark-read |
| Search | `/search` | Cross-entity full-text search |
| Public | `/public/tournaments` | No-auth scoreboard endpoints |
| Audit | `/audit-logs` | Admin-only audit trail |

---

## 🔐 Security

- Passwords hashed with `bcrypt` (work factor 12)
- JWT access tokens: 15-minute expiry
- Refresh tokens: rotating, family-tracked, reuse-detected
- Tokens stored **only** in `httpOnly; SameSite=Strict` cookies — never `localStorage`
- CSRF: `SameSite=Strict` cookie policy + `Origin` header validation on state-changing requests
- CORS: explicit allowlist
- NoSQL injection sanitization via `express-mongo-sanitize`
- Rate limiting: 5 failed logins → 15-minute lockout (per account + per IP, Redis-backed)
- Helmet.js security headers
- All request bodies validated with Zod
- Server-side ownership checks — no client-supplied role/owner trust
- Passwords, tokens, and secrets never logged

---

## 🧪 Testing

### Server (Supertest + Vitest/Jest)
```bash
cd server && npm test
```

### Client (Vitest + React Testing Library)
```bash
cd client && npm test
```

### Type Checks
```bash
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
```

---

## 📁 Project Structure

```
sports-management-platform/
├── docker-compose.yml
├── .env.example
├── README.md
├── IMPLEMENTATION_STATUS.md
│
├── server/
│   ├── src/
│   │   ├── config/          # env, database, redis
│   │   ├── controllers/     # auth, user, tournament, team, match, venue, etc.
│   │   ├── middleware/      # authenticate, authorize, error handler
│   │   ├── models/          # 16 Mongoose schemas
│   │   ├── routes/          # REST route definitions
│   │   ├── services/        # fixture, scheduling, scoring, analytics, session, audit
│   │   ├── sockets/         # Socket.IO server with Redis adapter support
│   │   ├── utils/           # security, cookie, seed, validators
│   │   ├── app.ts           # Express app factory
│   │   └── server.ts        # HTTP + Socket.IO entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
└── client/
    ├── src/
    │   ├── components/      # Shared UI (Navbar, Sidebar, Badge, Modal, etc.)
    │   ├── features/
    │   │   ├── admin/       # Admin portal pages
    │   │   ├── organizer/   # Organizer portal pages
    │   │   ├── coach/       # Coach portal pages
    │   │   ├── athlete/     # Athlete portal pages
    │   │   ├── scorer/      # Scorer console
    │   │   ├── public/      # Public scoreboard
    │   │   └── auth/        # Login, password reset, invitation pages
    │   ├── lib/             # api.ts (fetch + silent refresh), socket.ts
    │   ├── styles/          # global.css with CSS custom properties
    │   ├── types/           # Shared TypeScript interfaces
    │   ├── App.tsx          # Routes + ProtectedRoute
    │   └── main.tsx         # QueryClient + AuthProvider
    ├── vite.config.ts
    ├── package.json
    └── tsconfig.json
```

---

## 📄 License

MIT — see `LICENSE` for details.

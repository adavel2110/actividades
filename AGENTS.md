# Incidencias Tracker — Agent Guide

## Stack
- **Framework:** Next.js 14.1.0 (App Router), `output: "standalone"`
- **Auth:** NextAuth v4 with CredentialsProvider (`src/lib/auth.ts`)
- **ORM:** Prisma 5 (`@prisma/client`), PostgreSQL
- **UI:** Tailwind CSS + dark theme (`src/app/globals.css`)
- **Icons:** lucide-react
- **Path alias:** `@/*` → `./src/*`

## Commands
```sh
npm run dev                  # dev server (requires local PG running)
npm run build                # production build
npm run lint                 # next lint
npm run prisma:generate      # generate Prisma client
npm run prisma:migrate       # prisma migrate dev (dev only)
npx prisma migrate deploy    # apply migrations in production
npx prisma db seed           # seed: npx tsx prisma/seed.ts
npm run dev:db               # docker compose up -d (start PostgreSQL)
```

## Project structure
| Path | Purpose |
|------|---------|
| `prisma/schema.prisma` | DB schema: User, Role, Category, Incident (with IncidentStatus enum: PENDIENTE, EN_PROCESO, PROCESADO, CANCELADO, RECHAZADO, DERIVADO) |
| `prisma/seed.ts` | Demos: admin@incidencias.com/admin123, carlos@incidencias.com/esp123, ana@incidencias.com/esp123 |
| `src/lib/auth.ts` | NextAuth config (Credentials + JWT + role in token/session) |
| `src/lib/db.ts` | PrismaClient singleton |
| `src/lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `src/middleware.ts` | Protects `/dashboard`, `/incidents`, `/categories`, `/users`, `/roles` |
| `src/components/sidebar.tsx` | Sidebar nav (admin items conditionally shown) |

## Pages & access
| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Login page |
| `/dashboard` | Auth | Stats cards + category bars |
| `/incidents` | Auth | List with filters (admin sees all, filter by user) |
| `/incidents/new` | Auth | Create form |
| `/incidents/[id]` | Auth | Detail view |
| `/incidents/[id]/edit` | Auth | Edit form (admin can reassign) |
| `/categories` | Admin | CRUD categories |
| `/users` | Admin | CRUD users |
| `/roles` | Admin | CRUD roles |

## API routes
| Route | Methods | Access |
|-------|---------|--------|
| `/api/auth/[...nextauth]` | GET, POST | Public (NextAuth) |
| `/api/dashboard/stats` | GET | Auth |
| `/api/incidents` | GET, POST | Auth |
| `/api/incidents/[id]` | GET, PUT, DELETE | Auth (owner or admin) |
| `/api/categories` | GET, POST | GET=auth, POST=admin |
| `/api/categories/[id]` | PUT, DELETE | Admin |
| `/api/users` | GET, POST | Admin |
| `/api/users/[id]` | PUT, DELETE | Admin |
| `/api/roles` | GET, POST | Admin |
| `/api/roles/[id]` | PUT, DELETE | Admin |

## Docker production deploy
```sh
docker compose -f docker-compose.prod.yml up -d --build
```

**Known gotchas:**
1. The `migration` service uses `target: builder`, which runs a full `next build` just to run `prisma migrate deploy`. Slow, rebuilds for `web` too.
2. Next.js standalone output strips `.prisma/client/` (engine binaries). Dockerfile copies it separately (`COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma`) and sets `PRISMA_QUERY_ENGINE_LIBRARY`.
3. `NEXTAUTH_URL` defaults to `http://localhost`. Override at deploy: `NEXTAUTH_URL=http://10.10.30.53 docker compose -f docker-compose.prod.yml up -d`
4. Port 80 requires root; change to high port (e.g. `"3000:3000"`) if needed.
5. **No initial migration committed.** Before first prod deploy, run `npx prisma migrate dev --name init` locally. Without this, `prisma migrate deploy` finds nothing to apply.

## Local dev
```sh
docker compose up -d         # start PostgreSQL on :5432
npm run dev                  # start Next.js on :3000
```

## Seeding
```sh
npx prisma db seed
# Creates: Admin/Especialista roles, 2 specialist users, 4 categories, 5 sample incidents
```

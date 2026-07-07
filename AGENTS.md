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
| `prisma/schema.prisma` | DB schema: User, Role, Category, Incident (IncidentStatus enum, endDate, place) |
| `prisma/seed.ts` | Demos: admin@incidencias.com/admin123, carlos@incidencias.com/esp123, ana@incidencias.com/esp123 |
| `src/lib/auth.ts` | NextAuth config (Credentials + JWT + role in token/session) |
| `src/lib/db.ts` | PrismaClient singleton |
| `src/lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `src/middleware.ts` | Protects `/dashboard`, `/incidents`, `/categories`, `/users`, `/roles` |
| `src/components/sidebar.tsx` | Sidebar nav (Reportes link added, admin items conditionally shown) |

## Pages & access
| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Login page |
| `/dashboard` | Auth | Stats cards + category bars |
| `/incidents` | Auth | List with pagination (5/page), sort asc/desc, filter by user |
| `/incidents/new` | Auth | Create form (endDate, place fields) |
| `/incidents/[id]` | Auth | Detail view (shows endDate, place) |
| `/incidents/[id]/edit` | Auth | Edit form (admin can reassign) |
| `/incidents/report` | Auth | Two report types: Informe Semanal (carta) + Reporte de Incidencias (tabla), date/user filter, WhatsApp counts (optional), print button |
| `/categories` | Admin | CRUD categories |
| `/users` | Admin | CRUD users |
| `/roles` | Admin | CRUD roles |

## API routes
| Route | Methods | Access | Notes |
|-------|---------|--------|-------|
| `/api/auth/[...nextauth]` | GET, POST | Public | NextAuth |
| `/api/dashboard/stats` | GET | Auth | |
| `/api/incidents` | GET, POST | Auth | GET supports: page, limit, sort, order, userId, categoryId, status, startDate, endDate |
| `/api/incidents/[id]` | GET, PUT, DELETE | Auth | Owner or admin |
| `/api/categories` | GET, POST | GET=auth, POST=admin | |
| `/api/categories/[id]` | PUT, DELETE | Admin | |
| `/api/users` | GET, POST | Admin | |
| `/api/users/[id]` | PUT, DELETE | Admin | |
| `/api/roles` | GET, POST | Admin | |
| `/api/roles/[id]` | PUT, DELETE | Admin | |

## Docker production deploy
```sh
NEXTAUTH_URL=http://10.10.30.53 docker compose -f docker-compose.prod.yml up -d --build
```
NEXTAUTH_URL must always be set explicitly at deploy time. Never hardcode in .env.

## Incident fields
| Field | Type | Notes |
|-------|------|-------|
| `date` | DateTime | Required, when incident was reported |
| `endDate` | DateTime? | Optional, when it was resolved |
| `place` | Varchar(100)? | Optional, origin location |
| `reportedBy` | Varchar(100) | Who reported it |
| `description` | Text | Details of the incident |
| `status` | IncidentStatus | PENDIENTE, EN_PROCESO, PROCESADO, CANCELADO, RECHAZADO, DERIVADO |
| `categoryId` | String | FK to Category |
| `userId` | String | FK to User (creator) |

## Report types (`/incidents/report`)
1. **Informe Semanal (carta):** Formal letter with "De:", "Asunto:", intro paragraph, ticket breakdown by category, WhatsApp attention section (manually entered), closing, signature. Printable.
2. **Reporte de Incidencias (tabla):** Full table with #, date, category, reportedBy, place, description, status. Printable.

## Known gotchas
1. `migration` service uses `target: builder`, runs full `next build` just to run `prisma migrate deploy`. Slow.
2. Next.js standalone strips `.prisma/client/`. Dockerfile copies it separately and sets `PRISMA_QUERY_ENGINE_LIBRARY`.
3. `NEXTAUTH_URL` must be passed explicitly at deploy. Not in .env.
4. Port 80 requires root; change to high port (`"3000:3000"`) if needed.
5. No initial migration committed. Run `npx prisma migrate dev --name init` locally before first prod deploy.
6. OpenSSL warning in Docker is non-blocking; app works.

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

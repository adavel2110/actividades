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
ALLOW_SEED=true npx prisma db seed  # seed (DESTRUYE datos, requiere ALLOW_SEED=true)
npm run dev:db               # docker compose up -d (start PostgreSQL)
npm install html2pdf.js      # PDF export dependency (already installed)
```

## Project structure
| Path | Purpose |
|------|---------|
| `prisma/schema.prisma` | DB schema: User, Role, Category, Incident, Company, Department, EmailRequest |
| `prisma/seed.ts` | Demos: admin@incidencias.com/admin123, carlos@incidencias.com/esp123, ana@incidencias.com/esp123 |
| `src/lib/auth.ts` | NextAuth config (Credentials + JWT + role in token/session) |
| `src/lib/db.ts` | PrismaClient singleton |
| `src/lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `src/middleware.ts` | Protects `/dashboard`, `/incidents`, `/categories`, `/companies`, `/departments`, `/users`, `/roles`, `/profile`, `/emails` |
| `src/components/sidebar.tsx` | Sidebar responsive (hamburger en movil/tablet, overlay, admin items conditionally shown) |

## Pages & access
| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Login page |
| `/dashboard` | Auth | Stats cards + barras (filtro tipo Incidencias/Correos, filtro usuario admin, filtro empresa admin) |
| `/incidents` | Auth | List with pagination (5/page), sort asc/desc, filter by user |
| `/incidents/new` | Auth | Create form (endDate, place fields) |
| `/incidents/[id]` | Auth | Detail view (shows endDate, place) |
| `/incidents/[id]/edit` | Auth | Edit form (admin can reassign) |
| `/incidents/report` | Auth | Two report types: Informe Semanal (carta) + Reporte de Incidencias (tabla), date/user filter, WhatsApp counts (optional), PDF export + print button |
| `/profile` | Auth | Update name, email, and password |
| `/categories` | Admin | CRUD categories |
| `/companies` | Admin | CRUD empresas (nombre, cantidad de departamentos) |
| `/departments` | Admin | CRUD departamentos con filtro por empresa |
| `/users` | Admin | CRUD users |
| `/roles` | Admin | CRUD roles |
| `/emails` | Admin | Control de solicitudes de correo (con empresa y departamento del colaborador) |

## API routes
| Route | Methods | Access | Notes |
|-------|---------|--------|-------|
| `/api/auth/[...nextauth]` | GET, POST | Public | NextAuth |
| `/api/dashboard/stats` | GET | Auth | Supports `?type=incidents|emails`, `?userId=...`, `?companyId=...` |
| `/api/incidents` | GET, POST | Auth | GET supports: page, limit, sort, order, userId, categoryId, status, startDate, endDate |
| `/api/incidents/[id]` | GET, PUT, DELETE | Auth | Owner or admin |
| `/api/categories` | GET, POST | GET=auth, POST=admin | GET returns `{ data, total, page, limit, totalPages }` |
| `/api/categories/[id]` | PUT, DELETE | Admin | |
| `/api/companies` | GET, POST | GET=auth, POST=admin | Company CRUD |
| `/api/companies/[id]` | GET, PUT, DELETE | Admin | |
| `/api/departments` | GET, POST | GET=auth, POST=admin | GET supports `?companyId=...` filter |
| `/api/departments/[id]` | GET, PUT, DELETE | Admin | |
| `/api/users` | GET, POST | Admin | |
| `/api/users/[id]` | PUT, DELETE | Admin | |
| `/api/roles` | GET, POST | Admin | |
| `/api/roles/[id]` | PUT, DELETE | Admin | |
| `/api/profile` | PUT | Auth | Update own name, email, password |
| `/api/emails` | GET, POST | GET=auth, POST=admin | EmailRequest CRUD, supports `?companyId=...`, `?search=...` |
| `/api/emails/[id]` | GET, PUT, DELETE | Admin | |

## Docker production deploy
```sh
docker compose -f docker-compose.prod.yml up -d --build
```
- `NEXTAUTH_URL` is set in `docker-compose.prod.yml` (currently `http://10.10.30.53`). Update if server IP changes.
- `NEXTAUTH_SECRET` must match the one in `.env` to avoid JWT decryption errors.
- PostgreSQL runs on port **5433** in prod (5432 is used by local PG).
- pgAdmin available at port **5050** (admin@admin.com / admin).

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

## EmailRequest fields
| Field | Type | Notes |
|-------|------|-------|
| `email` | String | Required, unique email address |
| `requester` | String | Required, who requested the email |
| `domain` | String? | Optional, email domain |
| `firstName` | String | Required, first name |
| `lastName` | String | Required, last name |
| `cedula` | String | Required, ID number |
| `companyId` | String? | FK to Company |
| `departmentId` | String? | FK to Department |
| `status` | EmailStatus | PENDIENTE, EN_PROCESO, COMPLETADO, CANCELADO |
| `description` | Text | Required, details of the request |
| `fechaBaja` | DateTime? | Optional, deletion date |
| `userId` | String | FK to User (creator) |
| `createdAt` | DateTime | Auto-generated |

## Report types (`/incidents/report`)
1. **Informe Semanal (carta):** Formal letter with "De:", "Asunto:", intro paragraph, ticket breakdown by category, WhatsApp attention section (manually entered), closing, signature. Printable + PDF export.
2. **Reporte de Incidencias (tabla):** Full table with #, date, category, reportedBy, place, description, status. Printable + PDF export.

## Auth model
- Middleware (`src/middleware.ts`) only checks login — does **not** enforce roles. Admin routes (`/categories`, `/users`, `/roles`, `/emails`) are protected per-handler via `(session.user as any).role === "Admin"` checks in API routes.
- Session/role types are not extended — all role access uses `(session.user as any).role` type casts. If you add typed session fields, update both `auth.ts` callbacks and every consumer.
- Custom pages configured: `signIn: "/"`, `signOut: "/"` (login and logout redirect to root).

## Known gotchas
1. `migration` service uses `target: builder`, runs full `next build` just to run `prisma migrate deploy`. Slow.
2. Next.js standalone strips `.prisma/client/`. Dockerfile copies it separately and sets `PRISMA_QUERY_ENGINE_LIBRARY`.
3. `NEXTAUTH_URL` must be passed explicitly at deploy. Not in .env.
4. Port 80 requires root; change to high port (`"3000:3000"`) if needed.
5. No initial migration committed. Run `npx prisma migrate dev --name init` locally before first prod deploy.
6. OpenSSL warning in Docker is non-blocking; app works.
7. Port 5432 may conflict with other Postgres instances; already changed to 5433 in docker-compose.prod.yml.
8. **No test suite exists.** No test framework is configured — `npm test` is not defined. Don't look for test files.
9. API paginated endpoints (e.g. `/api/categories`) return `{ data, total, page, limit, totalPages }`, not a bare array. Client must extract `.data`.
10. JWT secret mismatch between `.env` and `docker-compose.prod.yml` causes decryption errors. Always keep them in sync.

## ⚠️ PRODUCCIÓN — Protección de datos

> **REGLA CRÍTICA: NUNCA ejecutar estos comandos contra la base de datos de producción:**

| Comando | ¿Qué hace? | Peligro |
|---------|-------------|---------|
| `npx prisma migrate dev` | Crea migración + **borra y recrea** la DB | **DESTRUYE TODOS LOS DATOS** |
| `npx prisma db seed` | Ejecuta `seed.ts` que hace `deleteMany({})` antes de insertar | **BORRA TODOS LOS DATOS** |
| `npx prisma migrate reset` | Resetea la DB completa (borra, recrea, re-seeda) | **DESTRUYE TODOS LOS DATOS** |

**En producción (Docker) solo se permite:**
- `npx prisma migrate deploy` — aplica migraciones pendientes de forma segura (sin borrar datos).
- `npx prisma generate` — regenera el cliente Prisma.

**Si necesitas migrar en producción:**
1. Primero crea la migración localmente: `npx prisma migrate dev --name mi_migracion`
2. Verifica que la SQL generada sea segura (sin DROP TABLE/TRUNCATE)
3. Despliega con: `NEXTAUTH_URL=http://IP docker compose -f docker-compose.prod.yml up -d --build`

**Si necesitas sembrar datos en producción:**
- Nunca uses `prisma db seed` en producción.
- Crea scripts específicos que usen `prisma.[model].create()` sin `deleteMany()` previo.

**Causa probable del incidente anterior:** Se ejecutó `prisma migrate dev` o `prisma db seed` contra la base de datos de producción, lo cual borró todos los datos existentes.

## Local dev
```sh
docker compose up -d         # start PostgreSQL on :5432
npm run dev                  # start Next.js on :3000
```

## Seeding
```sh
ALLOW_SEED=true npx prisma db seed
# Creates: Admin/Especialista roles, 2 specialist users, 4 categories, 5 sample incidents
```

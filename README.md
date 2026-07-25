# Actividades - Sistema de Control de Incidencias

Sistema web para el registro, seguimiento y reporte de incidencias y solicitudes de correo electrónico. Desarrollado con Next.js, Prisma y PostgreSQL.

## Características

- **Gestión de incidencias:** Crear, editar, filtrar y derivar incidencias con estados (PENDIENTE, EN_PROCESO, PROCESADO, CANCELADO, RECHAZADO, DERIVADO)
- **Solicitudes de correo:** Control de creación de cuentas de correo con seguimiento por departamento y empresa
- **Reportes:** Generación de informes semanales (carta formal) y reportes de incidencias (tabla) con exportación a PDF
- **Dashboard:** Panel con estadísticas y gráficas de barras
- **Autenticación:** Login con roles (Admin y Especialista) y control de acceso por módulo
- **Responsive:** Interfaz adaptable a móvil, tablet y escritorio con tema oscuro

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Framework | Next.js 14 (App Router) |
| Base de datos | PostgreSQL + Prisma ORM |
| Autenticación | NextAuth v4 (Credentials + JWT) |
| Estilos | Tailwind CSS |
| Despliegue | Docker + Docker Compose |

## Ramas

| Rama | Descripción |
|------|-------------|
| `master` | Producción |
| `paulimar` | Desarrollo / funcionalidades |
| `email-domain-feature` | Funcionalidad de dominio de correo |

## Inicio Rápido

### Requisitos
- Node.js 18+
- Docker y Docker Compose
- PostgreSQL

### Instalación

```bash
# Clonar el repositorio
git clone git@github.com:adavel2110/actividades.git
cd actividades

# Instalar dependencias
npm install

# Levantar PostgreSQL
docker compose up -d

# Generar cliente Prisma
npm run prisma:generate

# Aplicar migraciones
npx prisma migrate dev

# Sembrar datos de prueba
ALLOW_SEED=true npx prisma db seed

# Iniciar servidor de desarrollo
npm run dev
```

Acceder a http://localhost:3000

### Credenciales de prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin@incidencias.com | admin123 | Admin |
| carlos@incidencias.com | esp123 | Especialista |
| ana@incidencias.com | esp123 | Especialista |

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/          # API routes (REST)
│   ├── categories/   # CRUD categorías (Admin)
│   ├── companies/    # CRUD empresas (Admin)
│   ├── departments/  # CRUD departamentos (Admin)
│   ├── dashboard/    # Panel de estadísticas
│   ├── emails/       # Solicitudes de correo
│   ├── incidents/    # Gestión de incidencias
│   ├── profile/      # Perfil de usuario
│   ├── roles/        # CRUD roles (Admin)
│   └── users/        # CRUD usuarios (Admin)
├── components/       # Componentes reutilizables
└── lib/              # Utilidades y configuración
prisma/
├── schema.prisma     # Esquema de base de datos
└── seed.ts           # Datos iniciales de prueba
```

## Despliegue en Producción

```bash
NEXTAUTH_URL=http://IP_SERVIDOR docker compose -f docker-compose.prod.yml up -d --build
```

> **IMPORTANTE:** `NEXTAUTH_URL` debe configurarse dinámicamente en cada despliegue. Nunca hardcodear en `.env`.

## Comandos Disponibles

```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run lint             # Verificar código
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Migraciones (solo desarrollo)
```

## Licencia

Proyecto privado - Fibex Telecom

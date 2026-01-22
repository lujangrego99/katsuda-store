# CLAUDE.md - Katsuda Store

## Proyecto
E-commerce de grifería y sanitarios para Katsuda - Distribuidores de primeras marcas en Mendoza y San Juan.

## Stack
- **Frontend**: Next.js 14 + React 18 + Tailwind CSS + shadcn/ui
- **Backend**: Express + Prisma
- **BD**: PostgreSQL 16
- **Deploy**: Easypanel

## Estructura
```
katsuda-store/
├── apps/
│   ├── web/          # Frontend Next.js (puerto 3000)
│   └── api/          # Backend Express (puerto 3001)
├── packages/
│   └── shared/       # Tipos compartidos
└── docker-compose.yml
```

## Comandos

```bash
# Desarrollo
pnpm dev              # Ambos servicios en paralelo
pnpm dev:web          # Solo frontend
pnpm dev:api          # Solo backend

# Build
pnpm build            # Build de producción
pnpm build:web        # Solo frontend
pnpm build:api        # Solo backend

# Base de datos
pnpm db:migrate       # Correr migraciones
pnpm db:seed          # Poblar datos iniciales
pnpm db:studio        # Abrir Prisma Studio

# Calidad
pnpm typecheck        # Verificar tipos
pnpm lint             # Linter
```

## Conexión BD

```
postgres://postgres:1bc6552dfa18bd68cd26@38.54.45.192:5433/katsuda?sslmode=disable
```

## Colores Katsuda

| Nombre | Hex | Uso |
|--------|-----|-----|
| green-900 | #1B5E20 | Primario (header, botones principales) |
| green-700 | #2E7D32 | Secundario |
| green-500 | #4CAF50 | Accent (hover, focus) |
| green-100 | #C8E6C9 | Fondos claros |
| green-50 | #E8F5E9 | Fondos muy claros |
| orange | #FF6B35 | Ofertas, badges |

## Convenciones

### API
- Rutas: `/api/[recurso]` (plural)
- Respuestas: `{ data, message?, error? }`
- Paginación: `{ data, total, page, pageSize, totalPages }`

### Frontend
- Componentes: PascalCase en `src/components/`
- Hooks: camelCase con prefijo `use` en `src/lib/hooks/`
- Utils: camelCase en `src/lib/utils/`

### Prisma
- Schema: `apps/api/src/prisma/schema.prisma`
- Migraciones: `apps/api/src/prisma/migrations/`

## Deploy (Easypanel)

### Webhooks
```bash
# Frontend
curl -X POST http://38.54.45.192:3000/api/deploy/bfccad11fa135d0f34603b0eeb9b39c97eb9791f7bf82c2d

# Backend
curl -X POST http://38.54.45.192:3000/api/deploy/09fe0d413400c8e8bfc9b80a0fffb27cba1b9497d0ac78f7
```

### Rutas de build
- Frontend: `/apps/web`
- Backend: `/apps/api`

## Referencias

- PRD: `./PRD-KATSUDA.md`
- Competencia: https://www.policuyo.com.ar
- Sitio actual: http://www.katsuda.com.ar
- Obsidian: `/mnt/c/Users/samsung/Documents/Obsidian/Contablix/proyectos/KatsudaStore/`

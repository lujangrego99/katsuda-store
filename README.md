# Katsuda Store

E-commerce de grifería y sanitarios para Katsuda - Distribuidores de primeras marcas en Mendoza y San Juan.

## Stack

- **Frontend**: Next.js 14 + React 18 + Tailwind CSS
- **Backend**: Express + Prisma
- **Database**: PostgreSQL 16
- **Deploy**: Easypanel

## Estructura

```
katsuda-store/
├── apps/
│   ├── web/          # Frontend Next.js
│   └── api/          # Backend Express
├── packages/
│   └── shared/       # Tipos compartidos
└── docker-compose.yml
```

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Iniciar desarrollo (ambos servicios)
pnpm dev

# Solo frontend
pnpm dev:web

# Solo backend
pnpm dev:api
```

## Base de Datos

```bash
# Correr migraciones
pnpm db:migrate

# Poblar datos iniciales
pnpm db:seed

# Abrir Prisma Studio
pnpm db:studio
```

## Build

```bash
# Build de producción
pnpm build

# Con Docker (desarrollo)
docker-compose up --build
```

## Deploy

### Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```bash
DATABASE_URL=postgres://user:pass@host:5432/katsuda
JWT_SECRET=your-secret-key
NEXT_PUBLIC_API_URL=https://api.katsuda.com.ar
NEXT_PUBLIC_SITE_URL=https://katsuda.com.ar
```

### Docker (Producción)

```bash
# Build y ejecutar
docker-compose -f docker-compose.prod.yml up --build -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Parar
docker-compose -f docker-compose.prod.yml down
```

### Easypanel

1. Crear servicio **katsuda-front**:
   - Source: GitHub repo
   - Dockerfile: `apps/web/Dockerfile`
   - Port: 3000
   - Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`

2. Crear servicio **katsuda-api**:
   - Source: GitHub repo
   - Dockerfile: `apps/api/Dockerfile`
   - Port: 3001
   - Env: `DATABASE_URL`, `JWT_SECRET`

### Health Checks

- **API**: `GET /health` - Verifica conexión a BD
- **Web**: Puerto 3000 responde

## Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Verde 900 | #1B5E20 | Primario |
| Verde 700 | #2E7D32 | Secundario |
| Verde 500 | #4CAF50 | Accent |
| Naranja | #FF6B35 | Ofertas |

## License

Private - Katsuda

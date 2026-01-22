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

# Con Docker
docker-compose up --build
```

## Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Verde 900 | #1B5E20 | Primario |
| Verde 700 | #2E7D32 | Secundario |
| Verde 500 | #4CAF50 | Accent |
| Naranja | #FF6B35 | Ofertas |

## License

Private - Katsuda

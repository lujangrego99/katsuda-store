# PRD: Tienda Online Katsuda

> **Proyecto**: Katsuda Store - E-commerce de Grifería y Sanitarios
> **Versión**: 1.0
> **Fecha**: 2026-01-21
> **Cliente**: Katsuda - Distribuidores de primeras marcas (Mendoza y San Juan)
> **Deploy**: Easypanel
> **BD**: PostgreSQL (ya configurada)

---

## Resumen Ejecutivo

Crear una tienda online completa para Katsuda, empresa distribuidora de grifería y sanitarios en Mendoza y San Juan. La tienda debe permitir a los clientes navegar productos, ver precios, agregar al carrito y realizar pedidos/consultas.

### Referencia de Competencia
- **Policuyo** (www.policuyo.com.ar) - E-commerce similar del rubro
- Funcionalidades clave: catálogo por categorías, filtros, carrito, calculadora envío

### Identidad Visual (de katsuda.com.ar)
- **Color primario**: Verde #1B5E20 (verde oscuro)
- **Color secundario**: Verde #2E7D32 (verde medio)
- **Accent**: Verde #4CAF50 (verde claro)
- **Fondo**: Blanco #FFFFFF
- **Texto**: Gris oscuro #333333
- **Logo**: Tipografía estilizada "Katsuda" con elemento japonés

---

## Stack Tecnológico

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Backend | Node.js + Express | Rápido desarrollo, fácil deploy |
| Frontend | Next.js 14 + React 18 | SSR, SEO, performance |
| Base de Datos | PostgreSQL 16 | Ya configurada en Easypanel |
| ORM | Prisma | Type-safe, migraciones fáciles |
| Styling | Tailwind CSS | Consistencia, rapidez |
| Components | shadcn/ui | Componentes accesibles |
| State | Zustand | Simple, sin boilerplate |
| Payments | MercadoPago (futuro) | Estándar Argentina |
| Images | Cloudinary/S3 | Optimización automática |

### Conexión BD
```
postgres://postgres:1bc6552dfa18bd68cd26@38.54.45.192:5433/katsuda?sslmode=disable
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                      KATSUDA STORE                              │
├─────────────────────────────────────────────────────────────────┤
│  FRONTEND (Next.js)                                             │
│  ├── / (Home)                 # Hero + Categorías + Ofertas     │
│  ├── /productos               # Catálogo con filtros            │
│  ├── /productos/[slug]        # Detalle de producto             │
│  ├── /categoria/[slug]        # Productos por categoría         │
│  ├── /carrito                 # Carrito de compras              │
│  ├── /checkout                # Proceso de compra               │
│  ├── /contacto                # Formulario contacto             │
│  ├── /nosotros                # Quiénes somos                   │
│  └── /admin/*                 # Panel administración            │
├─────────────────────────────────────────────────────────────────┤
│  BACKEND (API)                                                  │
│  ├── /api/products            # CRUD productos                  │
│  ├── /api/categories          # CRUD categorías                 │
│  ├── /api/brands              # CRUD marcas                     │
│  ├── /api/cart                # Gestión carrito                 │
│  ├── /api/orders              # Pedidos                         │
│  ├── /api/contact             # Mensajes contacto               │
│  ├── /api/shipping            # Cálculo envío                   │
│  └── /api/admin/*             # Endpoints admin                 │
├─────────────────────────────────────────────────────────────────┤
│  BASE DE DATOS (PostgreSQL)                                     │
│  ├── products                 # Productos                       │
│  ├── categories               # Categorías                      │
│  ├── brands                   # Marcas                          │
│  ├── product_images           # Imágenes de productos           │
│  ├── product_attributes       # Atributos (color, tamaño)       │
│  ├── cart_items               # Items en carritos               │
│  ├── orders                   # Pedidos                         │
│  ├── order_items              # Items de pedidos                │
│  ├── customers                # Clientes                        │
│  ├── admins                   # Administradores                 │
│  ├── contacts                 # Mensajes de contacto            │
│  └── shipping_zones           # Zonas de envío                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Categorías de Productos

Basado en el rubro de Katsuda y competencia:

| Categoría | Subcategorías |
|-----------|---------------|
| **Griferías** | Lavatorio, Bidet, Bañera/Ducha, Cocina, Canillas, Accesorios |
| **Sanitarios** | Inodoros, Bidets, Lavatorios, Bañeras, Duchas, Combos |
| **Termotanques** | Eléctricos, Gas, Solares |
| **Bombas** | Presurizadoras, Sumergibles, Periféricas |
| **Climatización** | Aires acondicionados, Calefactores, Ventilación |
| **Instalaciones** | Caños, Conexiones, Llaves de paso, Tanques |
| **Hogar** | Cocinas, Anafes, Campanas, Piletas |
| **Construcción** | Cemento, Adhesivos, Herramientas |

### Marcas
- FV (principal)
- Piazza
- Ferrum
- Roca
- Aqua
- DECA
- Total
- Y otras listadas en katsuda.com.ar

---

## Épicas y User Stories

| # | Épica | Puntos | Dependencias | Descripción |
|---|-------|--------|--------------|-------------|
| **E0** | Setup Inicial | 5 | - | Proyecto, BD, estructura |
| **E1** | Modelo de Datos | 8 | E0 | Schema completo, seeds |
| **E2** | Catálogo Público | 13 | E1 | Home, listado, filtros, detalle |
| **E3** | Carrito y Checkout | 10 | E2 | Carrito, pedidos, notificaciones |
| **E4** | Panel Admin | 13 | E1 | CRUD productos, pedidos, stats |
| **E5** | Features Avanzadas | 8 | E3 | Búsqueda, envío, WhatsApp |
| **E6** | SEO y Performance | 5 | E2 | Meta tags, sitemap, optimización |
| **E7** | Deploy y Testing | 5 | E6 | Easypanel, tests E2E |

**Total estimado: ~67 puntos**

---

## ÉPICA 0: Setup Inicial

### E0-S01: Crear estructura del proyecto (2 pts)

```bash
katsuda-store/
├── apps/
│   ├── web/                    # Frontend Next.js
│   │   ├── src/
│   │   │   ├── app/            # App Router
│   │   │   ├── components/     # Componentes React
│   │   │   ├── lib/            # Utilidades
│   │   │   └── styles/         # CSS global
│   │   └── package.json
│   └── api/                    # Backend Express
│       ├── src/
│       │   ├── routes/         # Rutas API
│       │   ├── controllers/    # Lógica
│       │   ├── services/       # Servicios
│       │   ├── middleware/     # Middlewares
│       │   └── prisma/         # Schema y cliente
│       └── package.json
├── packages/
│   └── shared/                 # Tipos compartidos
├── docker-compose.yml
├── pnpm-workspace.yaml
└── README.md
```

**Criterios de Aceptación**:
- [ ] Monorepo con pnpm workspaces
- [ ] Next.js 14 con App Router
- [ ] Express + Prisma configurado
- [ ] TypeScript en todo el proyecto
- [ ] Tailwind CSS configurado

### E0-S02: Configurar conexión BD (2 pts)

**Archivo**: `apps/api/src/prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**Criterios de Aceptación**:
- [ ] Conexión a PostgreSQL funciona
- [ ] Prisma genera cliente
- [ ] Variables de entorno configuradas

### E0-S03: Crear CLAUDE.md del proyecto (1 pt)

**Archivo**: `.claude/CLAUDE.md`

```markdown
# CLAUDE.md - Katsuda Store

## Proyecto
E-commerce de grifería y sanitarios para Katsuda (Mendoza/San Juan).

## Stack
- Frontend: Next.js 14 + Tailwind + shadcn/ui
- Backend: Express + Prisma
- BD: PostgreSQL 16

## Estructura
/apps/web    → Frontend Next.js
/apps/api    → Backend Express

## Comandos
# Desarrollo
pnpm dev           # Ambos servicios
pnpm dev:web       # Solo frontend
pnpm dev:api       # Solo backend

# Build
pnpm build

# BD
pnpm db:migrate    # Correr migraciones
pnpm db:seed       # Poblar datos iniciales
pnpm db:studio     # Prisma Studio

## Colores
- Primario: #1B5E20 (verde oscuro)
- Secundario: #2E7D32 (verde medio)
- Accent: #4CAF50 (verde claro)

## Conexión BD
postgres://postgres:1bc6552dfa18bd68cd26@38.54.45.192:5433/katsuda
```

---

## ÉPICA 1: Modelo de Datos

### E1-S01: Schema de productos y categorías (3 pts)

```prisma
model Category {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String?
  image       String?
  parentId    String?
  parent      Category? @relation("CategoryToCategory", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryToCategory")
  products    Product[]
  order       Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Brand {
  id        String    @id @default(cuid())
  name      String
  slug      String    @unique
  logo      String?
  products  Product[]
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
}

model Product {
  id              String    @id @default(cuid())
  sku             String    @unique
  name            String
  slug            String    @unique
  description     String?
  shortDesc       String?
  price           Decimal   @db.Decimal(12, 2)
  comparePrice    Decimal?  @db.Decimal(12, 2)  // Precio tachado
  transferPrice   Decimal?  @db.Decimal(12, 2)  // Precio transferencia
  cost            Decimal?  @db.Decimal(12, 2)
  stock           Int       @default(0)
  stockWarning    Int       @default(5)
  categoryId      String
  category        Category  @relation(fields: [categoryId], references: [id])
  brandId         String?
  brand           Brand?    @relation(fields: [brandId], references: [id])
  images          ProductImage[]
  attributes      ProductAttribute[]
  isFeatured      Boolean   @default(false)
  isActive        Boolean   @default(true)
  freeShipping    Boolean   @default(false)
  weight          Decimal?  @db.Decimal(8, 2)  // kg
  dimensions      Json?     // {width, height, depth}
  tags            String[]
  seoTitle        String?
  seoDescription  String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  cartItems       CartItem[]
  orderItems      OrderItem[]
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  alt       String?
  order     Int     @default(0)
  isPrimary Boolean @default(false)
}

model ProductAttribute {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  name      String  // "Color", "Material", "Tecnología"
  value     String  // "Cromo", "Acero inoxidable", "Monocomando"
}
```

### E1-S02: Schema de clientes y pedidos (3 pts)

```prisma
model Customer {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?  // Null si es guest checkout
  firstName String
  lastName  String
  phone     String?
  addresses Address[]
  orders    Order[]
  carts     Cart[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Address {
  id         String    @id @default(cuid())
  customerId String
  customer   Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  street     String
  number     String
  floor      String?
  apartment  String?
  city       String
  province   String    // Mendoza, San Juan
  postalCode String
  isDefault  Boolean   @default(false)
  orders     Order[]
}

model Cart {
  id         String     @id @default(cuid())
  customerId String?
  customer   Customer?  @relation(fields: [customerId], references: [id])
  sessionId  String?    // Para carritos anónimos
  items      CartItem[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  @@unique([customerId])
  @@index([sessionId])
}

model CartItem {
  id        String  @id @default(cuid())
  cartId    String
  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int

  @@unique([cartId, productId])
}

model Order {
  id            String      @id @default(cuid())
  orderNumber   String      @unique
  customerId    String?
  customer      Customer?   @relation(fields: [customerId], references: [id])
  addressId     String?
  address       Address?    @relation(fields: [addressId], references: [id])
  items         OrderItem[]
  subtotal      Decimal     @db.Decimal(12, 2)
  shipping      Decimal     @db.Decimal(12, 2)
  discount      Decimal     @default(0) @db.Decimal(12, 2)
  total         Decimal     @db.Decimal(12, 2)
  status        OrderStatus @default(PENDING)
  paymentMethod String?     // "transfer", "mercadopago", "cash"
  paymentStatus PaymentStatus @default(PENDING)
  notes         String?
  // Datos de contacto (por si es guest)
  guestEmail    String?
  guestName     String?
  guestPhone    String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  price     Decimal @db.Decimal(12, 2)  // Precio al momento de compra
  total     Decimal @db.Decimal(12, 2)
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}
```

### E1-S03: Schema admin y contacto (2 pts)

```prisma
model Admin {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      AdminRole @default(STAFF)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  lastLogin DateTime?
}

enum AdminRole {
  SUPER
  ADMIN
  STAFF
}

model Contact {
  id        String   @id @default(cuid())
  name      String
  email     String
  phone     String?
  province  String?  // Mendoza o San Juan
  subject   String?
  message   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}

model ShippingZone {
  id        String   @id @default(cuid())
  name      String   // "Gran Mendoza", "San Juan Capital"
  province  String
  cities    String[] // Lista de ciudades/localidades
  price     Decimal  @db.Decimal(10, 2)
  minFree   Decimal? @db.Decimal(10, 2)  // Mínimo para envío gratis
  isActive  Boolean  @default(true)
}

model Settings {
  id        String @id @default("singleton")
  storeName String @default("Katsuda")
  phone     String?
  whatsapp  String?
  email     String?
  address   Json?   // {mendoza: {...}, sanJuan: {...}}
  socialMedia Json? // {instagram, facebook}
  transferDiscount Int @default(9)  // % descuento transferencia
  schedules Json?   // Horarios de atención
}
```

---

## ÉPICA 2: Catálogo Público

### E2-S01: Home page (3 pts)

**Ruta**: `/`

**Secciones**:
1. Hero banner con slider (ofertas, novedades)
2. Propuestas de valor (Confiabilidad, Efectividad, Trayectoria)
3. Categorías destacadas (grid con imágenes)
4. Productos destacados/ofertas (carousel)
5. Marcas que trabajamos (logos)
6. Formulario de contacto rápido
7. Footer con info de sucursales

**Criterios de Aceptación**:
- [ ] Hero con imágenes rotativas
- [ ] Categorías con link a /categoria/[slug]
- [ ] Productos destacados clicables
- [ ] Responsive mobile-first
- [ ] Colores de Katsuda aplicados

### E2-S02: Listado de productos con filtros (5 pts)

**Ruta**: `/productos` y `/categoria/[slug]`

**Funcionalidades**:
- Grid de productos (3-4 columnas desktop, 2 mobile)
- Filtros laterales:
  - Categoría (árbol expandible)
  - Marca (checkboxes)
  - Precio (rango min-max)
  - Disponibilidad (en stock)
  - Envío gratis
- Ordenar por: Más vendidos, Precio menor, Precio mayor, Novedades
- Paginación o infinite scroll
- Contador de resultados

**Card de producto**:
- Imagen principal
- Badge "ENVÍO GRATIS" si aplica
- Badge "OFERTA" si tiene descuento
- Nombre del producto
- SKU
- Precio actual (destacado)
- Precio con transferencia (si hay descuento)
- Cuotas sin interés (calculado)
- Botón "Ver producto"

**Criterios de Aceptación**:
- [ ] Filtros funcionan correctamente
- [ ] URL actualiza con filtros (query params)
- [ ] Filtros persisten al navegar
- [ ] Loading skeleton mientras carga
- [ ] Empty state si no hay resultados

### E2-S03: Detalle de producto (5 pts)

**Ruta**: `/productos/[slug]`

**Layout**:
```
┌─────────────────────────────────────────────┐
│ Breadcrumb: Inicio > Categoría > Producto   │
├─────────────────────┬───────────────────────┤
│                     │ Marca + SKU            │
│   GALERÍA           │ NOMBRE PRODUCTO        │
│   [img principal]   │ $PRECIO                │
│   [thumbnails]      │ $XX.XXX con transfer.  │
│                     │ 3 cuotas de $XX.XXX    │
│                     │ ─────────────────────  │
│                     │ [- 1 +] [AGREGAR]      │
│                     │ ─────────────────────  │
│                     │ Calcular envío: [____] │
│                     │ 📍 Retiro en local     │
│                     │ 🚚 Envío a domicilio   │
│                     │ ─────────────────────  │
│                     │ Atributos:             │
│                     │ Color: Cromo           │
│                     │ Línea: Arizona Plus    │
├─────────────────────┴───────────────────────┤
│ DESCRIPCIÓN                                 │
│ Tabs: Descripción | Especificaciones        │
├─────────────────────────────────────────────┤
│ PRODUCTOS RELACIONADOS                      │
│ [card] [card] [card] [card]                 │
└─────────────────────────────────────────────┘
```

**Criterios de Aceptación**:
- [ ] Galería con zoom en hover
- [ ] Thumbnails navegables
- [ ] Selector de cantidad con validación stock
- [ ] Agregar al carrito funciona
- [ ] Calculadora de envío por CP
- [ ] Atributos del producto visibles
- [ ] Productos relacionados de misma categoría
- [ ] Meta tags para SEO
- [ ] Schema.org Product structured data

---

## ÉPICA 3: Carrito y Checkout

### E3-S01: Carrito de compras (4 pts)

**Ruta**: `/carrito`

**Funcionalidades**:
- Lista de productos en carrito
- Modificar cantidad (+ / -)
- Eliminar producto
- Subtotal por item
- Resumen: Subtotal, Envío, Total
- Botón "Continuar comprando"
- Botón "Finalizar compra"
- Carrito vacío con sugerencias

**Persistencia**:
- LocalStorage para carritos anónimos
- BD para usuarios logueados
- Merge al loguearse

**Criterios de Aceptación**:
- [ ] Carrito persiste entre sesiones
- [ ] Actualización en tiempo real
- [ ] Validación de stock disponible
- [ ] Mini-carrito en header

### E3-S02: Proceso de checkout (4 pts)

**Ruta**: `/checkout`

**Pasos**:
1. **Datos de contacto** (email, nombre, teléfono)
2. **Dirección de envío** (calle, número, ciudad, provincia, CP)
3. **Método de envío** (retiro local / envío a domicilio)
4. **Método de pago** (transferencia / efectivo en local / MercadoPago futuro)
5. **Confirmación** (resumen completo)

**Criterios de Aceptación**:
- [ ] Validación de formularios
- [ ] Cálculo de envío dinámico
- [ ] Resumen siempre visible
- [ ] Crear pedido en BD
- [ ] Reducir stock al confirmar
- [ ] Mostrar número de pedido

### E3-S03: Notificaciones de pedido (2 pts)

**Notificaciones por email**:
- Al cliente: Confirmación de pedido con detalle
- Al admin: Nuevo pedido recibido

**Notificación WhatsApp** (opcional):
- Al admin: Link a pedido en panel

**Criterios de Aceptación**:
- [ ] Email al cliente con resumen
- [ ] Email al admin con datos de contacto
- [ ] Templates HTML responsive

---

## ÉPICA 4: Panel Admin

### E4-S01: Login y dashboard admin (2 pts)

**Ruta**: `/admin`

**Dashboard**:
- Pedidos pendientes (últimas 24h)
- Ventas del día/semana/mes
- Productos con bajo stock
- Mensajes sin leer

**Criterios de Aceptación**:
- [ ] Login seguro con JWT
- [ ] Protección de rutas
- [ ] Stats básicas visibles

### E4-S02: CRUD de productos (5 pts)

**Ruta**: `/admin/productos`

**Funcionalidades**:
- Tabla con búsqueda y filtros
- Crear producto (formulario completo)
- Editar producto
- Duplicar producto
- Activar/desactivar producto
- Gestión de imágenes (upload, ordenar, eliminar)
- Importar/exportar CSV (futuro)

**Criterios de Aceptación**:
- [ ] Tabla paginada con búsqueda
- [ ] Formulario con validación
- [ ] Upload de múltiples imágenes
- [ ] Preview antes de guardar
- [ ] Generación automática de slug

### E4-S03: Gestión de pedidos (4 pts)

**Ruta**: `/admin/pedidos`

**Funcionalidades**:
- Lista de pedidos con filtros por estado
- Ver detalle del pedido
- Cambiar estado (confirmar, enviar, entregar)
- Agregar notas internas
- Ver historial de cambios

**Criterios de Aceptación**:
- [ ] Filtro por estado y fecha
- [ ] Detalle con datos de cliente
- [ ] Botones de acción según estado
- [ ] Notificación al cliente al cambiar estado

### E4-S04: Gestión de categorías y marcas (2 pts)

**Rutas**: `/admin/categorias`, `/admin/marcas`

**Criterios de Aceptación**:
- [ ] CRUD completo de categorías
- [ ] Categorías padre/hijo
- [ ] CRUD completo de marcas
- [ ] Ordenamiento drag & drop

---

## ÉPICA 5: Features Avanzadas

### E5-S01: Búsqueda de productos (3 pts)

**Funcionalidades**:
- Buscador en header (expandible)
- Búsqueda por: nombre, SKU, marca
- Sugerencias mientras escribe (autocomplete)
- Página de resultados con filtros

**Criterios de Aceptación**:
- [ ] Búsqueda instantánea
- [ ] Debounce para no saturar API
- [ ] Resaltado de término en resultados
- [ ] Historial de búsquedas recientes

### E5-S02: Calculadora de envío (3 pts)

**Funcionalidades**:
- Input de código postal
- Mostrar opciones:
  - Retiro gratis en local (Mendoza / San Juan)
  - Envío a domicilio con precio
  - Envío gratis si supera monto mínimo
- Integración con tabla de zonas

**Criterios de Aceptación**:
- [ ] Validación de CP argentino
- [ ] Zonas configurables desde admin
- [ ] Mensaje si no hay envío a esa zona

### E5-S03: Integración WhatsApp (2 pts)

**Funcionalidades**:
- Botón flotante WhatsApp
- Click abre chat con mensaje predefinido
- En producto: "Hola! Me interesa [producto] SKU [xxx]"
- En carrito: "Hola! Quiero consultar por mi carrito"

**Criterios de Aceptación**:
- [ ] Botón visible en mobile y desktop
- [ ] Mensaje incluye contexto
- [ ] Número configurable desde admin

---

## ÉPICA 6: SEO y Performance

### E6-S01: Meta tags y Open Graph (2 pts)

**Por página**:
- Title y description únicos
- Open Graph (imagen, título, descripción)
- Twitter Card
- Canonical URL

**Productos**:
- Schema.org Product con precio, stock, rating
- Breadcrumb schema
- Images con alt descriptivo

**Criterios de Aceptación**:
- [ ] Cada producto tiene meta tags únicos
- [ ] Previsualización correcta en redes
- [ ] Google Search Console sin errores

### E6-S02: Sitemap y robots.txt (1 pt)

**Archivos**:
- `/sitemap.xml` - Generado dinámicamente
- `/robots.txt` - Permite indexación

**Criterios de Aceptación**:
- [ ] Sitemap incluye productos y categorías
- [ ] Actualización automática
- [ ] Enviado a Google Search Console

### E6-S03: Optimización de imágenes (2 pts)

**Funcionalidades**:
- Conversión a WebP
- Lazy loading
- Responsive images (srcset)
- Placeholder blur mientras carga

**Criterios de Aceptación**:
- [ ] Lighthouse Performance > 90
- [ ] Imágenes optimizadas automáticamente
- [ ] No CLS (layout shift)

---

## ÉPICA 7: Deploy y Testing

### E7-S01: Configurar Easypanel (2 pts)

**Servicios**:
1. **katsuda-web** - Frontend Next.js
2. **katsuda-api** - Backend Express
3. **katsuda-db** - PostgreSQL (ya existe)

**Configuración**:
- Variables de entorno
- Dominio personalizado (futuro)
- SSL automático
- Health checks

**Criterios de Aceptación**:
- [ ] Frontend accesible
- [ ] API funcionando
- [ ] BD conectada
- [ ] Deploy automático desde Git

### E7-S02: Tests E2E básicos (3 pts)

**Flujos a testear**:
1. Navegar home → categoría → producto
2. Agregar producto al carrito
3. Completar checkout
4. Login admin → crear producto
5. Admin → cambiar estado pedido

**Criterios de Aceptación**:
- [ ] Tests pasan en CI
- [ ] Coverage de flujos críticos
- [ ] No regresiones en deploys

---

## Instrucciones para Ralph

### Al iniciar cada épica:

1. Leer este PRD completo
2. Verificar que épicas previas estén completas
3. Revisar el schema de BD necesario
4. Crear branch: `ralph/E#-descripcion`

### Al completar cada historia:

1. Verificar que compila: `pnpm build`
2. Verificar lint: `pnpm lint`
3. Probar manualmente con dev-browser
4. Commit: `feat(E#-S##): descripción`
5. Actualizar PRD con status
6. Continuar con siguiente historia

### Prioridades:

1. **FUNCIONALIDAD** primero, polish después
2. **RESPONSIVE** mobile-first
3. **PERFORMANCE** imágenes optimizadas
4. **UX** flujos simples y claros
5. **COLORES** mantener identidad Katsuda

### Colores CSS:

```css
:root {
  --katsuda-green-900: #1B5E20;
  --katsuda-green-700: #2E7D32;
  --katsuda-green-500: #4CAF50;
  --katsuda-green-100: #E8F5E9;
  --katsuda-orange: #FF6B35;  /* Accent para ofertas */
}
```

---

## Archivos de Referencia

| Recurso | Ubicación |
|---------|-----------|
| PRD | `/mnt/c/Users/samsung/Documents/GitHub/katsuda-store/PRD-KATSUDA.md` |
| Código | `/mnt/c/Users/samsung/Documents/GitHub/katsuda-store/` |
| Competencia | https://www.policuyo.com.ar |
| Referencia visual | http://www.katsuda.com.ar |
| BD | postgres://postgres:1bc6552dfa18bd68cd26@38.54.45.192:5433/katsuda |

---

*PRD creado: 2026-01-21*
*Estimación total: ~67 puntos*
*Deploy objetivo: Easypanel*

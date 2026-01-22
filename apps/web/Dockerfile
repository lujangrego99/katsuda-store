FROM node:20-alpine AS base

# Install dependencies for sharp (image optimization)
RUN apk add --no-cache libc6-compat

# Install pnpm (fixed version for stability)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (standalone, no workspace)
RUN pnpm install --ignore-workspace

FROM base AS builder
WORKDIR /app

# These env vars are passed by Easypanel during build
# Configure them in Easypanel's Environment Variables section
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure public folder exists
RUN mkdir -p public

# Build
ENV NEXT_TELEMETRY_DISABLED=1
RUN echo "Building with API_URL: $NEXT_PUBLIC_API_URL" && pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public folder (created in builder if didn't exist)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

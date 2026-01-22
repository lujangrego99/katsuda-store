FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json ./

# Install dependencies (standalone, no workspace)
RUN pnpm install --ignore-workspace

# Copy prisma schema first (for generate)
COPY src/prisma ./src/prisma

# Generate Prisma client
RUN npx prisma generate --schema=src/prisma/schema.prisma || true

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]

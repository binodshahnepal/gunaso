# Base stage
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:./prisma/dev.db"
RUN npx prisma generate
RUN npm run build

# Production runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3060

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/lib/seed-db.js ./src/lib/seed-db.js

EXPOSE 3060

# Synchronize database schema and start server
CMD ["sh", "-c", "npx prisma db push && node src/lib/seed-db.js && npm start -- -p 3060"]

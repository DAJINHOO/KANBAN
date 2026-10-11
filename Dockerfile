# ==================== Backend builder ====================
FROM node:20-slim AS backend-builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
RUN npm ci

COPY backend/prisma ./prisma
COPY backend/src ./src
RUN npx prisma generate

# ==================== Frontend builder ====================
FROM node:20-slim AS frontend-builder
WORKDIR /fe

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==================== Runtime ====================
FROM node:20-slim
WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl wget \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd -r app && useradd -r -g app app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/src ./src
COPY --from=frontend-builder /fe/dist ./frontend/dist

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
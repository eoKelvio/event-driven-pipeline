FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/monitoring-dashboard/package.json ./services/monitoring-dashboard/
RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY services/monitoring-dashboard/ ./services/monitoring-dashboard/
RUN npm run build -w packages/shared
RUN npm run build -w services/monitoring-dashboard

FROM node:22-alpine AS runner
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/monitoring-dashboard/package.json ./services/monitoring-dashboard/
RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist/ ./packages/shared/dist/
COPY --from=builder /app/services/monitoring-dashboard/.next/ ./services/monitoring-dashboard/.next/
COPY --from=builder /app/services/monitoring-dashboard/server.ts ./services/monitoring-dashboard/server.ts
COPY --from=builder /app/services/monitoring-dashboard/src/lib/ ./services/monitoring-dashboard/src/lib/

WORKDIR /app/services/monitoring-dashboard
EXPOSE 3000
CMD ["npx", "tsx", "server.ts"]

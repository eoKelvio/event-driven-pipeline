FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/webhook-service/package.json ./services/webhook-service/
RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY services/webhook-service/ ./services/webhook-service/
RUN npm run build -w packages/shared && npm run build -w services/webhook-service

FROM node:22-alpine AS runner
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/webhook-service/package.json ./services/webhook-service/
RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist/ ./packages/shared/dist/
COPY --from=builder /app/services/webhook-service/dist/ ./services/webhook-service/dist/

EXPOSE 9999
CMD ["node", "services/webhook-service/dist/main.js"]

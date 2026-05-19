FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/streaming-service/package.json ./services/streaming-service/
RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY services/streaming-service/ ./services/streaming-service/
RUN npm run build -w packages/shared && npm run build -w services/streaming-service

FROM node:22-alpine AS runner
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/streaming-service/package.json ./services/streaming-service/
RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist/ ./packages/shared/dist/
COPY --from=builder /app/services/streaming-service/dist/ ./services/streaming-service/dist/

EXPOSE 9997
CMD ["node", "services/streaming-service/dist/main.js"]

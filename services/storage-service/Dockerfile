FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/storage-service/package.json ./services/storage-service/
RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY services/storage-service/ ./services/storage-service/
RUN npm run build -w packages/shared && npm run build -w services/storage-service

FROM node:22-alpine AS runner
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/storage-service/package.json ./services/storage-service/
RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist/ ./packages/shared/dist/
COPY --from=builder /app/services/storage-service/dist/ ./services/storage-service/dist/

EXPOSE 9998
CMD ["node", "services/storage-service/dist/main.js"]

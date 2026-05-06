# Event-Driven Pipeline

A modern event-driven microservices pipeline built with TypeScript, Kafka, GraphQL, and WebSocket. This project implements a real-time data ingestion and consolidation system across three independent services, connected exclusively through asynchronous messaging.

## Architecture Overview

```
[HTTP Client]
     │ POST /person|account|card  (RSA-encrypted payload)
     ▼
[Webhook Service :9999]
     │ RSA decrypt → Zod validate → Kafka produce
     ▼
[Kafka: events.{person|account|card}.raw]
     │
     ▼
[Storage Service :9998]
     │ upsert PostgreSQL (event-time ordering guard)
     │ Kafka produce confirmation + consolidation trigger
     ▼
[Kafka: events.{entity}.stored  +  triggers.consolidation]
     │
     ▼
[Streaming Service :9997]
     │ query PostgreSQL → upsert MongoDB (consolidated schema)
     │ exposes GraphQL API
     ▼
[MongoDB] ◄── [GraphQL :9997/graphql]

[Monitoring Dashboard :3000]
     │ consumes all Kafka topics
     │ pushes events via WebSocket to browser
     ▼
[Real-time pipeline visualization]
```

## Services

### Webhook Service — `:9999`

Receives encrypted webhook events and publishes them to Kafka.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/person` | Ingests a person event |
| POST | `/account` | Ingests an account event |
| POST | `/card` | Ingests a card event |

All endpoints accept the same envelope:

| Field | Type | Description |
|-------|------|-------------|
| `time` | datetime | Event timestamp |
| `body` | string | RSA-encrypted payload |
| `event` | string | Event type identifier |

**Person payload (after decryption):**

| Field | Type | Description |
|-------|------|-------------|
| `person_id` | int | Unique person identifier |
| `name` | string | Full name |
| `email` | string | Email address |
| `gender` | string | Gender (`M` or `F`) |
| `birth_date` | date | Birth date (`YYYY/MM/DD`) |
| `address` | string | Residential address |
| `salary` | float | Monthly salary |
| `cpf` | string | Brazilian tax ID |

**Account payload (after decryption):**

| Field | Type | Description |
|-------|------|-------------|
| `account_id` | int | Unique account identifier |
| `status_id` | int | Account status |
| `due_day` | int | Payment due day |
| `person_id` | int | Owner person identifier |
| `balance` | float | Current balance |
| `available_balance` | float | Available balance |

**Card payload (after decryption):**

| Field | Type | Description |
|-------|------|-------------|
| `card_id` | int | Unique card identifier |
| `card_number` | string | Card number |
| `account_id` | int | Associated account |
| `status_id` | int | Card status |
| `limit` | float | Credit limit |
| `expiration_date` | string | Expiration date |

---

### Storage Service — `:9998`

Consumes Kafka events and persists them in PostgreSQL. Implements an event-time ordering guard on upserts — a record is only updated if the incoming event is newer than what is stored. After each successful write, publishes a confirmation event and a consolidation trigger.

**Kafka topics consumed:** `events.person.raw`, `events.account.raw`, `events.card.raw`

**Kafka topics produced:** `events.{entity}.stored`, `triggers.consolidation`

---

### Streaming Service — `:9997`

Consumes consolidation triggers from Kafka, fetches the latest state from PostgreSQL, and upserts a unified customer document in MongoDB. Exposes a **GraphQL API** for flexible querying of the consolidated data.

**Consolidated MongoDB schema:**

```json
{
  "cpf": "string",
  "nome": "string",
  "id_pessoa": 0,
  "email": "string",
  "genero": "string",
  "data_nascimento": "string",
  "endereco": "string",
  "salario": 0.0,
  "contas": [
    {
      "id_conta": 0,
      "status": 0,
      "dia_vencimento": 0,
      "saldo": 0.0,
      "saldo_disponivel": 0.0
    }
  ],
  "cartoes": [
    {
      "id_cartao": 0,
      "num_cartao": "string",
      "status": 0,
      "limite": 0.0,
      "data_expiracao": "string"
    }
  ]
}
```

**GraphQL endpoint:** `POST /graphql` (Apollo Server 4, Pothos schema builder)

---

### Monitoring Dashboard — `:3000`

Real-time pipeline visualization. Consumes all Kafka topics and streams events to the browser via **WebSocket** (Socket.io), displaying a live event feed and a visual representation of the pipeline flow.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (Node.js 22) |
| HTTP Framework | Fastify |
| Messaging | Apache Kafka (KRaft, no ZooKeeper) — KafkaJS |
| SQL Database | PostgreSQL — Drizzle ORM |
| NoSQL Database | MongoDB — Mongoose |
| GraphQL | Apollo Server 4 + Pothos |
| WebSocket | Socket.io |
| Frontend | Next.js 15 (App Router) |
| Tracing | OpenTelemetry + Jaeger |
| Metrics | Prometheus + Grafana |
| Testing | Vitest + Testcontainers |
| Validation | Zod |

---

## Kafka Topics

| Topic | Key | Direction |
|-------|-----|-----------|
| `events.person.raw` | cpf | Webhook → Storage |
| `events.account.raw` | person_id | Webhook → Storage |
| `events.card.raw` | account_id | Webhook → Storage |
| `events.person.stored` | cpf | Storage → Monitoring |
| `events.account.stored` | person_id | Storage → Monitoring |
| `events.card.stored` | account_id | Storage → Monitoring |
| `triggers.consolidation` | cpf | Storage → Streaming |

Partition keys ensure ordering — all events for the same entity are routed to the same partition.

---

## Infrastructure

All services run with **2 replicas** behind an **Nginx load balancer**.

**Application containers:**
```yaml
resources:
  limits:
    cpus: '0.25'
    memory: '512m'
```

**Infrastructure containers (Kafka, PostgreSQL, MongoDB):**
```yaml
resources:
  limits:
    cpus: '0.75'
    memory: '1536m'
```

Docker images are published to Docker Hub.

---

## Requirements

- **Unit tests:** ≥ 80% coverage per service (Vitest)
- **Integration tests:** Testcontainers (real Kafka + database instances)
- **Distributed tracing:** end-to-end trace from HTTP ingestion to MongoDB consolidation (Jaeger)
- **Metrics dashboards:** Pipeline Overview, Kafka Consumer Lag, Database Performance (Grafana)

---

## Running Locally

```bash
# Generate RSA keys
./scripts/generate-keys.sh

# Start all services
docker compose up

# Send test events
npx ts-node scripts/seed-events.ts

# Interfaces
# GraphQL Playground  →  http://localhost:9997/graphql
# Monitoring Dashboard → http://localhost:3000
# Grafana             →  http://localhost:3001
# Jaeger              →  http://localhost:16686
```

<div align="center">

# Event-Driven Pipeline

### Real-time microservices pipeline - Kafka · GraphQL · WebSocket

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js_22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_7-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

<br/>

> Implementation of [challenge.md](./challenge.md). See [Adaptations](#-adaptations-from-the-original-challenge) for what was extended and why.

<br/>

<a href="#architecture">Architecture</a> •
<a href="#services">Services</a> •
<a href="#tech-stack">Tech Stack</a> •
<a href="#kafka-topics">Kafka Topics</a> •
<a href="#getting-started">Getting Started</a> •
<a href="#testing">Testing</a> •
<a href="#monitoring">Monitoring</a>

</div>

---

## 📋 Table of Contents

- [🏗️ Architecture](#architecture)
- [⚙️ Services](#services)
  - [Webhook Service :9999](#webhook-service-9999)
  - [Storage Service :9998](#storage-service-9998)
  - [Streaming Service :9997](#streaming-service-9997)
  - [Monitoring Dashboard :3000](#monitoring-dashboard-3000)
- [🛠️ Tech Stack](#tech-stack)
- [📨 Kafka Topics](#kafka-topics)
- [🐳 Infrastructure](#infrastructure)
- [🚀 Getting Started](#getting-started)
- [🧪 Testing](#testing)
- [📊 Monitoring](#monitoring)
- [🔀 Adaptations from the Original Challenge](#adaptations)

---

<a id="architecture"></a>

## 🏗️ Architecture

The system ingests RSA-encrypted webhook events, persists them in PostgreSQL, consolidates the full customer hierarchy into MongoDB, and streams every step live to a monitoring dashboard. All services communicate exclusively through asynchronous Kafka messages.

```
[HTTP Client]
     │  POST /person|account|card  (RSA-encrypted payload)
     ▼
[Webhook Service :9999]
     │  RSA decrypt → Zod validate → Kafka produce
     ▼
[Kafka: events.{person|account|card}.raw]
     │
     ▼
[Storage Service :9998]
     │  upsert PostgreSQL (event-time ordering guard)
     │  produce confirmation + consolidation trigger
     ▼
[Kafka: events.{entity}.stored + triggers.consolidation]
     │
     ├──────────────────────────────────────┐
     ▼                                      ▼
[Streaming Service :9997]        [Monitoring Dashboard :3000]
     │  query PostgreSQL                    │  consumes all topics
     │  upsert MongoDB                      │  WebSocket → browser
     │  produce customer.stored             ▼
     ▼                             [Real-time pipeline view]
[MongoDB]
     │
     ▼
[Kafka: events.customer.stored]
     │
     ▼
[Monitoring Dashboard :3000]
```

Each of the three backend services runs as **2 replicas** behind an **Nginx** round-robin load balancer.

---

<a id="services"></a>

## ⚙️ Services

<a id="webhook-service-9999"></a>

### Webhook Service (:9999)

Receives RSA-encrypted webhook events, decrypts the payload, validates it with Zod, and publishes it to Kafka.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/person` | Ingests a person event |
| `POST` | `/account` | Ingests an account event |
| `POST` | `/card` | Ingests a card event |
| `POST` | `/dev/encrypt` | Encrypts any JSON body for local testing |
| `POST` | `/dev/encrypt/person` | Encrypts a person payload (fields pre-filled) |
| `POST` | `/dev/encrypt/account` | Encrypts an account payload (fields pre-filled) |
| `POST` | `/dev/encrypt/card` | Encrypts a card payload (fields pre-filled) |
| `GET` | `/` | Health check |
| `GET` | `/metrics` | Prometheus metrics |
| `GET` | `/docs` | Scalar API reference |

All ingestion endpoints accept a single-field envelope:

| Field | Type | Description |
|-------|------|-------------|
| `body` | string | RSA-OAEP encrypted payload (base64) |

`event_time` and `event` are set server-side and returned in the 202 response:

| Field | Type | Description |
|-------|------|-------------|
| `accepted` | boolean | Always `true` on success |
| `event` | string | Event type (`person.received`, `account.received`, `card.received`) |
| `event_time` | string | Server-side timestamp (ISO 8601) |

> 💡 Use `/dev/encrypt/person` (or `/account`, `/card`) to generate an encrypted `body` value, then paste it into the ingestion endpoint.

<details>
<summary>Payload schemas after decryption</summary>

**Person**

| Field | Type | Description |
|-------|------|-------------|
| `person_id` | int | Unique person identifier |
| `name` | string | Full name |
| `email` | string | Email address |
| `gender` | string | `M` or `F` |
| `birth_date` | date | `YYYY/MM/DD` |
| `address` | string | Residential address |
| `salary` | float | Monthly salary |
| `cpf` | string | Brazilian tax ID (11 digits, no mask) |

**Account**

| Field | Type | Description |
|-------|------|-------------|
| `account_id` | int | Unique account identifier |
| `status_id` | int | Account status |
| `due_day` | int | Payment due day |
| `person_id` | int | Owner person identifier |
| `balance` | float | Current balance |
| `available_balance` | float | Available balance |

**Card**

| Field | Type | Description |
|-------|------|-------------|
| `card_id` | int | Unique card identifier |
| `card_number` | string | Card number (16 digits, no spaces) |
| `account_id` | int | Associated account |
| `status_id` | int | Card status |
| `limit` | float | Credit limit |
| `expiration_date` | string | Expiration date (`MM/YYYY`) |

</details>

---

<a id="storage-service-9998"></a>

### Storage Service (:9998)

Consumes raw Kafka events and persists them in PostgreSQL. Every upsert includes an **event-time ordering guard**: a record is only updated when the incoming event is newer than what is already stored, ensuring correctness regardless of delivery order.

After each successful write the service emits two Kafka messages:
- `events.{entity}.stored`: confirmation that the entity was persisted
- `triggers.consolidation`: instructs the streaming service to re-consolidate the customer

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/person` | Upserts a person record |
| `POST` | `/account` | Upserts an account record |
| `POST` | `/card` | Upserts a card record |
| `GET` | `/` | Health check |
| `GET` | `/metrics` | Prometheus metrics |
| `GET` | `/docs` | Scalar API reference |

---

<a id="streaming-service-9997"></a>

### Streaming Service (:9997)

Consumes `triggers.consolidation` from Kafka. On each trigger it queries the full customer state from PostgreSQL (person + accounts + cards via LEFT JOIN), builds the hierarchical document, and upserts it into MongoDB. After each successful upsert it emits `events.customer.stored`, closing the observability loop.

Exposes a **GraphQL API** (Apollo Server 4 + Pothos) for querying the consolidated data.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/graphql` | GraphQL endpoint |
| `GET` | `/` | Health check |
| `GET` | `/metrics` | Prometheus metrics |

**Consolidated MongoDB document:**

```json
{
  "person_id": 1,
  "cpf": "string",
  "name": "string",
  "email": "string",
  "gender": "string",
  "birth_date": "YYYY-MM-DD",
  "address": "string",
  "salary": 0.0,
  "accounts": [
    {
      "account_id": 0,
      "status_id": 0,
      "due_day": 0,
      "balance": 0.0,
      "available_balance": 0.0,
      "cards": [
        {
          "card_id": 0,
          "card_number": "string",
          "status_id": 0,
          "limit": 0.0,
          "expiration_date": "string"
        }
      ]
    }
  ]
}
```

**Example GraphQL query:**

```graphql
query GetCustomer($cpf: String!) {
  customer(cpf: $cpf) {
    name
    email
    accounts {
      account_id
      balance
      cards {
        card_number
        limit
      }
    }
  }
}
```

---

<a id="monitoring-dashboard-3000"></a>

### Monitoring Dashboard (:3000)

A Next.js 15 application that subscribes to all Kafka topics and streams every pipeline event to the browser via Socket.io WebSocket. Displays a real-time event feed and per-entity storage counters.

| Topic consumed | Label in feed |
|----------------|---------------|
| `events.person.stored` | PERSON |
| `events.account.stored` | ACCOUNT |
| `events.card.stored` | CARD |
| `events.customer.stored` | MONGO DB |

---

<a id="tech-stack"></a>

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript / Node.js 22 |
| HTTP Framework | Fastify |
| Messaging | Apache Kafka (KRaft, no ZooKeeper) / KafkaJS |
| SQL Database | PostgreSQL 16 / Drizzle ORM |
| NoSQL Database | MongoDB 7 / Mongoose |
| GraphQL | Apollo Server 4 + Pothos schema builder |
| Real-time | Socket.io |
| Frontend | Next.js 15 (App Router) |
| Metrics | Prometheus + Grafana |
| Testing | Vitest (100% coverage) |
| Validation | Zod |
| Containerisation | Docker Compose + Nginx |

---

<a id="kafka-topics"></a>

## 📨 Kafka Topics

| Topic | Key | Producer → Consumer |
|-------|-----|---------------------|
| `events.person.raw` | `cpf` | Webhook → Storage |
| `events.account.raw` | `person_id` | Webhook → Storage |
| `events.card.raw` | `account_id` | Webhook → Storage |
| `events.person.stored` | `cpf` | Storage → Monitoring |
| `events.account.stored` | `person_id` | Storage → Monitoring |
| `events.card.stored` | `account_id` | Storage → Monitoring |
| `triggers.consolidation` | `person_id` | Storage → Streaming |
| `events.customer.stored` | `person_id` | Streaming → Monitoring |

Partition keys guarantee ordering: all events for the same entity land on the same partition.

---

<a id="infrastructure"></a>

## 🐳 Infrastructure

All three backend services run as **2 replicas** managed by an **Nginx** round-robin load balancer.

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

---

<a id="getting-started"></a>

## 🚀 Getting Started

### Prerequisites

- Docker + Docker Compose
- Node.js 22
- OpenSSL

### 1. Generate RSA keys

```bash
./scripts/generate-keys.sh
```

This creates `keys/private.pem` and `keys/public.pem`.

### 2. Configure environment

Create a `.env` file at the project root:

```env
POSTGRES_USER=pipeline
POSTGRES_PASSWORD=pipeline
POSTGRES_DB=pipeline

MONGO_USER=pipeline
MONGO_PASSWORD=pipeline
MONGO_DB=pipeline
```

### 3. Start all services

```bash
docker compose up --build
```

### 4. Send test events

The scripts under `scripts/` generate and post encrypted payloads to the webhook automatically.

```bash
# Generate a linked person + account + card
node scripts/generate-all.mjs

# Generate a single entity
node scripts/generate-person.mjs
node scripts/generate-account.mjs --person_id 123
node scripts/generate-card.mjs --account_id 456
```

### 5. Interfaces

| Interface | URL |
|-----------|-----|
| Monitoring Dashboard | http://localhost:3000 |
| Grafana | http://localhost:3001 (`admin / admin`) |
| GraphQL Playground | http://localhost:9997/graphql |
| Webhook API Docs | http://localhost:9999/docs |
| Storage API Docs | http://localhost:9998/docs |
| Prometheus | http://localhost:9090 |

---

<a id="testing"></a>

## 🧪 Testing

Each service has an independent Vitest setup with **100% code coverage** across all metrics (statements, branches, functions, lines).

```bash
# Run tests for a specific service
cd services/webhook-service && npx vitest run --coverage
cd services/storage-service && npx vitest run --coverage
cd services/streaming-service && npx vitest run --coverage
cd services/monitoring-dashboard && npx vitest run --coverage
```

All tests use mocks, no running infrastructure required.

---

<a id="monitoring"></a>

## 📊 Monitoring

**Grafana** (`http://localhost:3001`) is provisioned automatically with a **Pipeline Overview** dashboard covering:

| Panel | Metric |
|-------|--------|
| Webhook events received | By type and status |
| Storage upsert duration | By table |
| Streaming consolidation duration | Per trigger |
| Total events stored | Per entity |

**Monitoring Dashboard** (`http://localhost:3000`) provides a real-time view of every Kafka event as it flows through the pipeline, with per-entity counters updated live via WebSocket.

---

<a id="adaptations"></a>

## 🔀 Adaptations from the Original Challenge

The original requirements are preserved in [challenge.md](./challenge.md). The following changes were made to reflect technical learning and production-closer patterns:

| Area | Original requirement | What was implemented |
|------|----------------------|----------------------|
| **Streaming service API** | 3 REST endpoints (suggested) | GraphQL API with Apollo Server 4 + Pothos, more flexible for product consumption |
| **Monitoring** | "a monitoring panel" (tool of choice) | Full Next.js 15 service with Socket.io streaming every Kafka event to the browser in real time |
| **Consolidation flow** | Trigger → fetch SQL → store NoSQL | Explicit `triggers.consolidation` topic + `events.customer.stored` confirmation for a full observability loop |
| **Event ordering** | "respect event order" | `event_time` guard on all upserts; a record is only updated if the incoming event is newer than what is stored |
| **FK constraints** | Implied relational integrity | Removed to allow out-of-order event processing; the consolidation JOIN handles incomplete state gracefully |
| **Distributed tracing** | Not required | Jaeger was initially scoped but removed; no service was instrumented and it added overhead without value |
| **Test coverage** | >= 80% | 100% across all 4 services with comprehensive unit tests using mocks |
| **Integration tests** | Not required | Not implemented; unit coverage with mocks was prioritised and reached 100% |

---

<p align="center">
  <sub>Built with TypeScript · Kafka · PostgreSQL · MongoDB · Next.js</sub>
</p>

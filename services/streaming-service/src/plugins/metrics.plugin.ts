import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client'

declare module 'fastify' {
  interface FastifyInstance {
    metrics: {
      upsertTotal: Counter<'type'>
      consolidationDuration: Histogram
    }
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const registry = new Registry()
  collectDefaultMetrics({ register: registry })

  const upsertTotal = new Counter<'type'>({
    name: 'streaming_upsert_total',
    help: 'Total upserts into MongoDB by entity type',
    labelNames: ['type'],
    registers: [registry],
  })

  const consolidationDuration = new Histogram({
    name: 'streaming_consolidation_duration_seconds',
    help: 'Time spent consolidating events into MongoDB',
    registers: [registry],
  })

  fastify.decorate('metrics', { upsertTotal, consolidationDuration })

  fastify.get('/metrics', async (_, reply) => {
    reply.header('Content-Type', registry.contentType)
    return reply.send(await registry.metrics())
  })
})

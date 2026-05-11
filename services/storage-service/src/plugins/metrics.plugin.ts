import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client'

declare module 'fastify' {
  interface FastifyInstance {
    metrics: {
      eventsStored: Counter<'type' | 'status'>
      upsertDuration: Histogram<'table'>
    }
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const registry = new Registry()
  collectDefaultMetrics({ register: registry })

  const eventsStored = new Counter<'type' | 'status'>({
    name: 'storage_events_stored_total',
    help: 'Total events stored by type and status',
    labelNames: ['type', 'status'],
    registers: [registry],
  })

  const upsertDuration = new Histogram<'table'>({
    name: 'storage_upsert_duration_seconds',
    help: 'Upsert duration in seconds by table',
    labelNames: ['table'],
    registers: [registry],
  })

  fastify.decorate('metrics', { eventsStored, upsertDuration })

  fastify.get('/metrics', async (_, reply) => {
    reply.header('Content-Type', registry.contentType)
    return reply.send(await registry.metrics())
  })
})

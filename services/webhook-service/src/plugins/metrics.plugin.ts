import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client'

declare module 'fastify' {
  interface FastifyInstance {
    metrics: {
      eventsReceived: Counter<'type' | 'status'>
      decryptDuration: Histogram
    }
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const registry = new Registry()
  collectDefaultMetrics({ register: registry })

  const eventsReceived = new Counter<'type' | 'status'>({
    name: 'webhook_events_received_total',
    help: 'Total events received by type and status',
    labelNames: ['type', 'status'],
    registers: [registry],
  })

  const decryptDuration = new Histogram({
    name: 'webhook_decrypt_duration_seconds',
    help: 'RSA decrypt duration in seconds',
    registers: [registry],
  })

  fastify.decorate('metrics', { eventsReceived, decryptDuration })

  fastify.get('/metrics', async (_, reply) => {
    reply.header('Content-Type', registry.contentType)
    return reply.send(await registry.metrics())
  })
})

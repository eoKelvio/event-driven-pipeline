import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifyApiReference from '@scalar/fastify-api-reference'

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Storage Service',
        description: 'Persists entity events in PostgreSQL and triggers consolidation.',
        version: '1.0.0',
      },
      tags: [
        { name: 'Events', description: 'Upsert entity events into PostgreSQL' },
      ],
    },
  })

  await fastify.register(fastifyApiReference, {
    routePrefix: '/docs',
  })
})

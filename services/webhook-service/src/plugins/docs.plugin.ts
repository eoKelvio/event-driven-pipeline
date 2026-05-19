import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifyApiReference from '@scalar/fastify-api-reference'

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Webhook Service',
        description: 'Receives RSA-encrypted events and publishes them to Kafka.',
        version: '1.0.0',
      },
      tags: [
        { name: 'Events', description: 'Ingest encrypted webhook events' },
        { name: 'Dev', description: 'Local development utilities' },
      ],
    },
  })

  await fastify.register(fastifyApiReference, {
    routePrefix: '/docs',
  })
})

import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { startPersonConsumer } from '../consumers/person.consumer.js'
import { startAccountConsumer } from '../consumers/account.consumer.js'
import { startCardConsumer } from '../consumers/card.consumer.js'

export default fp(async (fastify: FastifyInstance) => {
  let consumers: Awaited<ReturnType<typeof startPersonConsumer>>[] = []

  fastify.addHook('onReady', async () => {
    consumers = await Promise.all([
      startPersonConsumer(fastify.kafka.client, fastify.db, fastify.kafka.producer, fastify.metrics),
      startAccountConsumer(fastify.kafka.client, fastify.db, fastify.kafka.producer, fastify.metrics),
      startCardConsumer(fastify.kafka.client, fastify.db, fastify.kafka.producer, fastify.metrics),
    ])
  })

  fastify.addHook('onClose', async () => {
    await Promise.all(consumers.map((c) => c.disconnect()))
  })
})

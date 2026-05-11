import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { startPersonConsumer } from '../consumers/person.consumer.js'
import { startAccountConsumer } from '../consumers/account.consumer.js'
import { startCardConsumer } from '../consumers/card.consumer.js'

export default fp(async (fastify: FastifyInstance) => {
  const consumers = await Promise.all([
    startPersonConsumer(fastify.kafka.client, fastify.db, fastify.kafka.producer),
    startAccountConsumer(fastify.kafka.client, fastify.db, fastify.kafka.producer),
    startCardConsumer(fastify.kafka.client, fastify.db, fastify.kafka.producer),
  ])

  fastify.addHook('onClose', async () => {
    await Promise.all(consumers.map((c) => c.disconnect()))
  })
})

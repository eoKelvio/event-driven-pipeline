import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { startPersonConsumer } from '../consumers/person.consumer.js'
import { startAccountConsumer } from '../consumers/account.consumer.js'
import { startCardConsumer } from '../consumers/card.consumer.js'

export default fp(async (fastify: FastifyInstance) => {
  const consumers = await Promise.all([
    startPersonConsumer(fastify.kafka),
    startAccountConsumer(fastify.kafka),
    startCardConsumer(fastify.kafka),
  ])

  fastify.addHook('onClose', async () => {
    await Promise.all(consumers.map((c) => c.disconnect()))
  })
})

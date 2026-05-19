import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { startConsolidationConsumer } from '../consumers/consolidation.consumer.js'

export default fp(async (fastify: FastifyInstance) => {
  let consumer: Awaited<ReturnType<typeof startConsolidationConsumer>> | null = null

  fastify.addHook('onReady', async () => {
    consumer = await startConsolidationConsumer(fastify.kafka.client, fastify.kafka.producer, fastify.pg, fastify.metrics)
  })

  fastify.addHook('onClose', async () => {
    await consumer?.disconnect()
  })
})

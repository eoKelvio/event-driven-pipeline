import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { Kafka, Producer } from 'kafkajs'
import { config } from '../config.js'

declare module 'fastify' {
  interface FastifyInstance {
    kafka: { producer: Producer }
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const kafka = new Kafka({
    clientId: 'webhook-service',
    brokers: config.kafkaBrokers,
  })

  const producer = kafka.producer()
  await producer.connect()

  fastify.decorate('kafka', { producer })

  fastify.addHook('onClose', async () => {
    await producer.disconnect()
  })
})

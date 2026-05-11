import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { Kafka } from 'kafkajs'
import { config } from '../config.js'

declare module 'fastify' {
  interface FastifyInstance {
    kafka: Kafka
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const kafka = new Kafka({ clientId: 'streaming-service', brokers: config.kafkaBrokers })

  fastify.decorate('kafka', kafka)
})

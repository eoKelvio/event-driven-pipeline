import { Kafka } from 'kafkajs'
import type { Server } from 'socket.io'
import { Topics } from '@pipeline/shared'
import { config } from './config.js'

export type PipelineEvent = {
  topic: string
  data: Record<string, unknown>
  timestamp: string
}

export async function startKafkaBridge(io: Server) {
  const kafka = new Kafka({ clientId: 'monitoring-dashboard', brokers: config.kafkaBrokers })
  const consumer = kafka.consumer({ groupId: 'monitoring-dashboard' })

  await consumer.connect()
  await consumer.subscribe({
    topics: [Topics.PERSON_STORED, Topics.ACCOUNT_STORED, Topics.CARD_STORED, Topics.CUSTOMER_STORED],
    fromBeginning: false,
  })

  consumer.on(consumer.events.CRASH, () => {
    process.exit(1)
  })

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return
      const event: PipelineEvent = {
        topic,
        data: JSON.parse(message.value.toString()),
        timestamp: new Date().toISOString(),
      }
      io.emit('pipeline:event', event)
    },
  })

  return consumer
}

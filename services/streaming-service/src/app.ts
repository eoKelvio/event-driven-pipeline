import Fastify from 'fastify'
import mongoPlugin from './plugins/mongo.plugin.js'
import kafkaPlugin from './plugins/kafka.plugin.js'
import consumersPlugin from './plugins/consumers.plugin.js'
import graphqlPlugin from './plugins/graphql.plugin.js'
import metricsPlugin from './plugins/metrics.plugin.js'

export async function buildApp() {
  const app = Fastify({ logger: true })

  await app.register(mongoPlugin)
  await app.register(kafkaPlugin)
  await app.register(metricsPlugin)
  await app.register(consumersPlugin)
  await app.register(graphqlPlugin)

  return app
}

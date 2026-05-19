import Fastify from 'fastify'
import { ZodError } from 'zod'
import dbPlugin from './plugins/db.plugin.js'
import kafkaPlugin from './plugins/kafka.plugin.js'
import metricsPlugin from './plugins/metrics.plugin.js'
import consumersPlugin from './plugins/consumers.plugin.js'
import docsPlugin from './plugins/docs.plugin.js'
import personRoute from './routes/person.route.js'
import accountRoute from './routes/account.route.js'
import cardRoute from './routes/card.route.js'

export async function buildApp() {
  const app = Fastify({ logger: true, pluginTimeout: 60000 })

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({ error: 'Validation Error', issues: error.issues })
    }
    app.log.error(error)
    return reply.status(500).send({ error: 'Internal Server Error' })
  })

  await app.register(docsPlugin)
  await app.register(dbPlugin)
  await app.register(kafkaPlugin)
  await app.register(metricsPlugin)
  await app.register(consumersPlugin)

  app.get('/', async (_request, reply) => reply.send({ status: 'ok' }))

  await app.register(personRoute)
  await app.register(accountRoute)
  await app.register(cardRoute)

  return app
}

import Fastify from 'fastify'
import { ZodError } from 'zod'
import kafkaPlugin from './plugins/kafka.plugin.js'
import metricsPlugin from './plugins/metrics.plugin.js'
import docsPlugin from './plugins/docs.plugin.js'
import personRoute from './routes/person.route.js'
import accountRoute from './routes/account.route.js'
import cardRoute from './routes/card.route.js'
import devRoute from './routes/dev.route.js'

export async function buildApp() {
  const app = Fastify({ logger: true })

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({ error: 'Validation Error', issues: error.issues })
    }
    app.log.error(error)
    return reply.status(500).send({ error: 'Internal Server Error' })
  })

  await app.register(docsPlugin)
  await app.register(kafkaPlugin)
  await app.register(metricsPlugin)

  app.get('/', async (_request, reply) => reply.send({ status: 'ok' }))

  await app.register(personRoute)
  await app.register(accountRoute)
  await app.register(cardRoute)
  await app.register(devRoute)

  return app
}

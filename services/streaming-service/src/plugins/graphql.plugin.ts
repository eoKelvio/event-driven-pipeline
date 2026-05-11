import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { ApolloServer } from '@apollo/server'
import fastifyApollo, { fastifyApolloDrainPlugin } from '@as-integrations/fastify'
import { schema } from '../graphql/schema.js'

export default fp(async (fastify: FastifyInstance) => {
  const server = new ApolloServer({
    schema,
    plugins: [fastifyApolloDrainPlugin(fastify)],
  })

  await server.start()
  await fastify.register(fastifyApollo(server))
})

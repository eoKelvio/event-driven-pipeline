import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import mongoose from 'mongoose'
import { config } from '../config.js'

export default fp(async (fastify: FastifyInstance) => {
  await mongoose.connect(config.mongoUrl)

  fastify.addHook('onClose', async () => {
    await mongoose.disconnect()
  })
})

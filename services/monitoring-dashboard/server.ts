import { createServer } from 'node:http'
import { Server } from 'socket.io'
import next from 'next'
import { startKafkaBridge } from './src/lib/kafka-bridge.js'
import { config } from './src/lib/config.js'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handler = app.getRequestHandler()

await app.prepare()

const httpServer = createServer(handler)
const io = new Server(httpServer)

await startKafkaBridge(io)

httpServer.listen(config.port, () => {
  console.log(`Monitoring dashboard running on http://localhost:${config.port}`)
})

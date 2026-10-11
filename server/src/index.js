import http from 'node:http'
import { Server } from 'socket.io'
import app from './app.js'
import env, { assertRequiredEnv } from './config/env.js'
import { connectDb } from './config/db.js'
import { setupSocket } from './socket/index.js'

async function bootstrap() {
  assertRequiredEnv()
  await connectDb(env.mongodbUri)

  const server = http.createServer(app)
  const io = new Server(server, {
    cors: {
      origin: env.clientOrigins,
      credentials: true,
    },
  })
  app.set('io', io)

  setupSocket(io)

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${env.port} is already in use. Stop the other process or change PORT.`)
      process.exit(1)
    }
    throw error
  })

  server.listen(env.port, env.host, () => {
    console.log(`ResolveX backend running on http://${env.host}:${env.port}`)
  })
}

bootstrap().catch((error) => {
  console.error('Failed to boot server', error)
  process.exit(1)
})

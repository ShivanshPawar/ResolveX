import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cookieParser from 'cookie-parser'
import { commonMiddlewares } from './middleware/security.js'
import apiRoutes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(...commonMiddlewares)

// All API routes
app.use('/api/v1', apiRoutes)

// Serve the SPA only when this process was deployed with its built client.
// A separately deployed API service must still run with NODE_ENV=production.
const clientDist = path.resolve(__dirname, '../../client/dist')
const clientEntry = path.join(clientDist, 'index.html')

if (process.env.NODE_ENV === 'production' && existsSync(clientEntry)) {
  app.use(express.static(clientDist))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(clientEntry)
  })
} else {
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'ResolveX API is running',
      health: '/api/v1/health',
    })
  })
  app.use(notFoundHandler)
}

app.use(errorHandler)

export default app

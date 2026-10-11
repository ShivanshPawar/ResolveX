import { StatusCodes } from 'http-status-codes'
import env from '../config/env.js'

export function notFoundHandler(req, res) {
  return res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
  const isProductionServerError =
    env.nodeEnv === 'production' && statusCode >= StatusCodes.INTERNAL_SERVER_ERROR

  return res.status(statusCode).json({
    success: false,
    message: isProductionServerError
      ? 'Internal server error'
      : err.message || 'Internal server error',
    details: isProductionServerError ? null : err.details || null,
  })
}

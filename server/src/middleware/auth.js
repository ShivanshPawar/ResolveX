import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError.js'
import { verifyAccessToken } from '../utils/tokens.js'
import User from '../models/User.js'

function extractBearerToken(authHeader = '') {
  if (!authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

export async function requireAuth(req, _res, next) {
  const token = req.cookies?.accessToken || extractBearerToken(req.headers.authorization)
  if (!token) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required'))
  }

  try {
    const payload = verifyAccessToken(token)
    const user = await User.findById(payload.sub).select('-passwordHash')
    if (!user) return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid session'))
    if (user.suspended) return next(new ApiError(StatusCodes.FORBIDDEN, 'Account suspended'))
    req.user = user
    return next()
  } catch (_error) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token'))
  }
}

export async function optionalAuth(req, _res, next) {
  const token = req.cookies?.accessToken || extractBearerToken(req.headers.authorization)
  if (!token) return next()

  try {
    const payload = verifyAccessToken(token)
    const user = await User.findById(payload.sub).select('-passwordHash')
    if (user && !user.suspended) req.user = user
  } catch {
    // Public issue reads should still work for visitors with no valid session.
  }

  return next()
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required'))
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(StatusCodes.FORBIDDEN, 'Insufficient permissions'))
    }
    return next()
  }
}

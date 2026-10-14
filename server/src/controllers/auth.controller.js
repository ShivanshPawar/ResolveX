import bcrypt from 'bcryptjs'
import { StatusCodes } from 'http-status-codes'
import env from '../config/env.js'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js'

const isProd = env.nodeEnv === 'production'

function tokenCookieOptions(maxAgeSec) {
  return {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    ...(maxAgeSec ? { maxAge: maxAgeSec * 1000 } : {}),
  }
}

function authPayload(user) {
  return {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
  }
}

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.validated.body
  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) throw new ApiError(StatusCodes.CONFLICT, 'Email already in use')

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ fullName, email: email.toLowerCase(), passwordHash })

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role })
  const refreshToken = signRefreshToken({ sub: user._id.toString() })

  res.cookie('accessToken', accessToken, tokenCookieOptions(24 * 60 * 60))
  res.cookie('refreshToken', refreshToken, tokenCookieOptions(7 * 24 * 60 * 60))

  return res.status(StatusCodes.CREATED).json({ success: true, data: authPayload(user) })
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password')

  const isMatch = await bcrypt.compare(password, user.passwordHash)
  if (!isMatch) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password')
  if (user.suspended)
    throw new ApiError(StatusCodes.FORBIDDEN, 'Account suspended. Contact support.')

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role })
  const refreshToken = signRefreshToken({ sub: user._id.toString() })

  res.cookie('accessToken', accessToken, tokenCookieOptions(24 * 60 * 60))
  res.cookie('refreshToken', refreshToken, tokenCookieOptions(7 * 24 * 60 * 60))

  return res.json({ success: true, data: authPayload(user) })
})

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token missing')
  const payload = verifyRefreshToken(token)
  const user = await User.findById(payload.sub)
  if (!user) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token')
  if (user.suspended) throw new ApiError(StatusCodes.FORBIDDEN, 'Account suspended')

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role })
  res.cookie('accessToken', accessToken, tokenCookieOptions(24 * 60 * 60))
  return res.json({ success: true })
})

export const me = asyncHandler(async (req, res) => {
  return res.json({ success: true, data: authPayload(req.user) })
})

export const logout = asyncHandler((_req, res) => {
  const clearOpts = { ...tokenCookieOptions(), maxAge: 0 }
  res.clearCookie('accessToken', clearOpts)
  res.clearCookie('refreshToken', clearOpts)
  return res.json({ success: true, message: 'Logged out' })
})

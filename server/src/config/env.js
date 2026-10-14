import dotenv from 'dotenv'

dotenv.config()

const cookieSameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase()
if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
  throw new Error('COOKIE_SAME_SITE must be one of: lax, strict, none')
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  host: process.env.HOST || '0.0.0.0',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  clientUrlExtra: process.env.CLIENT_URL_EXTRA || '',
  mongodbUri: process.env.MONGODB_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '24h',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  cookieSameSite,
  imagekitPublicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  imagekitPrivateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  imagekitUrlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
}

env.clientOrigins = [
  ...new Set([
    env.clientUrl,
    ...env.clientUrlExtra
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ]),
]

export function assertRequiredEnv() {
  const missing = []
  if (!env.mongodbUri) missing.push('MONGODB_URI')
  if (!env.jwtAccessSecret) missing.push('JWT_ACCESS_SECRET')
  if (!env.jwtRefreshSecret) missing.push('JWT_REFRESH_SECRET')
  if (!env.imagekitPublicKey) missing.push('IMAGEKIT_PUBLIC_KEY')
  if (!env.imagekitPrivateKey) missing.push('IMAGEKIT_PRIVATE_KEY')
  if (!env.imagekitUrlEndpoint) missing.push('IMAGEKIT_URL_ENDPOINT')
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`)
  }
}

export default env

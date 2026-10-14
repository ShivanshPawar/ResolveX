import bcrypt from 'bcryptjs'
import env from '../config/env.js'
import { connectDb } from '../config/db.js'
import User from '../models/User.js'

async function resetPassword() {
  const email = process.env.RESET_EMAIL?.trim().toLowerCase()
  const password = process.env.RESET_PASSWORD

  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is required for reset:password')
  }

  if (!email || !password || password.length < 8) {
    throw new Error('RESET_EMAIL and a RESET_PASSWORD of at least 8 characters are required')
  }

  await connectDb(env.mongodbUri)

  const user = await User.findOne({ email })
  if (!user) {
    throw new Error(`No user exists for ${email}`)
  }

  user.passwordHash = await bcrypt.hash(password, 12)
  await user.save()

  console.log(`Password reset for ${user.email}`)
}

resetPassword()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('reset:password failed', error.message)
    process.exit(1)
  })

import bcrypt from 'bcryptjs'
import env, { assertRequiredEnv } from '../config/env.js'
import { connectDb } from '../config/db.js'
import User from '../models/User.js'

async function seedAdmin() {
  assertRequiredEnv()
  await connectDb(env.mongodbUri)

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminName = process.env.ADMIN_NAME || 'ResolveX Admin'

  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required for seed:admin')
    process.exit(1)
  }

  const existing = await User.findOne({ email: adminEmail.toLowerCase() })
  if (existing) {
    existing.role = 'admin'
    existing.fullName = adminName
    await existing.save()

    console.log(`Updated existing user to admin: ${existing.email}`)
    process.exit(0)
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12)
  await User.create({
    email: adminEmail.toLowerCase(),
    fullName: adminName,
    passwordHash,
    role: 'admin',
    emailVerified: true,
  })

  console.log(`Created admin user: ${adminEmail.toLowerCase()}`)
  process.exit(0)
}

seedAdmin().catch((error) => {
  console.error('seed:admin failed', error)
  process.exit(1)
})

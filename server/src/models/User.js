import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
    avatarUrl: { type: String, default: '' },
    avatarFileId: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    bio: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
    suspended: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export default mongoose.model('User', userSchema)

import mongoose from 'mongoose'

const savedSearchSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    query: { type: String, required: true, trim: true },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    notifyNewResults: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export default mongoose.model('SavedSearch', savedSearchSchema)

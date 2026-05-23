import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type:    { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    read:    { type: Boolean, default: false },
    // Auto-delete read notifications after 24 hours
    expiresAt: {
      type: Date,
      default: null,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

// When marked read, set expiry to 24h from now
notificationSchema.pre("save", function (next) {
  if (this.isModified("read") && this.read && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

export default mongoose.model("Notification", notificationSchema);

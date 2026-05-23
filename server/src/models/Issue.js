import mongoose from "mongoose";

const issueImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    fileId: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
    name: { type: String, default: "" },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "in_review", "in_progress", "resolved", "rejected"],
      default: "new",
    },
    location: { type: String, required: true, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    locationGeo: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    images: { type: [issueImageSchema], default: [] },
    upvotes: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

issueSchema.index({ title: "text", description: "text", location: "text" });
issueSchema.index({ locationGeo: "2dsphere" });

export default mongoose.model("Issue", issueSchema);

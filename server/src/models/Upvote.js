import mongoose from "mongoose";

const upvoteSchema = new mongoose.Schema(
  {
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: "Issue", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

upvoteSchema.index({ issueId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Upvote", upvoteSchema);

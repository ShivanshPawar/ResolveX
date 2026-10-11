import { asyncHandler } from '../utils/asyncHandler.js'
import Issue from '../models/Issue.js'
import Upvote from '../models/Upvote.js'
import ApiError from '../utils/ApiError.js'
import { StatusCodes } from 'http-status-codes'
import { createNotification } from '../services/notification.service.js'

export const toggleUpvote = asyncHandler(async (req, res) => {
  const io = req.app.get('io')
  const issue = await Issue.findById(req.params.id)
  if (!issue) throw new ApiError(StatusCodes.NOT_FOUND, 'Issue not found')

  const existing = await Upvote.findOne({ issueId: issue._id, userId: req.user._id })

  if (existing) {
    await existing.deleteOne()
    const updated = await Issue.findByIdAndUpdate(
      issue._id,
      { $inc: { upvotes: -1 } },
      { new: true },
    )
    const count = Math.max(0, updated?.upvotes ?? 0)
    if (io)
      io.to(`issue:${issue._id}`).emit('upvote:changed', { issueId: issue._id, upvotes: count })
    return res.json({ success: true, data: { upvoted: false, upvotes: count } })
  }

  await Upvote.create({ issueId: issue._id, userId: req.user._id })
  const updated = await Issue.findByIdAndUpdate(issue._id, { $inc: { upvotes: 1 } }, { new: true })
  const count = updated?.upvotes ?? issue.upvotes + 1

  if (issue.reportedBy.toString() !== req.user._id.toString()) {
    await createNotification({
      userId: issue.reportedBy,
      type: 'issue_upvote',
      payload: {
        issueId: issue._id,
        actorUserId: req.user._id,
        actorName: req.user.fullName,
        upvotes: count,
        message: `${req.user.fullName} upvoted your issue "${issue.title}"`,
      },
      io,
    })
  }

  if (io) io.to(`issue:${issue._id}`).emit('upvote:changed', { issueId: issue._id, upvotes: count })
  return res.json({ success: true, data: { upvoted: true, upvotes: count } })
})

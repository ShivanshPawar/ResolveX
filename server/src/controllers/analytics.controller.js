import { asyncHandler } from "../utils/asyncHandler.js";
import Issue from "../models/Issue.js";

export const getAnalyticsSummary = asyncHandler(async (_req, res) => {
  const [totalIssues, openIssues, resolvedIssues] = await Promise.all([
    Issue.countDocuments(),
    Issue.countDocuments({ status: { $in: ["new", "in_review", "in_progress"] } }),
    Issue.countDocuments({ status: "resolved" }),
  ]);

  return res.json({
    success: true,
    data: {
      totalIssues,
      openIssues,
      resolvedIssues,
    },
  });
});

export const getIssueTrends = asyncHandler(async (req, res) => {
  const days = Math.max(1, Number(req.query.days || 30));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const trends = await Issue.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  return res.json({ success: true, data: trends });
});

export const getCategoryBreakdown = asyncHandler(async (_req, res) => {
  const breakdown = await Issue.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return res.json({ success: true, data: breakdown });
});

export const getStatusDistribution = asyncHandler(async (_req, res) => {
  const data = await Issue.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return res.json({ success: true, data });
});

export const getTopIssues = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
  const issues = await Issue.find()
    .sort({ upvotes: -1, commentsCount: -1, createdAt: -1 })
    .limit(limit)
    .select("title status category upvotes commentsCount createdAt");
  return res.json({ success: true, data: issues });
});

export const getResolutionMetrics = asyncHandler(async (_req, res) => {
  const data = await Issue.aggregate([
    { $match: { status: "resolved", resolvedAt: { $ne: null } } },
    {
      $project: {
        category: 1,
        resolutionHours: {
          $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60],
        },
      },
    },
    {
      $group: {
        _id: "$category",
        avgResolutionHours: { $avg: "$resolutionHours" },
        resolvedCount: { $sum: 1 },
      },
    },
    { $sort: { avgResolutionHours: 1 } },
  ]);
  return res.json({ success: true, data });
});

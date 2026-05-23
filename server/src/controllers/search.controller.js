import { asyncHandler } from "../utils/asyncHandler.js";
import Issue from "../models/Issue.js";
import SavedSearch from "../models/SavedSearch.js";

export const searchIssues = asyncHandler(async (req, res) => {
  const {
    query = "",
    category,
    status,
    sort = "relevance",
    startDate,
    endDate,
    page = "1",
    limit = "20",
  } = req.query;

  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const filter = {};
  if (query) filter.$text = { $search: query };
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const sortMap = {
    relevance: query ? { score: { $meta: "textScore" } } : { createdAt: -1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    upvotes: { upvotes: -1 },
  };

  let mongoQuery = Issue.find(filter);
  if (query) mongoQuery = mongoQuery.select({ score: { $meta: "textScore" } });

  const [results, total] = await Promise.all([
    mongoQuery
      .sort(sortMap[sort] || sortMap.relevance)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Issue.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    data: results,
    meta: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
  });
});

export const searchSuggestions = asyncHandler(async (req, res) => {
  const { q = "" } = req.query;
  if (!q.trim()) return res.json({ success: true, data: [] });
  const matches = await Issue.find({ $text: { $search: q } }).limit(5).select("title category location");
  return res.json({ success: true, data: matches });
});

export const createSavedSearch = asyncHandler(async (req, res) => {
  if (!req.body?.name || !req.body?.query) {
    return res.status(400).json({ success: false, message: "name and query are required" });
  }
  const saved = await SavedSearch.create({
    userId: req.user._id,
    name: req.body.name,
    query: req.body.query,
    filters: req.body.filters || {},
    notifyNewResults: Boolean(req.body.notifyNewResults),
  });
  return res.status(201).json({ success: true, data: saved });
});

export const listSavedSearches = asyncHandler(async (req, res) => {
  const searches = await SavedSearch.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return res.json({ success: true, data: searches });
});

export const deleteSavedSearch = asyncHandler(async (req, res) => {
  await SavedSearch.deleteOne({ _id: req.params.id, userId: req.user._id });
  return res.json({ success: true, message: "Saved search deleted" });
});

import { Router } from 'express'
import {
  getAnalyticsSummary,
  getCategoryBreakdown,
  getIssueTrends,
  getResolutionMetrics,
  getStatusDistribution,
  getTopIssues,
} from '../controllers/analytics.controller.js'

const router = Router()

router.get('/summary', getAnalyticsSummary)
router.get('/trends', getIssueTrends)
router.get('/categories', getCategoryBreakdown)
router.get('/status-distribution', getStatusDistribution)
router.get('/top-issues', getTopIssues)
router.get('/resolution-metrics', getResolutionMetrics)

export default router

import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  bulkModerateIssues,
  getAdminStats,
  listAdminIssues,
  listUsers,
  moderateIssue,
  setUserSuspended,
  updateUserRole,
} from '../controllers/admin.controller.js'
import {
  bulkModerateSchema,
  moderateIssueSchema,
  roleUpdateSchema,
  suspendUpdateSchema,
} from '../validators/admin.validator.js'

const router = Router()

router.use(requireAuth, requireRole('admin', 'moderator'))
router.get('/stats', getAdminStats)
router.get('/issues', listAdminIssues)
router.patch('/issues/:id', validate(moderateIssueSchema), moderateIssue)
router.post('/issues/bulk-moderate', validate(bulkModerateSchema), bulkModerateIssues)
router.get('/users', requireRole('admin'), listUsers)
router.patch('/users/:id/role', requireRole('admin'), validate(roleUpdateSchema), updateUserRole)
router.patch(
  '/users/:id/suspend',
  requireRole('admin'),
  validate(suspendUpdateSchema),
  setUserSuspended,
)

export default router

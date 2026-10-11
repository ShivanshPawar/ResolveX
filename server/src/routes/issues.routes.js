import { Router } from 'express'
import {
  createIssue,
  deleteIssue,
  deleteIssueImage,
  getIssueById,
  getNearbyIssues,
  listIssues,
  updateIssue,
  uploadIssueImages,
} from '../controllers/issues.controller.js'
import { toggleUpvote } from '../controllers/upvotes.controller.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { issueImagesUpload } from '../middleware/upload.js'
import {
  createIssueSchema,
  listIssuesSchema,
  updateIssueSchema,
} from '../validators/issue.validator.js'

const router = Router()

router.get('/', optionalAuth, validate(listIssuesSchema), listIssues)
router.get('/nearby/search', getNearbyIssues)
router.get('/:id', optionalAuth, getIssueById)
router.post('/', requireAuth, validate(createIssueSchema), createIssue)
router.patch('/:id', requireAuth, validate(updateIssueSchema), updateIssue)
router.delete('/:id', requireAuth, deleteIssue)
router.post('/:id/upvote', requireAuth, toggleUpvote)
router.post('/:id/images', requireAuth, issueImagesUpload.array('images', 5), uploadIssueImages)
router.delete('/:id/images/:fileId', requireAuth, deleteIssueImage)

export default router

import { Router } from 'express'
import {
  createComment,
  deleteComment,
  getCommentsByIssue,
  updateComment,
} from '../controllers/comments.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createCommentSchema, updateCommentSchema } from '../validators/comment.validator.js'

const router = Router()

router.get('/issue/:issueId', getCommentsByIssue)
router.post('/issue/:issueId', requireAuth, validate(createCommentSchema), createComment)
router.patch('/:id', requireAuth, validate(updateCommentSchema), updateComment)
router.delete('/:id', requireAuth, deleteComment)

export default router

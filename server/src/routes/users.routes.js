import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { issueImagesUpload } from '../middleware/upload.js'
import { validate } from '../middleware/validate.js'
import {
  changeMyPassword,
  getMyDashboard,
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
} from '../controllers/users.controller.js'
import { changePasswordSchema, updateProfileSchema } from '../validators/users.validator.js'

const router = Router()

router.use(requireAuth)
router.get('/me', getMyProfile)
router.patch('/me', validate(updateProfileSchema), updateMyProfile)
router.patch('/me/password', validate(changePasswordSchema), changeMyPassword)
router.post('/me/avatar', issueImagesUpload.single('avatar'), uploadMyAvatar)
router.get('/me/dashboard', getMyDashboard)

export default router

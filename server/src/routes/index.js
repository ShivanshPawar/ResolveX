import { Router } from 'express'
import authRoutes from './auth.routes.js'
import issueRoutes from './issues.routes.js'
import commentsRoutes from './comments.routes.js'
import usersRoutes from './users.routes.js'
import notificationsRoutes from './notifications.routes.js'
import searchRoutes from './search.routes.js'
import analyticsRoutes from './analytics.routes.js'
import adminRoutes from './admin.routes.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'ResolveX backend is healthy' })
})

router.use('/auth', authRoutes)
router.use('/issues', issueRoutes)
router.use('/comments', commentsRoutes)
router.use('/users', usersRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/search', searchRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/admin', adminRoutes)

export default router

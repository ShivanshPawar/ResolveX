import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createSavedSearch,
  deleteSavedSearch,
  listSavedSearches,
  searchIssues,
  searchSuggestions,
} from '../controllers/search.controller.js'
import {
  createSavedSearchSchema,
  deleteSavedSearchSchema,
  searchQuerySchema,
  suggestionsQuerySchema,
} from '../validators/search.validator.js'

const router = Router()

router.get('/', validate(searchQuerySchema), searchIssues)
router.get('/suggestions', validate(suggestionsQuerySchema), searchSuggestions)
router.get('/saved', requireAuth, listSavedSearches)
router.post('/saved', requireAuth, validate(createSavedSearchSchema), createSavedSearch)
router.delete('/saved/:id', requireAuth, validate(deleteSavedSearchSchema), deleteSavedSearch)

export default router

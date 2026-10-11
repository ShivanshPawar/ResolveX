import { z } from 'zod'

const objectIdRegex = /^[0-9a-fA-F]{24}$/

export const searchQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    query: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    sort: z.enum(['relevance', 'newest', 'oldest', 'upvotes']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
})

export const suggestionsQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    q: z.string().optional(),
  }),
})

export const createSavedSearchSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    query: z.string().min(1).max(200),
    filters: z.record(z.string(), z.any()).optional(),
    notifyNewResults: z.boolean().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const deleteSavedSearchSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(objectIdRegex),
  }),
  query: z.object({}).optional(),
})

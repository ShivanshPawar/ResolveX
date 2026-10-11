import { z } from 'zod'

const objectIdRegex = /^[0-9a-fA-F]{24}$/

export const moderateIssueSchema = z.object({
  body: z.object({
    status: z.enum(['new', 'in_review', 'in_progress', 'resolved', 'rejected']),
    rejectionReason: z.string().max(500).optional(),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex),
  }),
  query: z.object({}).optional(),
})

export const bulkModerateSchema = z.object({
  body: z.object({
    issueIds: z.array(z.string().regex(objectIdRegex)).min(1),
    status: z.enum(['new', 'in_review', 'in_progress', 'resolved', 'rejected']),
    rejectionReason: z.string().max(500).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const roleUpdateSchema = z.object({
  body: z.object({
    role: z.enum(['user', 'moderator', 'admin']),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex),
  }),
  query: z.object({}).optional(),
})

export const suspendUpdateSchema = z.object({
  body: z.object({
    suspended: z.boolean(),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex),
  }),
  query: z.object({}).optional(),
})

import { z } from 'zod'

export const updateProfileSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2).max(100).optional(),
      phone: z.string().min(6).max(20).optional(),
      address: z.string().max(250).optional(),
      bio: z.string().max(500).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

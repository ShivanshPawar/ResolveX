import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createIssueSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(140),
    description: z.string().min(10).max(2000),
    category: z.string().min(2).max(80),
    location: z.string().min(2).max(200),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateIssueSchema = z.object({
  body: z
    .object({
      title: z.string().min(5).max(140).optional(),
      description: z.string().min(10).max(2000).optional(),
      category: z.string().min(2).max(80).optional(),
      status: z.enum(["new", "in_review", "in_progress", "resolved", "rejected"]).optional(),
      location: z.string().min(2).max(200).optional(),
      latitude: z.number().min(-90).max(90).nullable().optional(),
      longitude: z.number().min(-180).max(180).nullable().optional(),
      rejectionReason: z.string().max(500).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, "At least one field is required"),
  params: z.object({
    id: z.string().regex(objectIdRegex),
  }),
  query: z.object({}).optional(),
});

export const listIssuesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(["newest", "oldest", "most_upvoted"]).optional(),
    userId: z.string().regex(objectIdRegex).optional(),
  }),
});

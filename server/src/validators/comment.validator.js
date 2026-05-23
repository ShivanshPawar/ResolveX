import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createCommentSchema = z.object({
  body: z.object({
    text: z.string().min(1).max(1000),
    parentId: z.string().regex(objectIdRegex).nullable().optional(),
  }),
  params: z.object({
    issueId: z.string().regex(objectIdRegex),
  }),
  query: z.object({}).optional(),
});

export const updateCommentSchema = z.object({
  body: z.object({
    text: z.string().min(1).max(1000),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex),
  }),
  query: z.object({}).optional(),
});

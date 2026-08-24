import { z } from 'zod';

export const scopeStatusEnum = z.enum(['IN_SCOPE', 'OUT_OF_SCOPE', 'NEEDS_REVIEW']);
export type ScopeStatus = z.infer<typeof scopeStatusEnum>;

export const aiRevisionItemSchema = z
  .object({
    description: z.string().trim().min(1, 'Item description cannot be empty'),
    scope: scopeStatusEnum,
    reason: z.string().trim().min(1, 'Reason cannot be empty').optional(),
  })
  .strict()
  .superRefine((item, ctx) => {
    if ((item.scope === 'OUT_OF_SCOPE' || item.scope === 'NEEDS_REVIEW') && !item.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Reason is required when scope is ${item.scope}`,
        path: ['reason'],
      });
    }
  })
  .transform((item) => ({
    description: item.description,
    category: null,
    scopeStatus: item.scope,
    reason: item.reason ?? null,
  }));

export const aiResponseSchema = z.object({
  summary: z.string().trim().min(1, 'Summary cannot be empty'),
  items: z
    .array(aiRevisionItemSchema)
    .min(1, 'AI output must contain at least one revision item'),
}).strict();

export type AIResponseOutput = z.infer<typeof aiResponseSchema>;
export type AIRevisionItemOutput = z.infer<typeof aiRevisionItemSchema>;

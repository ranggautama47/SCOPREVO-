import { z } from 'zod';

export const createRevisionSchema = z.object({
  rawInput: z.string().trim().min(1, 'rawInput must not be empty'),
});

export type CreateRevisionInput = z.infer<typeof createRevisionSchema>;

export const resolveItemScopeSchema = z.object({
  scopeStatus: z.enum(['IN_SCOPE', 'OUT_OF_SCOPE']),
  reason: z.string().trim().min(1).optional(),
}).refine(
  (value) => {
    if (value.scopeStatus === 'OUT_OF_SCOPE') {
      return !!value.reason && value.reason.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Reason is required for OUT_OF_SCOPE.',
    path: ['reason'],
  },
);

export type ResolveItemScopeInput = z.infer<typeof resolveItemScopeSchema>;

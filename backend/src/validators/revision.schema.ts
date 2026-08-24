import { z } from 'zod';

export const createRevisionSchema = z.object({
  rawInput: z.string().trim().min(1, 'rawInput must not be empty'),
});

export type CreateRevisionInput = z.infer<typeof createRevisionSchema>;

import { z } from 'zod';
export const createProjectSchema = z.object({
  name: z.string({ required_error: 'Project name is required.' }).min(1).max(200),
  clientName: z.string({ required_error: 'Client name is required.' }).min(1).max(200),
  totalAllowedRevisions: z.number().int().min(1).max(100).optional().default(3),
});
export const updateProjectSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    clientName: z.string().min(1).max(200).optional(),
    totalAllowedRevisions: z.number().int().min(1).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update.',
  });
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

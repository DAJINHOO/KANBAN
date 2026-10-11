import { z } from 'zod';

export const boardJoinSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
});
export const cardMoveSchema = z.object({
  cardId: z.string().uuid(),
  toColumnId: z.string().uuid(),
  toPosition: z.number().int().min(0),
});
export const cardEditingSchema = z.object({
  cardId: z.string().uuid(),
  projectId: z.string().uuid(),
});
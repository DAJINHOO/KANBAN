import { z } from 'zod';

const createSchema = z.object({
  content: z.string().min(1).max(1000),
  userId: z.string().uuid(),
});

export function commentController(commentService, io) {
  return {
    create: async (req, res, next) => {
      try {
        const { content, userId } = createSchema.parse(req.body);
        const { comment, card } = await commentService.create({
          content, cardId: req.params.cardId, userId,
        });
        io.to(`project:${card.projectId}`).emit('comment:new', {
          cardId: card.id, comment,
        });
        io.to(`project:${card.projectId}`).emit('notification', {
          type: 'COMMENT',
          message: `${comment.user.name} comentou em "${card.title}"`,
          cardId: card.id,
        });
        res.status(201).json(comment);
      } catch (e) { next(e); }
    },
    list: async (req, res, next) => {
      try { res.json(await commentService.listByCard(req.params.cardId)); }
      catch (e) { next(e); }
    },
  };
}
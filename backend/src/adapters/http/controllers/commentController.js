import { z } from 'zod';

const createSchema = z.object({
  content: z.string().min(1).max(1000),
  userId: z.string().uuid(),
});

const updateSchema = z.object({
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
      try {
        res.json(await commentService.listByCard(req.params.cardId));
      } catch (e) { next(e); }
    },

    getById: async (req, res, next) => {
      try {
        res.json(await commentService.getById(req.params.id));
      } catch (e) { next(e); }
    },

    update: async (req, res, next) => {
      try {
        const { content, userId } = updateSchema.parse(req.body);
        const { comment, cardId } = await commentService.update(req.params.id, {
          content, userId,
        });
        io.to(`project:${comment.card.projectId}`).emit('comment:updated', {
          cardId, comment,
        });
        res.json(comment);
      } catch (e) { next(e); }
    },

    remove: async (req, res, next) => {
      try {
        const { userId } = z.object({ userId: z.string().uuid() }).parse(req.body);
        const { cardId, projectId } = await commentService.remove(req.params.id, userId);
        if (projectId) {
          io.to(`project:${projectId}`).emit('comment:deleted', {
            cardId,
            commentId: req.params.id,
          });
        }
        res.status(204).send();
      } catch (e) { next(e); }
    },
  };
}
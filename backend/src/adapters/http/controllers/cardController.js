import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  columnId: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  position: z.number().int().min(0).default(0),
});
const moveSchema = z.object({
  toColumnId: z.string().uuid(),
  toPosition: z.number().int().min(0),
  userId: z.string().uuid(),
});
const updateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional(),
  userId: z.string().uuid(),
});

export function cardController(cardService, io) {
  return {
    create: async (req, res, next) => {
      try {
        const data = createSchema.parse(req.body);
        const card = await cardService.create(data);
        io.to(`project:${data.projectId}`).emit('card:created', card);
        res.status(201).json(card);
      } catch (e) { next(e); }
    },
    update: async (req, res, next) => {
      try {
        const { userId, ...rest } = updateSchema.parse(req.body);
        const card = await cardService.update(req.params.id, rest, userId);
        io.to(`project:${card.projectId}`).emit('card:updated', card);
        res.json(card);
      } catch (e) { next(e); }
    },
    remove: async (req, res, next) => {
      try {
        const card = await cardService.getById(req.params.id);
        await cardService.delete(req.params.id);
        if (card) io.to(`project:${card.projectId}`).emit('card:deleted', { id: req.params.id });
        res.status(204).send();
      } catch (e) { next(e); }
    },
    move: async (req, res, next) => {
      try {
        const { toColumnId, toPosition, userId } = moveSchema.parse(req.body);
        const card = await cardService.move(req.params.id, toColumnId, toPosition, userId);
        io.to(`project:${card.projectId}`).emit('card:moved', {
          cardId: card.id,
          toColumnId: card.columnId,
          toPosition: card.position,
          movedBy: userId,
        });
        res.json(card);
      } catch (e) { next(e); }
    },
    getById: async (req, res, next) => {
      try {
        const card = await cardService.getById(req.params.id);
        if (!card) return res.status(404).json({ error: { status: 404, message: 'Card não encontrado' } });
        res.json(card);
      } catch (e) { next(e); }
    },
  };
}
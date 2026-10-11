import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  ownerId: z.string().uuid(),
});
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  name: z.string().optional(),
});

export function projectController(projectService) {
  return {
    create: async (req, res, next) => {
      try { res.status(201).json(await projectService.create(createSchema.parse(req.body))); }
      catch (e) { next(e); }
    },
    list: async (req, res, next) => {
      try { res.json(await projectService.list(querySchema.parse(req.query))); }
      catch (e) { next(e); }
    },
    board: async (req, res, next) => {
      try { res.json(await projectService.getBoard(req.params.id)); }
      catch (e) { next(e); }
    },
    join: async (req, res, next) => {
      try {
        const { userId } = z.object({ userId: z.string().uuid() }).parse(req.body);
        res.json(await projectService.join(req.params.id, userId));
      } catch (e) { next(e); }
    },
    update: async (req, res, next) => {
      try { res.json(await projectService.update(req.params.id, req.body)); }
      catch (e) { next(e); }
    },
    remove: async (req, res, next) => {
      try { await projectService.remove(req.params.id); res.status(204).send(); }
      catch (e) { next(e); }
    },
  };
}
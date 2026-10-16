import { z } from 'zod';

const identifySchema = z.object({
  name: z.string().min(2).max(60),
});

const updateSchema = z.object({
  name: z.string().min(2).max(60),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  name: z.string().optional(),
});

export function userController(userService) {
  return {
    identify: async (req, res, next) => {
      try {
        const { name } = identifySchema.parse(req.body);
        const user = await userService.identify(name);
        res.status(201).json(user);
      } catch (e) { next(e); }
    },

    list: async (req, res, next) => {
      try {
        const query = querySchema.parse(req.query);
        res.json(await userService.list(query));
      } catch (e) { next(e); }
    },

    getById: async (req, res, next) => {
      try {
        res.json(await userService.getById(req.params.id));
      } catch (e) { next(e); }
    },

    update: async (req, res, next) => {
      try {
        const { name } = updateSchema.parse(req.body);
        res.json(await userService.update(req.params.id, { name }));
      } catch (e) { next(e); }
    },

    remove: async (req, res, next) => {
      try {
        await userService.remove(req.params.id);
        res.status(204).send();
      } catch (e) { next(e); }
    },
  };
}
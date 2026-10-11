import { z } from 'zod';

const identifySchema = z.object({ name: z.string().min(2).max(60) });

export function userController(userService) {
  return {
    identify: async (req, res, next) => {
      try {
        const parsed = identifySchema.parse(req.body);
        const user = await userService.identify(parsed.name);
        res.status(201).json(user);
      } catch (e) { next(e); }
    },
    list: async (_req, res, next) => {
      try { res.json(await userService.list()); } catch (e) { next(e); }
    },
  };
}
import { Router } from 'express';
import {
  userService, projectService, cardService, commentService,
} from '../../../config/container.js';
import { userController } from '../controllers/userController.js';
import { projectController } from '../controllers/projectController.js';
import { cardController } from '../controllers/cardController.js';
import { commentController } from '../controllers/commentController.js';

export function createRoutes(io) {
  const router = Router();
  const u = userController(userService);
  const p = projectController(projectService);
  const c = cardController(cardService, io);
  const cm = commentController(commentService, io);

  /**
   * @openapi
   * /api/users:
   *   post:
   *     tags: [Users]
   *     summary: Identifica um participante pelo nome
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties: { name: { type: string } }
   *     responses:
   *       201: { description: Usuário criado }
   */
  router.post('/users', u.identify);
  router.get('/users', u.list);

  /**
   * @openapi
   * /api/projects:
   *   get:
   *     tags: [Projects]
   *     summary: Lista projetos paginados
   *     parameters:
   *       - { in: query, name: page, schema: { type: integer } }
   *       - { in: query, name: limit, schema: { type: integer } }
   *       - { in: query, name: name, schema: { type: string } }
   *     responses:
   *       200: { description: Lista de projetos }
   *   post:
   *     tags: [Projects]
   *     summary: Cria projeto
   *     responses:
   *       201: { description: Criado }
   */
  router.post('/projects', p.create);
  router.get('/projects', p.list);
  router.get('/projects/:id/board', p.board);
  router.post('/projects/:id/join', p.join);
  router.put('/projects/:id', p.update);
  router.delete('/projects/:id', p.remove);

  /**
   * @openapi
   * /api/cards:
   *   post:
   *     tags: [Cards]
   *     summary: Cria cartão
   *     responses: { 201: { description: Criado } }
   */
  router.post('/cards', c.create);
  router.get('/cards/:id', c.getById);
  router.put('/cards/:id', c.update);
  router.delete('/cards/:id', c.remove);

  /**
   * @openapi
   * /api/cards/{id}/move:
   *   post:
   *     tags: [Cards]
   *     summary: Move cartão e emite evento em tempo real
   *     responses: { 200: { description: Movido } }
   */
  router.post('/cards/:id/move', c.move);

  /**
   * @openapi
   * /api/cards/{cardId}/comments:
   *   post:
   *     tags: [Comments]
   *     summary: Cria comentário no cartão
   *     responses: { 201: { description: Criado } }
   *   get:
   *     tags: [Comments]
   *     summary: Lista comentários
   *     responses: { 200: { description: Lista } }
   */
  router.post('/cards/:cardId/comments', cm.create);
  router.get('/cards/:cardId/comments', cm.list);

  return router;
}
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

  // ================================================================
  // USERS
  // ================================================================

  /**
   * @openapi
   * /api/users:
   *   post:
   *     tags: [Users]
   *     summary: Identifica (ou cria) um participante pelo nome
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name]
   *             properties:
   *               name: { type: string, minLength: 2, maxLength: 60, example: Ana }
   *     responses:
   *       201: { description: Usuário criado }
   *       400: { description: Dados inválidos }
   *   get:
   *     tags: [Users]
   *     summary: Lista usuários com paginação
   *     parameters:
   *       - { in: query, name: page, schema: { type: integer, default: 1 } }
   *       - { in: query, name: limit, schema: { type: integer, default: 10 } }
   *       - { in: query, name: name, schema: { type: string }, description: filtro por nome (parcial) }
   *     responses:
   *       200: { description: Lista paginada }
   */
  router.post('/users', u.identify);
  router.get('/users', u.list);

  /**
   * @openapi
   * /api/users/{id}:
   *   get:
   *     tags: [Users]
   *     summary: Busca um usuário por id
   *     parameters:
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     responses:
   *       200: { description: Encontrado }
   *       404: { description: Não encontrado }
   *   put:
   *     tags: [Users]
   *     summary: Renomeia um usuário
   *     parameters:
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name]
   *             properties:
   *               name: { type: string, minLength: 2, maxLength: 60 }
   *     responses:
   *       200: { description: Atualizado }
   *       404: { description: Não encontrado }
   *   delete:
   *     tags: [Users]
   *     summary: Remove um usuário
   *     parameters:
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     responses:
   *       204: { description: Removido }
   *       404: { description: Não encontrado }
   */
  router.get('/users/:id', u.getById);
  router.put('/users/:id', u.update);
  router.delete('/users/:id', u.remove);

  // ================================================================
  // PROJECTS
  // ================================================================

  /**
   * @openapi
   * /api/projects:
   *   post:
   *     tags: [Projects]
   *     summary: Cria um projeto (e colunas padrão)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, ownerId]
   *             properties:
   *               name: { type: string, minLength: 2, maxLength: 80 }
   *               description: { type: string, maxLength: 500 }
   *               ownerId: { type: string, format: uuid }
   *     responses:
   *       201: { description: Criado }
   *       400: { description: Dados inválidos }
   *   get:
   *     tags: [Projects]
   *     summary: Lista projetos com paginação
   *     parameters:
   *       - { in: query, name: page, schema: { type: integer, default: 1 } }
   *       - { in: query, name: limit, schema: { type: integer, default: 10 } }
   *       - { in: query, name: name, schema: { type: string } }
   *     responses:
   *       200: { description: Lista paginada }
   */
  router.post('/projects', p.create);
  router.get('/projects', p.list);

  /**
   * @openapi
   * /api/projects/{id}/board:
   *   get:
   *     tags: [Projects]
   *     summary: Retorna o quadro completo (colunas + cartões + membros)
   *     parameters:
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     responses:
   *       200: { description: Quadro }
   *       404: { description: Não encontrado }
   */
  router.get('/projects/:id/board', p.board);

  /**
   * @openapi
   * /api/projects/{id}/join:
   *   post:
   *     tags: [Projects]
   *     summary: Adiciona o usuário como membro do projeto
   *     parameters:
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [userId]
   *             properties:
   *               userId: { type: string, format: uuid }
   *     responses:
   *       200: { description: Quadro atualizado }
   */
  router.post('/projects/:id/join', p.join);

  /**
   * @openapi
   * /api/projects/{id}:
   *   put:
   *     tags: [Projects]
   *     summary: Atualiza um projeto
   *     parameters:
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     responses:
   *       200: { description: Atualizado }
   *   delete:
   *     tags: [Projects]
   *     summary: Remove um projeto
   *     parameters:
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     responses:
   *       204: { description: Removido }
   */
  router.put('/projects/:id', p.update);
  router.delete('/projects/:id', p.remove);

  // ================================================================
  // CARDS
  // ================================================================

  /**
   * @openapi
   * /api/cards:
   *   get:
   *     tags: [Cards]
   *     summary: Lista cartões com paginação e filtros
   *     parameters:
   *       - { in: query, name: page, schema: { type: integer, default: 1 } }
   *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
   *       - { in: query, name: projectId, schema: { type: string, format: uuid } }
   *       - { in: query, name: columnId, schema: { type: string, format: uuid } }
   *       - { in: query, name: assigneeId, schema: { type: string, format: uuid } }
   *       - { in: query, name: title, schema: { type: string } }
   *     responses:
   *       200: { description: Lista paginada }
   *   post:
   *     tags: [Cards]
   *     summary: Cria um cartão
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [title, columnId, projectId, userId]
   *             properties:
   *               title: { type: string, minLength: 2, maxLength: 120 }
   *               description: { type: string, maxLength: 1000 }
   *               columnId: { type: string, format: uuid }
   *               projectId: { type: string, format: uuid }
   *               userId: { type: string, format: uuid }
   *               position: { type: integer, minimum: 0, default: 0 }
   *     responses:
   *       201: { description: Criado }
   *       400: { description: Dados inválidos }
   */
  router.get('/cards', c.list);
  router.post('/cards', c.create);

  /**
   * @openapi
   * /api/cards/{id}:
   *   get:
   *     tags: [Cards]
   *     summary: Busca um cartão por id
   *     parameters:
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     responses:
   *       200: { description: Encontrado }
   *       404: { description: Não encontrado }
   *   put:
   *     tags: [Cards]
   *     summary: Atualiza título/descrição de um cartão
   *     parameters:
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     responses:
   *       200: { description: Atualizado }
   *   delete:
   *     tags: [Cards]
   *     summary: Remove um cartão
   *     parameters:
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     responses:
   *       204: { description: Removido }
   */
  router.get('/cards/:id', c.getById);
  router.put('/cards/:id', c.update);
  router.delete('/cards/:id', c.remove);

  /**
   * @openapi
   * /api/cards/{id}/move:
   *   post:
   *     tags: [Cards]
   *     summary: Move um cartão (transacional, emite evento WebSocket)
   *     parameters:
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [toColumnId, toPosition, userId]
   *             properties:
   *               toColumnId: { type: string, format: uuid }
   *               toPosition: { type: integer, minimum: 0 }
   *               userId: { type: string, format: uuid }
   *     responses:
   *       200: { description: Movido }
   *       404: { description: Cartão não encontrado }
   */
  router.post('/cards/:id/move', c.move);

  // ================================================================
  // COMMENTS (aninhado em cards)
  // ================================================================

  /**
   * @openapi
   * /api/cards/{cardId}/comments:
   *   post:
   *     tags: [Comments]
   *     summary: Cria um comentário em um cartão
   *     parameters:
   *       - { in: path, name: cardId, required: true, schema: { type: string, format: uuid } }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [content, userId]
   *             properties:
   *               content: { type: string, minLength: 1, maxLength: 1000 }
   *               userId: { type: string, format: uuid }
   *     responses:
   *       201: { description: Criado }
   *       404: { description: Cartão não encontrado }
   *   get:
   *     tags: [Comments]
   *     summary: Lista comentários de um cartão
   *     parameters:
   *       - { in: path, name: cardId, required: true, schema: { type: string, format: uuid } }
   *     responses:
   *       200: { description: Lista }
   */
  router.post('/cards/:cardId/comments', cm.create);
  router.get('/cards/:cardId/comments', cm.list);

  /**
   * @openapi
   * /api/cards/{cardId}/comments/{id}:
   *   get:
   *     tags: [Comments]
   *     summary: Busca um comentário por id
   *     parameters:
   *       - { in: path, name: cardId, required: true, schema: { type: string, format: uuid } }
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     responses:
   *       200: { description: Encontrado }
   *       404: { description: Não encontrado }
   *   put:
   *     tags: [Comments]
   *     summary: Edita o texto de um comentário
   *     parameters:
   *       - { in: path, name: cardId, required: true, schema: { type: string, format: uuid } }
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [content, userId]
   *             properties:
   *               content: { type: string, minLength: 1, maxLength: 1000 }
   *               userId: { type: string, format: uuid }
   *     responses:
   *       200: { description: Atualizado }
   *   delete:
   *     tags: [Comments]
   *     summary: Remove um comentário
   *     parameters:
   *       - { in: path, name: cardId, required: true, schema: { type: string, format: uuid } }
   *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [userId]
   *             properties:
   *               userId: { type: string, format: uuid }
   *     responses:
   *       204: { description: Removido }
   */
  router.get('/cards/:cardId/comments/:id', cm.getById);
  router.put('/cards/:cardId/comments/:id', cm.update);
  router.delete('/cards/:cardId/comments/:id', cm.remove);

  return router;
}
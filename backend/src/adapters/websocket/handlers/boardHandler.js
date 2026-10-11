import {
  boardJoinSchema, cardMoveSchema, cardEditingSchema,
} from '../validators.js';

const editing = new Map(); // cardId -> userId

export function boardHandler(io, socket, services) {
  const { projectService, cardService } = services;

  // 1) Entrar no quadro (cria sala + envia estado)
  socket.on('board:join', async (payload) => {
    try {
      const { projectId, userId } = boardJoinSchema.parse(payload);
      socket.userId = userId;
      socket.projectId = projectId;

      // Múltiplas abas: um usuário pode ter vários sockets
      socket.join(`project:${projectId}`);

      const board = await projectService.getBoard(projectId);
      socket.emit('board:state', board);

      const sockets = await io.in(`project:${projectId}`).fetchSockets();
      const onlineIds = [...new Set(sockets.map((s) => s.userId).filter(Boolean))];
      io.to(`project:${projectId}`).emit('presence:update', { onlineUserIds: onlineIds });
    } catch (e) {
      socket.emit('error', { message: 'Payload inválido em board:join', details: e.errors });
    }
  });

  // 2) Sair do quadro
  socket.on('board:leave', () => {
    if (socket.projectId) {
      socket.leave(`project:${socket.projectId}`);
      socket.to(`project:${socket.projectId}`).emit('presence:update', { left: socket.userId });
      socket.projectId = null;
    }
  });

  // 3) Movimentação de cartões em tempo real
  socket.on('card:move', async (payload) => {
    try {
      const { cardId, toColumnId, toPosition } = cardMoveSchema.parse(payload);
      if (!socket.userId) throw new Error('Não autenticado');
      const card = await cardService.move(cardId, toColumnId, toPosition, socket.userId);
      io.to(`project:${card.projectId}`).emit('card:moved', {
        cardId, toColumnId, toPosition, movedBy: socket.userId,
      });
    } catch (e) {
      socket.emit('error', { message: 'Falha ao mover cartão', details: e.errors || e.message });
    }
  });

  // 4) Indicador de "quem está editando"
  socket.on('card:editing-start', (payload) => {
    try {
      const { cardId, projectId } = cardEditingSchema.parse(payload);
      if (!socket.userId) throw new Error('Não autenticado');
      editing.set(cardId, socket.userId);
      socket.to(`project:${projectId}`).emit('card:editing', {
        cardId, userId: socket.userId,
      });
    } catch (e) {
      socket.emit('error', { message: 'Payload inválido em card:editing-start' });
    }
  });

  socket.on('card:editing-stop', (payload) => {
    try {
      const { cardId, projectId } = cardEditingSchema.parse(payload);
      editing.delete(cardId);
      socket.to(`project:${projectId}`).emit('card:editing-stop', {
        cardId, userId: socket.userId,
      });
    } catch (e) {
      socket.emit('error', { message: 'Payload inválido em card:editing-stop' });
    }
  });

  // 5) Comentário direto via WebSocket (também é possível via REST)
  socket.on('comment:create', async (payload) => {
    try {
      const schema = z.object({
        cardId: z.string().uuid(),
        content: z.string().min(1).max(1000),
      });
      const { cardId, content } = schema.parse(payload);
      if (!socket.userId) throw new Error('Não autenticado');
      const { comment, card } = await services.commentService.create({
        content, cardId, userId: socket.userId,
      });
      io.to(`project:${card.projectId}`).emit('comment:new', { cardId, comment });
      io.to(`project:${card.projectId}`).emit('notification', {
        type: 'COMMENT',
        message: `${comment.user.name} comentou em "${card.title}"`,
        cardId,
      });
    } catch (e) {
      socket.emit('error', { message: 'Falha ao comentar', details: e.errors || e.message });
    }
  });

  // Desconexão: limpar estado de edição + presença
  socket.on('disconnect', () => {
    for (const [cardId, userId] of editing.entries()) {
      if (userId === socket.userId) {
        editing.delete(cardId);
        if (socket.projectId) {
          io.to(`project:${socket.projectId}`).emit('card:editing-stop', { cardId, userId });
        }
      }
    }
  });
}
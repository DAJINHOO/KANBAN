import { Server } from 'socket.io';
import { boardHandler } from './handlers/boardHandler.js';

export function createSocketServer(httpServer, services) {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
    connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
  });

  io.on('connection', (socket) => {
    if (socket.recovered) {
      // Em caso de reconexão, recupera o último estado (se ainda válido)
      if (socket.projectId) socket.join(`project:${socket.projectId}`);
    }
    boardHandler(io, socket, services);
  });

  return io;
}
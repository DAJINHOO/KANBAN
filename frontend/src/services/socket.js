import { io } from 'socket.io-client';
let socket = null;

export function connect() {
  if (socket) return socket;
  socket = io('/', { reconnectionDelay: 1000, transports: ['websocket', 'polling'] });
  socket.on('connect', () => console.log('WS conectado'));
  socket.on('reconnect', (n) => console.log('Reconectado após', n, 'tentativas'));
  socket.on('disconnect', (r) => console.log('WS desconectado:', r));
  return socket;
}
export function getSocket() { return socket; }
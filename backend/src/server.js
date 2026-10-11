import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './adapters/http/middlewares/errorHandler.js';
import { createRoutes } from './adapters/http/routes/index.js';
import { createSocketServer } from './adapters/websocket/socketServer.js';
import {
  cardService, projectService, commentService,
} from './config/container.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const io = createSocketServer(server, { cardService, projectService, commentService });
app.use('/api', createRoutes(io));

// Servir frontend compilado (interface + API + WebSocket na mesma porta)
//const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendPath = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));
app.get(/^(?!\/(api|docs|socket\.io|health)).*/, (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(errorHandler);

server.listen(env.PORT, () => {
  console.log(`Servidor rodando em http://localhost:${env.PORT}`);
  console.log(`Docs: http://localhost:${env.PORT}/docs`);
});
import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kanban Colaborativo API',
      version: '1.0.0',
      description: 'Quadro Kanban colaborativo com WebSockets (Socket.IO)',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: ['./src/adapters/http/routes/*.js'],
});
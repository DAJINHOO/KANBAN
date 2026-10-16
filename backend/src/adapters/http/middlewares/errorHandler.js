import { ZodError } from 'zod';

export function errorHandler(err, _req, res, _next) {
  // Erro de validação Zod → 400
  if (err instanceof ZodError || err.name === 'ZodError') {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Dados inválidos',
        details: err.issues?.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
          code: i.code,
        })) || [],
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Erros de negócio (com .status setado no throw)
  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(status).json({
    error: {
      status,
      message,
      details: err.details || null,
    },
    timestamp: new Date().toISOString(),
  });
}
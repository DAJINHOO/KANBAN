export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  res.status(status).json({
    error: { status, message: err.message || 'Erro interno', details: err.details || null },
    timestamp: new Date().toISOString(),
  });
}
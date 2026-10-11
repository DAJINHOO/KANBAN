export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try { req[source] = schema.parse(req[source]); next(); }
    catch (e) { next({ status: 400, message: 'Dados inválidos', details: e.errors }); }
  };
}
export const notFound = (_req, res) => res.status(404).json({ error: 'Not found' });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
};

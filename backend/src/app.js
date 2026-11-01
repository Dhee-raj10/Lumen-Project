import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import paymentRoutes from './routes/payments.js';
import { webhook } from './controllers/payments.js';
import { notFound, errorHandler } from './middleware/errors.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // Render sits behind a proxy
  app.use(helmet());

  // Webhook first: raw body, no CORS (server-to-server), own rate limit.
  app.post(
    '/api/payments/webhook',
    rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }),
    express.raw({ type: 'application/json', limit: '1mb' }),
    webhook
  );

  app.use(cors({
    origin: (origin, cb) => (!origin || env.clientOrigins.includes(origin) ? cb(null, true) : cb(new Error('CORS: origin not allowed'))),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Idempotency-Key'],
    maxAge: 600,
  }));
  app.use(express.json({ limit: '10kb' }));
  app.use(rateLimit({ windowMs: 15 * 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, mode: env.mode, uptime: process.uptime() }));
  app.use('/api/payments', rateLimit({ windowMs: 15 * 60_000, limit: 40, standardHeaders: true, legacyHeaders: false }), paymentRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

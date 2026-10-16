import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import metaRoutes from './routes/meta.routes.js';
import transactionRoutes from './routes/transaction.routes.js';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || env.clientUrls.includes(origin));
    },
  }),
);
app.use(express.json({ limit: '10kb' }));
if (!env.isTest) app.use(morgan(env.isProduction ? 'combined' : 'dev'));

app.get('/', (_req, res) => {
  res.json({
    name: 'Expense Tracker API',
    status: 'ok',
    health: '/api/health',
    docs: 'https://github.com/adiseshan1505/Expense-Tracker/blob/main/docs/API.md',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
  });
});

app.use('/api/meta', metaRoutes);
app.use('/api/transactions', transactionRoutes);

app.use(notFound);
app.use(errorHandler);

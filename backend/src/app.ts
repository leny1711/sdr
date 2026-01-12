import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import { errorHandler } from './middlewares/error.middleware';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import discoveryRoutes from './routes/discovery.routes';
import matchRoutes from './routes/match.routes';
import conversationRoutes from './routes/conversation.routes';
import messageRoutes from './routes/message.routes';
import blockRoutes from './routes/block.routes';
import reportRoutes from './routes/report.routes';
import uploadRoutes from './routes/upload.routes';

export const createApp = (): Application => {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use('/uploads', express.static(path.join(__dirname, '..', config.storagePath)));

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api', (_req, res) => {
    res.status(200).json({
      message: 'SDR Dating API',
      version: '1.0.0',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/discovery', discoveryRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/blocks', blockRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/upload', uploadRoutes);

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not Found',
    });
  });

  app.use(errorHandler);

  return app;
};

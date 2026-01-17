import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { config } from './config/env';
import { setupSocketHandlers } from './sockets/chat.socket';
import { setSocketServer } from './sockets/gateway';
import fs from 'fs';
import path from 'path';

const app = createApp();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setSocketServer(io);
setupSocketHandlers(io);

const uploadsDir = path.join(__dirname, '..', config.storagePath);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

httpServer.listen(config.port, () => {
  console.log(`🚀 Server is running on http://localhost:${config.port}`);
  console.log(`📡 Socket.io is ready for real-time connections`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});

export { app, io };

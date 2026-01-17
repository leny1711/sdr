import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export const setSocketServer = (io: Server) => {
  ioInstance = io;
};

export const emitMessageNotification = (conversationId: string) => {
  if (!ioInstance) return;
  ioInstance.to(conversationId).emit('message:new');
};

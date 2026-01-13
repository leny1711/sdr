import prisma from '../config/database';
import { Message, MessageType } from '@prisma/client';

export class MessageService {
  static async sendTextMessage(conversationId: string, senderId: string, content: string): Promise<{ message: Message }> {
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        type: MessageType.TEXT,
        content,
      },
    });

    console.log('[CHAT] message inserted', message.id);

    return { message };
  }

  static async sendVoiceMessage(
    conversationId: string,
    senderId: string,
    audioUrl: string,
    audioDuration: number
  ) {
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        type: MessageType.VOICE,
        audioUrl,
        audioDuration,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return message;
  }
}
